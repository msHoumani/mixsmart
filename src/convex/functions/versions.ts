import { query, internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Resolve the current MixSmart user or throw if not authenticated.
 *
 * @param ctx - Convex query or mutation context
 * @returns User document
 */
const requireUser = async (ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> }; db: any }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  return user as Doc<"users">;
};

/**
 * Create a new version snapshot of a recipe.
 * Called automatically when recipe is updated.
 */
export const createVersionSnapshot = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    changeNote: v.optional(v.string())
  },
  handler: async (ctx, { recipeId, changeNote }) => {
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }

    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const steps = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const existingVersions = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const nextVersion = existingVersions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;

    const normalizedChangeNote = changeNote?.trim() || undefined;

    const versionDoc = {
      recipeId,
      versionNumber: nextVersion,
      snapshot: {
        title: recipe.title,
        description: recipe.description,
        ingredients: ingredients.map((ingredient) => ({
          name: ingredient.name,
          volumeInMl: ingredient.volumeInMl,
          abv: ingredient.abv,
          order: ingredient.order
        })),
        steps: steps.map((step) => ({
          stepNumber: step.stepNumber,
          description: step.description
        }))
      },
      createdAt: Date.now(),
      ...(normalizedChangeNote !== undefined ? { changeNote: normalizedChangeNote } : {})
    };

    const versionId = await ctx.db.insert("recipeVersions", versionDoc);

    await ctx.db.patch(recipeId, { currentVersion: nextVersion });

    return { versionId, versionNumber: nextVersion };
  }
});

/**
 * Get all versions of a recipe.
 */
export const getRecipeVersions = query({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    const user = await requireUser(ctx);
    const recipe = await ctx.db.get(recipeId);

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    if (recipe.creatorId !== user._id) {
      throw new Error("Not authorized to view versions");
    }

    const versions = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .order("desc")
      .collect();

    return versions;
  }
});

/**
 * Revert recipe to a previous version.
 */
export const revertToVersion = mutation({
  args: {
    recipeId: v.id("recipes"),
    versionNumber: v.number()
  },
  handler: async (ctx, { recipeId, versionNumber }) => {
    const user = await requireUser(ctx);
    const recipe = await ctx.db.get(recipeId);

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    if (recipe.creatorId !== user._id) {
      throw new Error("Not authorized to revert this recipe");
    }

    const targetVersion = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .filter((q) => q.eq(q.field("versionNumber"), versionNumber))
      .first();

    if (!targetVersion) {
      throw new Error("Version not found");
    }

    await ctx.db.patch(recipeId, {
      title: targetVersion.snapshot.title,
      description: targetVersion.snapshot.description,
      updatedAt: Date.now(),
      currentVersion: versionNumber
    });

    const currentIngredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const ingredient of currentIngredients) {
      await ctx.db.delete(ingredient._id);
    }

    const currentSteps = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const step of currentSteps) {
      await ctx.db.delete(step._id);
    }

    for (const ingredient of targetVersion.snapshot.ingredients) {
      await ctx.db.insert("ingredients", {
        recipeId,
        name: ingredient.name,
        volumeInMl: ingredient.volumeInMl,
        abv: ingredient.abv,
        order: ingredient.order
      });
    }

    for (const step of targetVersion.snapshot.steps) {
      await ctx.db.insert("steps", {
        recipeId,
        stepNumber: step.stepNumber,
        description: step.description
      });
    }

    return { success: true, revertedToVersion: versionNumber };
  }
});

/**
 * Compare two versions of a recipe.
 */
export const compareVersions = query({
  args: {
    recipeId: v.id("recipes"),
    version1: v.number(),
    version2: v.number()
  },
  handler: async (ctx, { recipeId, version1, version2 }) => {
    const user = await requireUser(ctx);
    const recipe = await ctx.db.get(recipeId);

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    if (recipe.creatorId !== user._id) {
      throw new Error("Not authorized to compare versions");
    }

    const versions = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const v1 = versions.find((version) => version.versionNumber === version1);
    const v2 = versions.find((version) => version.versionNumber === version2);

    if (!v1 || !v2) {
      throw new Error("Version not found");
    }

    const titleChanged = v1.snapshot.title !== v2.snapshot.title;
    const descriptionChanged = v1.snapshot.description !== v2.snapshot.description;

    const ingredientsDiff = {
      added: v2.snapshot.ingredients.filter(
        (ingredient) => !v1.snapshot.ingredients.some((i) => i.name === ingredient.name)
      ),
      removed: v1.snapshot.ingredients.filter(
        (ingredient) => !v2.snapshot.ingredients.some((i) => i.name === ingredient.name)
      ),
      modified: v2.snapshot.ingredients.filter((ingredient) => {
        const previous = v1.snapshot.ingredients.find((i) => i.name === ingredient.name);
        return (
          previous &&
          (previous.volumeInMl !== ingredient.volumeInMl ||
            previous.abv !== ingredient.abv ||
            previous.order !== ingredient.order)
        );
      })
    };

    const stepsDiff = {
      countChange: v2.snapshot.steps.length - v1.snapshot.steps.length,
      changed:
        v1.snapshot.steps.length !== v2.snapshot.steps.length ||
        v1.snapshot.steps.some((step, index) => v2.snapshot.steps[index]?.description !== step.description)
    };

    return {
      version1: v1,
      version2: v2,
      diff: {
        titleChanged,
        descriptionChanged,
        ingredients: ingredientsDiff,
        steps: stepsDiff
      }
    };
  }
});
