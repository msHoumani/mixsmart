import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { parseUsername } from "../lib/validators";

/**
 * Internal query to fetch a MixSmart user by BetterAuth subject ID.
 */
export const getUserByAuth = internalQuery({
  args: {
    authId: v.string()
  },
  handler: async (ctx, { authId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authId))
      .first();

    return user ?? undefined;
  }
});

/**
 * Query to fetch a user summary by username for friend discovery.
 */
export const getUserByUsername = query({
  args: {
    username: v.string()
  },
  handler: async (ctx, { username }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return undefined;
    }

    const normalizedUsername = parseUsername(username);

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .first();

    if (!user) {
      return undefined;
    }

    return {
      _id: user._id,
      username: user.username,
      profilePicUrl: user.profilePicUrl
    };
  }
});
