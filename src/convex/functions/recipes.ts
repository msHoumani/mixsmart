import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { parseRecipeInput, parseWithSchema } from "../lib/validators";
import { tasteProfileValues, type RecipeVisibility } from "../lib/types";
import { z } from "zod";

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
 * Fetch friend IDs for a given user.
 *
 * @param ctx - Convex query context
 * @param userId - User ID to lookup friendships for
 * @returns Array of friend IDs
 */
const getFriendIds = async (ctx: { db: any }, userId: Id<"users">): Promise<Id<"users">[]> => {
  const friendships1 = await ctx.db
    .query("friendships")
    .withIndex("by_user1", (q: any) => q.eq("userId1", userId))
    .collect();

  const friendships2 = await ctx.db
    .query("friendships")
    .withIndex("by_user2", (q: any) => q.eq("userId2", userId))
    .collect();

  return [
    ...friendships1.map((f: { userId2: Id<"users"> }) => f.userId2),
    ...friendships2.map((f: { userId1: Id<"users"> }) => f.userId1)
  ];
};

/**
 * Check whether a user can view a recipe based on visibility settings.
 *
 * @param recipe - Recipe document
 * @param userId - Viewer user ID
 * @param friendIds - Viewer friend IDs
 * @returns True when access is allowed
 */
const canViewRecipe = (recipe: Doc<"recipes">, userId: Id<"users"> | undefined, friendIds: Id<"users">[]): boolean => {
  if (recipe.visibility === "public") {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (recipe.creatorId === userId) {
    return true;
  }

  if (recipe.visibility === "friends_only") {
    return friendIds.includes(recipe.creatorId);
  }

  return false;
};

/**
 * Create a recipe document (internal use).
 */
export const createRecipeInternal = internalMutation({
  args: {
    creatorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    tasteProfiles: v.array(v.string()),
    visibility: v.union(v.literal("private"), v.literal("friends_only"), v.literal("public")),
    isAIGenerated: v.boolean()
  },
  handler: async (ctx, args) => {
    const normalizedTitle = args.title.trim();
    if (!normalizedTitle) {
      throw new Error("Recipe title is required");
    }

    const normalizedDescription = args.description?.trim() || undefined;
    const parsedTasteProfiles = parseWithSchema(z.array(z.enum(tasteProfileValues)), args.tasteProfiles);
    const recipeDoc = {
      creatorId: args.creatorId,
      title: normalizedTitle,
      tasteProfiles: parsedTasteProfiles,
      visibility: args.visibility,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isAIGenerated: args.isAIGenerated,
      currentVersion: 1,
      ...(normalizedDescription !== undefined ? { description: normalizedDescription } : {})
    };

    const recipeId = await ctx.db.insert("recipes", recipeDoc);

    return recipeId;
  }
});

/**
 * Internal mutation to add a step to a recipe.
 */
export const addStepInternal = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    stepNumber: v.float64(),
    description: v.string()
  },
  handler: async (ctx, { recipeId, stepNumber, description }) => {
    if (stepNumber <= 0) {
      throw new Error("Step number must be positive");
    }
    if (!description.trim()) {
      throw new Error("Step description is required");
    }

    const stepId = await ctx.db.insert("steps", {
      recipeId,
      stepNumber,
      description: description.trim()
    });

    return stepId;
  }
});

/**
 * Query to list recipes with visibility filters and optional search.
 */
export const listRecipes = query({
  args: {
    visibility: v.union(v.literal("all"), v.literal("public"), v.literal("friends"), v.literal("mine")),
    search: v.optional(v.string())
  },
  handler: async (ctx, { visibility, search }) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
          .first()
      : undefined;

    const viewerId = user?._id as Id<"users"> | undefined;
    const friendIds = viewerId ? await getFriendIds(ctx, viewerId) : [];
    const normalizedSearch = search?.trim().toLowerCase();

    const allRecipes = await ctx.db.query("recipes").order("desc").collect();

    const visibleRecipes = allRecipes.filter((recipe) => {
      if (visibility === "mine") {
        return viewerId !== undefined && recipe.creatorId === viewerId;
      }
      if (visibility === "public") {
        return recipe.visibility === "public";
      }
      if (visibility === "friends") {
        return viewerId !== undefined && recipe.visibility === "friends_only" && friendIds.includes(recipe.creatorId);
      }
      return canViewRecipe(recipe, viewerId, friendIds);
    });

    const filtered = normalizedSearch
      ? visibleRecipes.filter((recipe) => recipe.title.toLowerCase().includes(normalizedSearch))
      : visibleRecipes;

    const results = await Promise.all(
      filtered.map(async (recipe) => {
        const ingredients = await ctx.db
          .query("ingredients")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect();

        const likeCount = await ctx.db
          .query("likes")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect()
          .then((likes) => likes.length);

        const isLiked =
          viewerId !== undefined
            ? !!(await ctx.db
                .query("likes")
                .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipe._id).eq("userId", viewerId))
                .first())
            : false;

        const isFavorited =
          viewerId !== undefined
            ? !!(await ctx.db
                .query("favorites")
                .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipe._id).eq("userId", viewerId))
                .first())
            : false;

        return {
          recipe,
          ingredients: ingredients.sort((a, b) => a.order - b.order),
          likeCount,
          isLiked,
          isFavorited
        };
      })
    );

    return results;
  }
});

