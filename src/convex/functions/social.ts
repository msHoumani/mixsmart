import { query, mutation } from "../_generated/server";
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
 * Normalize friendship IDs to consistent ordering.
 *
 * @param userId - First user ID
 * @param otherUserId - Second user ID
 * @returns Ordered tuple for friendship storage
 */
const normalizeFriendshipIds = (userId: Id<"users">, otherUserId: Id<"users">) =>
  userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

/**
 * Send a friend request to another user.
 */
export const sendFriendRequest = mutation({
  args: {
    receiverId: v.id("users")
  },
  handler: async (ctx, { receiverId }) => {
    const sender = await requireUser(ctx);

    if (sender._id === receiverId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const receiver = await ctx.db.get(receiverId);
    if (!receiver) {
      throw new Error("Receiver not found");
    }

    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", sender._id))
      .filter((q) => q.eq(q.field("receiverId"), receiverId))
      .first();

    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    const [id1, id2] = normalizeFriendshipIds(sender._id, receiverId);

    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", id1))
      .filter((q) => q.eq(q.field("userId2"), id2))
      .first();

    if (existingFriendship) {
      throw new Error("Already friends");
    }

    const requestId = await ctx.db.insert("friendRequests", {
      senderId: sender._id,
      receiverId,
      status: "pending",
      createdAt: Date.now()
    });

    if (receiver.is2FAEnabled) {
      await ctx.db.insert("notifications", {
        userId: receiverId,
        type: "friend_request",
        relatedId: requestId,
        message: `${sender.username} sent you a friend request`,
        isRead: false,
        createdAt: Date.now()
      });
    }

    return requestId;
  }
});

/**
 * Accept a friend request.
 */
export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests")
  },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.receiverId !== user._id) {
      throw new Error("Not authorized to accept this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.patch(requestId, { status: "accepted" });

    const [id1, id2] = normalizeFriendshipIds(request.senderId, request.receiverId);
    await ctx.db.insert("friendships", {
      userId1: id1,
      userId2: id2,
      createdAt: Date.now()
    });

    const sender = await ctx.db.get(request.senderId);
    if (sender?.is2FAEnabled) {
      await ctx.db.insert("notifications", {
        userId: request.senderId,
        type: "friend_accepted",
        relatedId: user._id,
        message: `${user.username} accepted your friend request`,
        isRead: false,
        createdAt: Date.now()
      });
    }

    return true;
  }
});

/**
 * Decline a friend request.
 */
export const declineFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests")
  },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(requestId);

    if (!request || request.receiverId !== user._id) {
      throw new Error("Not authorized to decline this request");
    }

    await ctx.db.patch(requestId, { status: "declined" });
    return true;
  }
});

/**
 * Remove a friend.
 */
export const removeFriend = mutation({
  args: {
    friendId: v.id("users")
  },
  handler: async (ctx, { friendId }) => {
    const user = await requireUser(ctx);

    const [id1, id2] = normalizeFriendshipIds(user._id, friendId);
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", id1))
      .filter((q) => q.eq(q.field("userId2"), id2))
      .first();

    if (!friendship) {
      throw new Error("Friendship not found");
    }

    await ctx.db.delete(friendship._id);
    return true;
  }
});

/**
 * Get user's friends list.
 */
export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const friendships1 = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", user._id))
      .collect();

    const friendships2 = await ctx.db
      .query("friendships")
      .withIndex("by_user2", (q) => q.eq("userId2", user._id))
      .collect();

    const friendIds = [...friendships1.map((f) => f.userId2), ...friendships2.map((f) => f.userId1)];
    const friends = await Promise.all(friendIds.map((id) => ctx.db.get(id)));

    return friends.filter(Boolean);
  }
});

/**
 * Get pending friend requests for current user.
 */
export const getPendingFriendRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiver_status", (q) => q.eq("receiverId", user._id).eq("status", "pending"))
      .collect();

    const requestsWithSenders = await Promise.all(
      requests.map(async (request) => {
        const sender = await ctx.db.get(request.senderId);
        return {
          ...request,
          sender: sender
            ? {
                _id: sender._id,
                username: sender.username,
                profilePicUrl: sender.profilePicUrl
              }
            : undefined
        };
      })
    );

    return requestsWithSenders;
  }
});

/**
 * Toggle like on a recipe.
 */
export const toggleLike = mutation({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    const user = await requireUser(ctx);

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipeId).eq("userId", user._id))
      .first();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      return { liked: false };
    }

    await ctx.db.insert("likes", {
      recipeId,
      userId: user._id,
      createdAt: Date.now()
    });

    const recipe = await ctx.db.get(recipeId);
    if (recipe && recipe.creatorId !== user._id) {
      const creator = await ctx.db.get(recipe.creatorId);
      if (creator?.is2FAEnabled) {
        await ctx.db.insert("notifications", {
          userId: creator._id,
          type: "like",
          relatedId: recipeId,
          message: `${user.username} liked your recipe "${recipe.title}"`,
          isRead: false,
          createdAt: Date.now()
        });
      }
    }

    return { liked: true };
  }
});

/**
 * Toggle favorite on a recipe.
 */
export const toggleFavorite = mutation({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    const user = await requireUser(ctx);

    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipeId).eq("userId", user._id))
      .first();

    if (existingFavorite) {
      await ctx.db.delete(existingFavorite._id);
      return { favorited: false };
    }

    await ctx.db.insert("favorites", {
      recipeId,
      userId: user._id,
      createdAt: Date.now()
    });

    const recipe = await ctx.db.get(recipeId);
    if (recipe && recipe.creatorId !== user._id) {
      const creator = await ctx.db.get(recipe.creatorId);
      if (creator?.is2FAEnabled) {
        await ctx.db.insert("notifications", {
          userId: creator._id,
          type: "favorite",
          relatedId: recipeId,
          message: `${user.username} saved your recipe "${recipe.title}"`,
          isRead: false,
          createdAt: Date.now()
        });
      }
    }

    return { favorited: true };
  }
});

/**
 * Get user's favorite recipes.
 */
export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const recipes = await Promise.all(favorites.map((fav) => ctx.db.get(fav.recipeId)));
    return recipes.filter(Boolean);
  }
});

/**
 * Check if user is friends with another user.
 */
export const checkFriendship = query({
  args: {
    otherUserId: v.id("users")
  },
  handler: async (ctx, { otherUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isFriend: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      return { isFriend: false };
    }

    const [id1, id2] = normalizeFriendshipIds(user._id, otherUserId);
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", id1))
      .filter((q) => q.eq(q.field("userId2"), id2))
      .first();

    return { isFriend: !!friendship };
  }
});
