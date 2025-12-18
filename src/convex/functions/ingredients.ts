import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { ingredientInputSchema, parseWithSchema } from "../lib/validators";

/**
 * Internal mutation to add an ingredient to a recipe.
 */
export const addIngredientInternal = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    name: v.string(),
    volumeInMl: v.float64(),
    abv: v.float64(),
    order: v.float64(),
    estimatedPrice: v.optional(v.float64())
  },
  handler: async (ctx, { recipeId, name, volumeInMl, abv, order, estimatedPrice }) => {
    const parsed = parseWithSchema(ingredientInputSchema, {
      name,
      volumeInMl,
      abv,
      order,
      estimatedPrice
    });

    const ingredientId = await ctx.db.insert("ingredients", {
      recipeId,
      name: parsed.name,
      volumeInMl: parsed.volumeInMl,
      abv: parsed.abv,
      estimatedPrice: parsed.estimatedPrice,
      order: parsed.order ?? order
    });

    return ingredientId;
  }
});

/**
 * Internal query to fetch ingredients for a recipe.
 */
export const getByRecipe = internalQuery({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    return ingredients.sort((a, b) => a.order - b.order);
  }
});
