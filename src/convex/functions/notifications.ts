import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";

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
 * Get unread notifications for current user.
 */
export const getUnreadNotifications = query({
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

    if (!user || !user.is2FAEnabled) {
      return [];
    }

    return ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", user._id).eq("isRead", false))
      .order("desc")
      .take(50);
  }
});

/**
 * Get all notifications (paginated).
 */
export const getAllNotifications = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, { limit = 20 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user || !user.is2FAEnabled) {
      return [];
    }

    if (limit <= 0) {
      throw new Error("Limit must be positive");
    }

    return ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  }
});

/**
 * Mark notification as read.
 */
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications")
  },
  handler: async (ctx, { notificationId }) => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(notificationId, { isRead: true });
    return true;
  }
});

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { markedCount: unreadNotifications.length };
  }
});

/**
 * Get unread notification count.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user || !user.is2FAEnabled) {
      return 0;
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    return notifications.length;
  }
});
