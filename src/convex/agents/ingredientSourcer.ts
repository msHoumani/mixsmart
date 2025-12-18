import { Agent } from "@convex-dev/agent";
import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { z } from "zod";
import { components, internal } from "../_generated/api";
import { action, internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { parseWithSchema, parseZipCode } from "../lib/validators";

/**
 * Schema for ingredient search results.
 */
const productResultSchema = z.object({
  title: z.string().describe("Product name"),
  url: z.string().url().describe("Product URL on retailer site"),
  priceText: z.string().optional().describe("Price text if available"),
  sizeText: z.string().optional().describe("Size/volume text if available"),
  confidence: z.number().min(0).max(1).describe("Match confidence score")
});

const ingredientResultSchema = z.object({
  ingredientName: z.string(),
  zipCode: z.string(),
  products: z.array(productResultSchema)
});

/**
 * Type for extracted ingredient search results.
 */
type IngredientResult = z.infer<typeof ingredientResultSchema>;

/**
 * System prompt for the ingredient sourcing agent.
 */
const SOURCING_SYSTEM_PROMPT = `You are an ingredient sourcing assistant for MixSmart.

Your job is to help users find cocktail ingredients at local retailers.

When processing search results:
1. Filter for actual product pages (not category pages)
2. Extract price and size information when visible
3. Prioritize exact ingredient matches over similar products
4. Assign confidence scores based on match quality

Focus on totalwine.com product pages as the primary source.`;

/**
 * Ingredient Sourcer Agent
 *
 * AI agent for finding local purchase options for cocktail ingredients.
 * Uses xAI's grok-4-1-fast-reasoning model for extraction.
 */
export const ingredientSourcerAgent = new Agent(components.agent, {
  name: "IngredientSourcer",
  languageModel: xai("grok-4-1-fast-reasoning"),
  instructions: SOURCING_SYSTEM_PROMPT
});

/**
 * Search for an ingredient using xAI's web search with domain restriction.
 * Uses the Responses API with the web_search tool limited to totalwine.com.
 *
 * @param ingredientName - Name of the ingredient to search for
 * @param zipCode - User's ZIP code for local results
 * @returns Search results with product information and sources
 */
const searchIngredientWithWebSearch = async (
  ingredientName: string,
  zipCode: string
): Promise<{ text: string; sources: Array<{ url: string }> }> => {
  const normalizedIngredient = ingredientName.trim();
  if (!normalizedIngredient) {
    throw new Error("Ingredient name is required");
  }

  const normalizedZip = parseZipCode(zipCode);

  const { text, sources } = await generateText({
    model: xai.responses("grok-4-1-fast-reasoning"),
    prompt: `Find "${normalizedIngredient}" available for purchase near ZIP code ${normalizedZip}.
Return product names, prices, sizes, and direct product page URLs.
Focus on finding the best matches for this specific cocktail ingredient.`,
    tools: {
      web_search: xai.tools.webSearch({
        allowedDomains: ["www.totalwine.com"]
      })
    }
  });

  return {
    text,
    sources: sources
      .filter((source): source is { sourceType: "url"; url: string } => source.sourceType === "url")
      .map((source) => ({ url: source.url }))
  };
};

/**
 * Create an ingredient search run.
 * Persists the search for later reference.
 */
export const createSearchRun = internalMutation({
  args: {
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    zipCode: v.string()
  },
  handler: async (ctx, { userId, recipeId, zipCode }) => {
    const runId = await ctx.db.insert("ingredientSearchRuns", {
      userId,
      recipeId,
      zipCode: parseZipCode(zipCode),
      status: "running",
      createdAt: Date.now()
    });

    return runId;
  }
});

/**
 * Update search run status.
 */
export const updateSearchRunStatus = internalMutation({
  args: {
    runId: v.id("ingredientSearchRuns"),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    errorMessage: v.optional(v.string())
  },
  handler: async (ctx, { runId, status, errorMessage }) => {
    const patch: { status: "running" | "completed" | "failed"; completedAt?: number; errorMessage?: string } = {
      status
    };

    if (status !== "running") {
      patch.completedAt = Date.now();
    }

    const normalizedError = errorMessage?.trim() || undefined;
    if (normalizedError !== undefined) {
      patch.errorMessage = normalizedError;
    }

    await ctx.db.patch(runId, patch);
  }
});

/**
 * Save ingredient search results.
 */
export const saveIngredientResults = internalMutation({
  args: {
    runId: v.id("ingredientSearchRuns"),
    ingredientName: v.string(),
    products: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        priceText: v.optional(v.string()),
        sizeText: v.optional(v.string()),
        confidence: v.float64(),
        vendor: v.string()
      })
    )
  },
  handler: async (ctx, { runId, ingredientName, products }) => {
    const normalizedName = ingredientName.trim();
    if (!normalizedName) {
      throw new Error("Ingredient name is required");
    }

    const parsedProducts = parseWithSchema(z.array(productResultSchema), products).map((product) => ({
      ...product,
      vendor: "Total Wine"
    }));

    await ctx.db.insert("ingredientSearchResults", {
      runId,
      ingredientName: normalizedName,
      products: parsedProducts,
      createdAt: Date.now()
    });
  }
});

