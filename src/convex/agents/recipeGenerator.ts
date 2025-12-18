import { Agent, createTool } from "@convex-dev/agent";
import { xai } from "@ai-sdk/xai";
import { stepCountIs } from "ai";
import { z } from "zod";
import { components, internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { tasteProfileValues, type TasteProfile } from "../lib/types";
import { parseWithSchema } from "../lib/validators";

/**
 * Zod schema for generated recipe structure.
 * Defines the exact shape LLM should output.
 */
const recipeSchema = z.object({
  title: z.string().describe("Creative cocktail name"),
  description: z.string().describe("Brief description of the cocktail (1-2 sentences)"),
  tasteProfiles: z.array(z.enum(tasteProfileValues)).describe("Applicable taste profiles"),
  ingredients: z
    .array(
      z.object({
        name: z.string().describe("Ingredient name"),
        volumeInMl: z.number().describe("Volume in milliliters"),
        abv: z.number().min(0).max(1).describe("Alcohol by volume (0-1, e.g., 0.4 for 40%)")
      })
    )
    .min(2)
    .describe("Recipe ingredients (minimum 2)"),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int().positive(),
        description: z.string().describe("Clear instruction for this step")
      })
    )
    .describe("Preparation steps in order")
});

/**
 * Type for generated recipe objects.
 */
type GeneratedRecipe = z.infer<typeof recipeSchema>;

/**
 * System prompt for the recipe generation agent.
 * Provides context about cocktail creation and safety considerations.
 */
const RECIPE_SYSTEM_PROMPT = `You are an expert mixologist AI assistant for MixSmart, a cocktail recipe platform.

Your role is to generate creative, safe, and delicious cocktail recipes based on user preferences.

## Guidelines

1. **Safety First**: Never suggest toxic, dangerous, or non-food-grade ingredients.
2. **Balanced Recipes**: Create well-balanced cocktails with appropriate proportions.
3. **Clear Instructions**: Provide clear, actionable preparation steps.
4. **ABV Accuracy**: Use accurate ABV values (e.g., vodka = 0.40, wine = 0.12, beer = 0.05).
5. **Minimum Ingredients**: Every recipe must have at least 2 ingredients.
6. **Metric Measurements**: Use milliliters for all volumes.

## Taste Profile Definitions
- boozy: Strong alcohol presence
- sweet: Sugar, liqueurs, or sweet mixers
- sour: Citrus or acidic components
- bitter: Bitters, Campari, or herbal elements
- umami: Savory notes (rare in cocktails)
- astringent: Dry, puckering sensation
- hot: Spicy elements
- cold: Served very cold or frozen

## Common Ingredient ABV Values
- Vodka, Rum, Whiskey, Tequila, Gin: 0.40
- Liqueurs (average): 0.20-0.30
- Vermouth: 0.15-0.18
- Wine: 0.12-0.14
- Beer: 0.04-0.08
- Non-alcoholic: 0.00

Always respond with a valid recipe following the exact schema required.`;

/**
 * Recipe Generator Agent
 *
 * AI agent for generating cocktail recipes based on user preferences.
 * Uses xAI's grok-4-1-fast-reasoning model for high-quality, creative recipe generation.
 */
export const recipeGeneratorAgent = new Agent(components.agent, {
  name: "RecipeGenerator",
  languageModel: xai("grok-4-1-fast-reasoning"),
  instructions: RECIPE_SYSTEM_PROMPT,
  stopWhen: stepCountIs(3)
});

/**
 * Validate a generated recipe for safety and completeness.
 *
 * @param recipe - Recipe to validate
 * @returns Validation result
 */
const validateGeneratedRecipe = (recipe: GeneratedRecipe): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (recipe.ingredients.length < 2) {
    issues.push("Recipe must have at least 2 ingredients");
  }

  for (const ingredient of recipe.ingredients) {
    if (ingredient.abv > 0.96) {
      issues.push(`Unrealistic ABV for ${ingredient.name}: ${ingredient.abv}`);
    }
  }

  if (recipe.steps.length === 0) {
    issues.push("Recipe must have at least one preparation step");
  }

  return { valid: issues.length === 0, issues };
};

/**
 * Tool for validating generated recipes.
 * Checks for safety and completeness.
 */
const validateRecipeTool = createTool({
  description: "Validate a generated recipe for safety and completeness",
  args: z.object({
    recipe: recipeSchema
  }),
  handler: async (_ctx, { recipe }) => validateGeneratedRecipe(recipe)
});

/**
 * Validate a generated recipe and throw if issues are found.
 *
 * @param recipe - Recipe to validate
 */
