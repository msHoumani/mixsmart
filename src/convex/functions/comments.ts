import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
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
 * Add a comment to a recipe.
 */
export const addComment = mutation({
  args: {
    recipeId: v.id("recipes"),
    text: v.string()
  },
  handler: async (ctx, { recipeId, text }) => {
    const user = await requireUser(ctx);
    const trimmed = text.trim();

    if (!trimmed) {
      throw new Error("Comment cannot be empty");
    }

    const recipe = await ctx.runQuery(internal.functions.recipes.getRecipeForViewerInternal, {
      recipeId,
      viewerId: user._id
    });

    if (!recipe) {
      throw new Error("Not authorized to comment on this recipe");
    }

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      recipeId,
      userId: user._id,
      text: trimmed,
      createdAt: now,
      updatedAt: now
    });

    if (recipe.creatorId !== user._id) {
      const creator = await ctx.db.get(recipe.creatorId);
      if (creator?.is2FAEnabled) {
        await ctx.db.insert("notifications", {
          userId: creator._id,
          type: "comment",
          relatedId: commentId,
          message: `${user.username} commented on your recipe "${recipe.title}"`,
          isRead: false,
          createdAt: now
        });
      }
    }

    return commentId;
  }
});

/**
 * Get comments for a recipe.
 */
export const getComments = query({
  args: {
    recipeId: v.id("recipes"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { recipeId, limit = 50 }) => {
    if (limit <= 0) {
      throw new Error("Limit must be positive");
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .order("desc")
      .take(limit);

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.userId as Id<"users">);
        return {
          comment,
          author: author
            ? {
                _id: author._id,
                username: author.username,
                profilePicUrl: author.profilePicUrl
              }
            : undefined
        };
      })
    );

    return commentsWithAuthors;
  }
});