/**
 * Query to fetch a single recipe with ingredients and steps.
 */
export const getRecipe = query({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) {
      return undefined;
    }

    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
          .first()
      : undefined;

    const viewerId = user?._id as Id<"users"> | undefined;
    const friendIds = viewerId ? await getFriendIds(ctx, viewerId) : [];

    if (!canViewRecipe(recipe, viewerId, friendIds)) {
      throw new Error("Not authorized to view this recipe");
    }

    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const steps = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const likeCount = await ctx.db
      .query("likes")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect()
      .then((likes) => likes.length);

    const isLiked =
      viewerId !== undefined
        ? !!(await ctx.db
            .query("likes")
            .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipeId).eq("userId", viewerId))
            .first())
        : false;

    const isFavorited =
      viewerId !== undefined
        ? !!(await ctx.db
            .query("favorites")
            .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipeId).eq("userId", viewerId))
            .first())
        : false;

    return {
      recipe,
      ingredients: ingredients.sort((a, b) => a.order - b.order),
      steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
      likeCount,
      isLiked,
      isFavorited
    };
  }
});

/**
 * Mutation to create a recipe with ingredients and steps.
 */
export const createRecipe = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    tasteProfiles: v.array(v.string()),
    visibility: v.union(v.literal("private"), v.literal("friends_only"), v.literal("public")),
    ingredients: v.array(
      v.object({
        name: v.string(),
        volumeInMl: v.float64(),
        abv: v.float64(),
        estimatedPrice: v.optional(v.float64())
      })
    ),
    steps: v.array(
      v.object({
        stepNumber: v.float64(),
        description: v.string()
      })
    )
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const parsed = parseRecipeInput({
      title: args.title,
      description: args.description,
      tasteProfiles: args.tasteProfiles,
      visibility: args.visibility,
      ingredients: args.ingredients.map((ingredient, index) => ({
        ...ingredient,
        order: index + 1
      })),
      steps: args.steps
    });

    const recipeId = await ctx.runMutation(internal.functions.recipes.createRecipeInternal, {
      creatorId: user._id,
      title: parsed.title,
      description: parsed.description,
      tasteProfiles: parsed.tasteProfiles,
      visibility: parsed.visibility as RecipeVisibility,
      isAIGenerated: false
    });

    for (let index = 0; index < parsed.ingredients.length; index++) {
      const ingredient = parsed.ingredients[index];
      await ctx.runMutation(internal.functions.ingredients.addIngredientInternal, {
        recipeId,
        name: ingredient.name,
        volumeInMl: ingredient.volumeInMl,
        abv: ingredient.abv,
        order: ingredient.order ?? index + 1,
        estimatedPrice: ingredient.estimatedPrice
      });
    }

    for (const step of parsed.steps) {
      await ctx.runMutation(internal.functions.recipes.addStepInternal, {
        recipeId,
        stepNumber: step.stepNumber,
        description: step.description
      });
    }

    return recipeId;
  }
});

/**
 * Mutation to update a recipe and create a version snapshot.
 */
export const updateRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    title: v.string(),
    description: v.optional(v.string()),
    tasteProfiles: v.array(v.string()),
    visibility: v.union(v.literal("private"), v.literal("friends_only"), v.literal("public")),
    ingredients: v.array(
      v.object({
        name: v.string(),
        volumeInMl: v.float64(),
        abv: v.float64(),
        estimatedPrice: v.optional(v.float64())
      })
    ),
    steps: v.array(
      v.object({
        stepNumber: v.float64(),
        description: v.string()
      })
    ),
    changeNote: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    if (recipe.creatorId !== user._id) {
      throw new Error("Not authorized to update this recipe");
    }

    const parsed = parseRecipeInput({
      title: args.title,
      description: args.description,
      tasteProfiles: args.tasteProfiles,
      visibility: args.visibility,
      ingredients: args.ingredients.map((ingredient, index) => ({
        ...ingredient,
        order: index + 1
      })),
      steps: args.steps
    });

    await ctx.runMutation(internal.functions.versions.createVersionSnapshot, {
      recipeId: args.recipeId,
      changeNote: args.changeNote?.trim() || undefined
    });

    const normalizedDescription = parsed.description?.trim() || undefined;

    const patch: Partial<Doc<"recipes">> = {
      title: parsed.title,
      tasteProfiles: parsed.tasteProfiles,
      visibility: parsed.visibility,
      updatedAt: Date.now()
    };

    if (normalizedDescription !== undefined) {
      patch.description = normalizedDescription;
    }

    await ctx.db.patch(args.recipeId, patch);

    const existingIngredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const ingredient of existingIngredients) {
      await ctx.db.delete(ingredient._id);
    }

    const existingSteps = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const step of existingSteps) {
      await ctx.db.delete(step._id);
    }

    for (let index = 0; index < parsed.ingredients.length; index++) {
      const ingredient = parsed.ingredients[index];
      await ctx.runMutation(internal.functions.ingredients.addIngredientInternal, {
        recipeId: args.recipeId,
        name: ingredient.name,
        volumeInMl: ingredient.volumeInMl,
        abv: ingredient.abv,
        order: ingredient.order ?? index + 1,
        estimatedPrice: ingredient.estimatedPrice
      });
    }

    for (const step of parsed.steps) {
      await ctx.runMutation(internal.functions.recipes.addStepInternal, {
        recipeId: args.recipeId,
        stepNumber: step.stepNumber,
        description: step.description
      });
    }

    return true;
  }
});