/**
 * Main action to source ingredients for a recipe.
 * Creates a search run and processes each ingredient using xAI's web search.
 */
export const sourceIngredientsForRecipe = action({
  args: {
    recipeId: v.id("recipes"),
    zipCode: v.string()
  },
  handler: async (ctx, { recipeId, zipCode }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(internal.functions.users.getUserByAuth, {
      authId: identity.subject
    });

    if (!user) {
      throw new Error("User not found");
    }

    const recipe = await ctx.runQuery(internal.functions.recipes.getRecipeForViewerInternal, {
      recipeId,
      viewerId: user._id
    });

    if (!recipe) {
      throw new Error("Not authorized to source ingredients for this recipe");
    }

    const ingredients = await ctx.runQuery(internal.functions.ingredients.getByRecipe, {
      recipeId
    });

    if (ingredients.length === 0) {
      throw new Error("No ingredients found for recipe");
    }

    const runId = await ctx.runMutation(internal.agents.ingredientSourcer.createSearchRun, {
      userId: user._id,
      recipeId,
      zipCode
    });

    try {
      for (const ingredient of ingredients) {
        const searchResults = await searchIngredientWithWebSearch(ingredient.name, zipCode);

        const { object: extracted } = await ingredientSourcerAgent.generateObject(
          ctx,
          {},
          {
            prompt: `Extract product information from these search results for "${ingredient.name}":

Search response: ${searchResults.text}

Sources found: ${JSON.stringify(searchResults.sources, undefined, 2)}

Return structured product data with confidence scores based on how well each result matches the ingredient.
Only include products from totalwine.com URLs.`,
            schema: ingredientResultSchema
          }
        );

        const parsed = parseWithSchema(ingredientResultSchema, extracted) as IngredientResult;

        const filteredProducts = parsed.products
          .filter((product) => product.url.includes("totalwine.com"))
          .map((product) => ({
            ...product,
            vendor: "Total Wine"
          }));

        await ctx.runMutation(internal.agents.ingredientSourcer.saveIngredientResults, {
          runId,
          ingredientName: ingredient.name,
          products: filteredProducts
        });
      }

      await ctx.runMutation(internal.agents.ingredientSourcer.updateSearchRunStatus, {
        runId,
        status: "completed"
      });

      return { runId, success: true };
    } catch (error) {
      await ctx.runMutation(internal.agents.ingredientSourcer.updateSearchRunStatus, {
        runId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
});

/**
 * Query to get search run with results.
 */
export const getSearchRunWithResults = internalAction({
  args: {
    runId: v.id("ingredientSearchRuns")
  },
  handler: async (ctx, { runId }) => {
    const run = await ctx.runQuery(internal.functions.search.getSearchRun, { runId });

    if (!run) {
      return undefined;
    }

    const results = await ctx.runQuery(internal.functions.search.getSearchResults, { runId });

    return {
      run,
      results
    };
  }
});
