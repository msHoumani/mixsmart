import { Agent } from "@convex-dev/agent";
import { xai } from "@ai-sdk/xai";
import { z } from "zod";
import { components } from "../_generated/api";
import { action } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { tasteProfileValues, type TasteProfile } from "../lib/types";
import { parseWithSchema } from "../lib/validators";

/**
 * Schema for recommendation outputs.
 */
const recommendationSchema = z.object({
  rankedIds: z.array(z.string()).describe("Recipe IDs ordered from most to least recommended")
});

/**
 * System prompt for the recommendation engine.
 */
const RECOMMENDATION_SYSTEM_PROMPT = `You are a recommendation assistant for MixSmart.

Your job is to rank recipes based on the user's taste preferences and any provided context.
Return only recipe IDs in order of recommendation.`;

/**
 * Recommendation Engine Agent.
 *
 * Uses xAI's grok-4-1-fast-reasoning model to rank recipes.
 */
export const recommendationEngineAgent = new Agent(components.agent, {
  name: "RecommendationEngine",
  languageModel: xai("grok-4-1-fast-reasoning"),
  instructions: RECOMMENDATION_SYSTEM_PROMPT
});

/**
 * Fetch friend IDs for a user.
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
 * Determine whether a user can view a recipe.
 *
 * @param recipe - Recipe document
 * @param viewerId - Viewer user ID
 * @param friendIds - Viewer friend IDs
 * @returns True if visible to the user
 */
const canViewRecipe = (
  recipe: Doc<"recipes">,
  viewerId: Id<"users"> | undefined,
  friendIds: Id<"users">[]
): boolean => {
  if (recipe.visibility === "public") {
    return true;
  }
  if (!viewerId) {
    return false;
  }
  if (recipe.creatorId === viewerId) {
    return true;
  }
  return recipe.visibility === "friends_only" && friendIds.includes(recipe.creatorId);
};

/**
 * Action to get recipe recommendations.
 */
export const getRecommendations = action({
  args: {
    tastePreferences: v.optional(v.array(v.string())),
    maxResults: v.optional(v.number())
  },
  handler: async (ctx, { tastePreferences, maxResults = 10 }) => {
    if (maxResults <= 0) {
      throw new Error("maxResults must be positive");
    }

    const parsedPreferences = parseWithSchema(z.array(z.enum(tasteProfileValues)).optional(), tastePreferences) as
      | TasteProfile[]
      | undefined;

    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
          .first()
      : undefined;

    const viewerId = user?._id as Id<"users"> | undefined;
    const friendIds = viewerId ? await getFriendIds(ctx, viewerId) : [];

    const recipes = await ctx.db.query("recipes").order("desc").collect();
    const visibleRecipes = recipes.filter((recipe) => canViewRecipe(recipe, viewerId, friendIds));

    if (!parsedPreferences || parsedPreferences.length === 0) {
      return visibleRecipes.slice(0, maxResults);
    }

    const prompt = `Rank the following recipes based on these taste preferences: ${parsedPreferences.join(", ")}.
Return the recipe IDs in order of relevance.

Recipes:
${visibleRecipes
  .map(
    (recipe) =>
      `- ${recipe._id}: ${recipe.title} [${recipe.tasteProfiles.join(", ")}]` +
      (recipe.isAIGenerated ? " (AI generated)" : "")
  )
  .join("\n")}`;

    const result = await recommendationEngineAgent.generateObject(ctx, {}, { prompt, schema: recommendationSchema });
    const rankedIds = result.object.rankedIds;

    const ordered = rankedIds
      .map((id) => visibleRecipes.find((recipe) => recipe._id === id))
      .filter(Boolean) as Doc<"recipes">[];

    if (ordered.length > 0) {
      return ordered.slice(0, maxResults);
    }

    return visibleRecipes.slice(0, maxResults);
  }
});