/**
 * Mutation to delete a recipe and related data.
 */
export const deleteRecipe = mutation({
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
      throw new Error("Not authorized to delete this recipe");
    }

    const ingredientIds = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const ingredient of ingredientIds) {
      await ctx.db.delete(ingredient._id);
    }

    const stepIds = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const step of stepIds) {
      await ctx.db.delete(step._id);
    }

    const likeIds = await ctx.db
      .query("likes")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const like of likeIds) {
      await ctx.db.delete(like._id);
    }

    const favoriteIds = await ctx.db
      .query("favorites")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const favorite of favoriteIds) {
      await ctx.db.delete(favorite._id);
    }

    const commentIds = await ctx.db
      .query("comments")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const comment of commentIds) {
      await ctx.db.delete(comment._id);
    }

    const versions = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    const searchRuns = await ctx.db
      .query("ingredientSearchRuns")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();
    for (const run of searchRuns) {
      const results = await ctx.db
        .query("ingredientSearchResults")
        .withIndex("by_run", (q) => q.eq("runId", run._id))
        .collect();
      for (const result of results) {
        await ctx.db.delete(result._id);
      }
      await ctx.db.delete(run._id);
    }

    await ctx.db.delete(recipeId);
    return true;
  }
});

/**
 * Query to search recipes by title.
 */
export const searchRecipes = query({
  args: {
    query: v.string()
  },
  handler: async (ctx, { query: searchQuery }) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
          .first()
      : undefined;

    const viewerId = user?._id as Id<"users"> | undefined;
    const friendIds = viewerId ? await getFriendIds(ctx, viewerId) : [];
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return [];
    }

    const results = await ctx.db
      .query("recipes")
      .withSearchIndex("search_title", (q) => q.search("title", trimmed))
      .collect();

    return results.filter((recipe) => canViewRecipe(recipe, viewerId, friendIds));
  }
});

/**
 * Mutation to save an AI-generated recipe after user approval.
 */
export const saveAIGeneratedRecipe = mutation({
  args: {
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
  handler: async (ctx, { recipe, visibility }) => {
    const user = await requireUser(ctx);

    const parsed = parseRecipeInput({
      title: recipe.title,
      description: recipe.description,
      tasteProfiles: recipe.tasteProfiles,
      visibility,
      ingredients: recipe.ingredients.map((ingredient, index) => ({
        ...ingredient,
        order: index + 1
      })),
      steps: recipe.steps
    });

    const recipeId = await ctx.runAction(internal.agents.recipeGenerator.saveGeneratedRecipe, {
      userId: user._id,
      recipe: {
        title: parsed.title,
        description: parsed.description,
        tasteProfiles: parsed.tasteProfiles,
        ingredients: parsed.ingredients.map((ingredient) => ({
          name: ingredient.name,
          volumeInMl: ingredient.volumeInMl,
          abv: ingredient.abv
        })),
        steps: parsed.steps.map((step) => ({
          stepNumber: step.stepNumber,
          description: step.description
        }))
      },
      visibility: parsed.visibility
    });

    return recipeId;
  }
});

/**
 * Internal query to fetch a recipe for an authenticated viewer.
 */
export const getRecipeForViewerInternal = internalQuery({
  args: {
    recipeId: v.id("recipes"),
    viewerId: v.optional(v.id("users"))
  },
  handler: async (ctx, { recipeId, viewerId }) => {
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) {
      return undefined;
    }

    const friendIds = viewerId ? await getFriendIds(ctx, viewerId) : [];

    if (!canViewRecipe(recipe, viewerId, friendIds)) {
      return undefined;
    }

    return recipe;
  }
});