const assertValidRecipe = async (recipe: GeneratedRecipe): Promise<void> => {
  const validation = validateGeneratedRecipe(recipe);
  if (!validation.valid) {
    throw new Error(`Generated recipe failed validation: ${validation.issues.join("; ")}`);
  }
};

/**
 * Action to generate a recipe based on user preferences.
 * Returns a generated recipe without saving it (user must manually save).
 */
export const generateRecipe = action({
  args: {
    baseAlcohol: v.optional(v.string()),
    tastePreferences: v.array(v.string()),
    additionalNotes: v.optional(v.string()),
    threadId: v.optional(v.string())
  },
  handler: async (ctx, { baseAlcohol, tastePreferences, additionalNotes, threadId }) => {
    const tasteProfiles = parseWithSchema(z.array(z.enum(tasteProfileValues)), tastePreferences) as TasteProfile[];

    let prompt = "Generate a creative cocktail recipe with the following preferences:\n\n";

    if (baseAlcohol && baseAlcohol.trim().length > 0) {
      prompt += `Base alcohol: ${baseAlcohol.trim()}\n`;
    }

    if (tasteProfiles.length > 0) {
      prompt += `Taste profiles desired: ${tasteProfiles.join(", ")}\n`;
    }

    if (additionalNotes && additionalNotes.trim().length > 0) {
      prompt += `Additional notes: ${additionalNotes.trim()}\n`;
    }

    prompt += "\nGenerate a complete recipe following the required schema.";

    const result = await recipeGeneratorAgent.generateObject(
      ctx,
      { threadId: threadId?.trim() || undefined },
      {
        prompt,
        schema: recipeSchema
      }
    );

    const recipe = result.object as GeneratedRecipe;
    await assertValidRecipe(recipe);

    return recipe;
  }
});

/**
 * Action to generate a recipe and stream progress.
 * Uses Convex agent streaming for real-time UI updates.
 */
export const generateRecipeStreaming = action({
  args: {
    baseAlcohol: v.optional(v.string()),
    tastePreferences: v.array(v.string()),
    additionalNotes: v.optional(v.string()),
    threadId: v.string()
  },
  handler: async (ctx, { baseAlcohol, tastePreferences, additionalNotes, threadId }) => {
    const tasteProfiles = parseWithSchema(z.array(z.enum(tasteProfileValues)), tastePreferences) as TasteProfile[];

    let prompt = "Generate a creative cocktail recipe with the following preferences:\n\n";

    if (baseAlcohol && baseAlcohol.trim().length > 0) {
      prompt += `Base alcohol: ${baseAlcohol.trim()}\n`;
    }

    if (tasteProfiles.length > 0) {
      prompt += `Taste profiles desired: ${tasteProfiles.join(", ")}\n`;
    }

    if (additionalNotes && additionalNotes.trim().length > 0) {
      prompt += `Additional notes: ${additionalNotes.trim()}\n`;
    }

    const result = await recipeGeneratorAgent.streamObject(
      ctx,
      { threadId: threadId.trim() },
      {
        prompt,
        schema: recipeSchema
      },
      { saveStreamDeltas: true }
    );

    const finalObject = (await result.object) as GeneratedRecipe;
    await assertValidRecipe(finalObject);

    return finalObject;
  }
});

/**
 * Mutation to save a generated recipe to the database.
 * Called after user reviews and approves the AI-generated recipe.
 */
export const saveGeneratedRecipe = internalAction({
  args: {
    userId: v.id("users"),
    recipe: v.object({
      title: v.string(),
      description: v.optional(v.string()),
      tasteProfiles: v.array(v.string()),
      ingredients: v.array(
        v.object({
          name: v.string(),
          volumeInMl: v.float64(),
          abv: v.float64()
        })
      ),
      steps: v.array(
        v.object({
          stepNumber: v.float64(),
          description: v.string()
        })
      )
    }),
    visibility: v.union(v.literal("private"), v.literal("friends_only"), v.literal("public"))
  },
  handler: async (ctx, { userId, recipe, visibility }) => {
    const recipeId = await ctx.runMutation(internal.functions.recipes.createRecipeInternal, {
      creatorId: userId,
      title: recipe.title,
      description: recipe.description,
      tasteProfiles: recipe.tasteProfiles,
      visibility,
      isAIGenerated: true
    });

    for (let index = 0; index < recipe.ingredients.length; index++) {
      await ctx.runMutation(internal.functions.ingredients.addIngredientInternal, {
        recipeId,
        ...recipe.ingredients[index],
        order: index + 1
      });
    }

    for (const step of recipe.steps) {
      await ctx.runMutation(internal.functions.recipes.addStepInternal, {
        recipeId,
        stepNumber: step.stepNumber,
        description: step.description
      });
    }

    return recipeId;
  }
});
