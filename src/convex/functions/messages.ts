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
 * Verify that two users are friends.
 *
 * @param ctx - Convex query context
 * @param userId - First user ID
 * @param otherUserId - Second user ID
 * @returns True if friendship exists
 */
const verifyFriendship = async (ctx: { db: any }, userId: Id<"users">, otherUserId: Id<"users">): Promise<boolean> => {
  const [id1, id2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
  const friendship = await ctx.db
    .query("friendships")
    .withIndex("by_user1", (q: any) => q.eq("userId1", id1))
    .filter((q: any) => q.eq(q.field("userId2"), id2))
    .first();

  return Boolean(friendship);
};

/**
 * Send a direct message to a friend.
 */
export const sendMessage = mutation({
  args: {
    receiverId: v.id("users"),
    text: v.string(),
    attachmentUrls: v.optional(v.array(v.string()))
  },
  handler: async (ctx, { receiverId, text, attachmentUrls }) => {
    const sender = await requireUser(ctx);

    if (!(await verifyFriendship(ctx, sender._id, receiverId))) {
      throw new Error("Can only message friends");
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error("Message cannot be empty");
    }

    const normalizedAttachments = (attachmentUrls ?? []).map((url) => url.trim());
    if (normalizedAttachments.some((url) => !url)) {
      throw new Error("Attachment URLs must be non-empty strings");
    }

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      senderId: sender._id,
      receiverId,
      text: trimmedText,
      attachmentUrls: normalizedAttachments,
      createdAt: now,
      updatedAt: now,
      isRead: false
    });

    const receiver = await ctx.db.get(receiverId);
    if (receiver?.is2FAEnabled) {
      await ctx.db.insert("notifications", {
        userId: receiverId,
        type: "message",
        relatedId: messageId,
        message: `New message from ${sender.username}`,
        isRead: false,
        createdAt: now
      });
    }

    return messageId;
  }
});

/**
 * Get conversation messages between current user and another user.
 * Messages are returned in chronological order.
 */
export const getConversation = query({
  args: {
    otherUserId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { otherUserId, limit = 50 }) => {
    const user = await requireUser(ctx);
    if (limit <= 0) {
      throw new Error("Limit must be positive");
    }

    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("senderId", user._id).eq("receiverId", otherUserId))
      .order("desc")
      .take(limit);

    const receivedMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("senderId", otherUserId).eq("receiverId", user._id))
      .order("desc")
      .take(limit);

    return [...sentMessages, ...receivedMessages].sort((a, b) => a.createdAt - b.createdAt).slice(-limit);
  }
});

/**
 * Get list of conversations (most recent message per friend).
 */
export const getConversationList = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", user._id))
      .order("desc")
      .collect();

    const receivedMessages = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .order("desc")
      .collect();

    const conversationMap = new Map<Id<"users">, (typeof sentMessages)[number]>();

    for (const msg of [...sentMessages, ...receivedMessages]) {
      const partnerId = msg.senderId === user._id ? msg.receiverId : msg.senderId;
      const existing = conversationMap.get(partnerId);

      if (!existing || msg.createdAt > existing.createdAt) {
        conversationMap.set(partnerId, msg);
      }
    }

    const conversations = await Promise.all(
      Array.from(conversationMap.entries()).map(async ([partnerId, lastMessage]) => {
        const partner = await ctx.db.get(partnerId);
        const unreadCount = receivedMessages.filter((m) => m.senderId === partnerId && !m.isRead).length;

        return {
          partnerId,
          partner: partner
            ? {
                _id: partner._id,
                username: partner.username,
                profilePicUrl: partner.profilePicUrl
              }
            : undefined,
          lastMessage: {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt,
            isFromMe: lastMessage.senderId === user._id
          },
          unreadCount
        };
      })
    );

    return conversations.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);
  }
});

/**
 * Mark messages as read.
 */
export const markAsRead = mutation({
  args: {
    senderId: v.id("users")
  },
  handler: async (ctx, { senderId }) => {
    const user = await requireUser(ctx);

    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("senderId", senderId).eq("receiverId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const msg of unreadMessages) {
      await ctx.db.patch(msg._id, { isRead: true });
    }

    return { markedCount: unreadMessages.length };
  }
});

/**
 * Edit a sent message.
 */
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    text: v.string()
  },
  handler: async (ctx, { messageId, text }) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(messageId);
    if (!message || message.senderId !== user._id) {
      throw new Error("Cannot edit this message");
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error("Message cannot be empty");
    }

    await ctx.db.patch(messageId, {
      text: trimmedText,
      updatedAt: Date.now()
    });

    return true;
  }
});
