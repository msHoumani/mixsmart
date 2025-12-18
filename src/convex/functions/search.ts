import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";

/**
 * Resolve the current MixSmart user or throw if not authenticated.
 *
 * @param ctx - Convex query context
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
 * Internal query to fetch a search run by ID.
 */
export const getSearchRun = internalQuery({
  args: {
    runId: v.id("ingredientSearchRuns")
  },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    return run ?? undefined;
  }
});

/**
 * Internal query to fetch ingredient search results by run ID.
 */
export const getSearchResults = internalQuery({
  args: {
    runId: v.id("ingredientSearchRuns")
  },
  handler: async (ctx, { runId }) => {
    return ctx.db
      .query("ingredientSearchResults")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
  }
});

/**
 * Public query to fetch a search run and its results for the current user.
 */
export const getSearchRunWithResults = query({
  args: {
    runId: v.id("ingredientSearchRuns")
  },
  handler: async (ctx, { runId }) => {
    const user = await requireUser(ctx);
    const run = await ctx.db.get(runId);

    if (!run) {
      return undefined;
    }

    if (run.userId !== user._id) {
      throw new Error("Not authorized to view this search run");
    }

    const results = await ctx.db
      .query("ingredientSearchResults")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();

    return {
      run,
      results
    };
  }
});
