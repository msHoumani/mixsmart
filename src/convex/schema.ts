import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * MixSmart Database Schema
 *
 * Defines all tables, fields, and indexes for the cocktail recipe platform.
 * Uses Convex validators for type-safe schema enforcement.
 */
export default defineSchema({
  /**
   * Users Table
   * Stores user account information and profile data.
   * Note: Core auth data (sessions, accounts) managed by BetterAuth component.
   */
  users: defineTable({
    /** BetterAuth user ID reference */
    authUserId: v.string(),
    /** Unique username for display and login */
    username: v.string(),
    /** Whether 2FA is enabled (required for notifications) */
    is2FAEnabled: v.boolean(),
    /** User's ZIP code for local ingredient sourcing (optional) */
    zipCode: v.optional(v.string()),
    /** Biological sex for BAC calculation: "male" | "female" (optional) */
    biologicalSex: v.optional(v.union(v.literal("male"), v.literal("female"))),
    /** Weight in kilograms for BAC calculation (optional) */
    weightInKg: v.optional(v.float64()),
    /** Email address for 2FA and notifications (optional) */
    email: v.optional(v.string()),
    /** Phone number for 2FA (optional) */
    phoneNumber: v.optional(v.string()),
    /** Profile picture URL (optional) */
    profilePicUrl: v.optional(v.string()),
    /** Account creation timestamp */
    createdAt: v.float64(),
    /** Age verification completed flag */
    ageVerified: v.boolean()
  })
    .index("by_authUserId", ["authUserId"])
    .index("by_username", ["username"]),

  /**
   * Recipes Table
   * Core recipe data including ingredients, steps, and metadata.
   */
  recipes: defineTable({
    /** Reference to creator user */
    creatorId: v.id("users"),
    /** Recipe title */
    title: v.string(),
    /** Optional recipe description */
    description: v.optional(v.string()),
    /** Array of taste profile tags */
    tasteProfiles: v.array(
      v.union(
        v.literal("boozy"),
        v.literal("sweet"),
        v.literal("sour"),
        v.literal("bitter"),
        v.literal("umami"),
        v.literal("astringent"),
        v.literal("hot"),
        v.literal("cold")
      )
    ),
    /** Visibility setting: "private" | "friends_only" | "public" */
    visibility: v.union(v.literal("private"), v.literal("friends_only"), v.literal("public")),
    /** Recipe creation timestamp */
    createdAt: v.float64(),
    /** Last update timestamp */
    updatedAt: v.float64(),
    /** Whether recipe was AI-generated */
    isAIGenerated: v.boolean(),
    /** Current version number for versioning */
    currentVersion: v.float64()
  })
    .index("by_creator", ["creatorId"])
    .index("by_visibility", ["visibility"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["visibility", "creatorId"]
    }),

  /**
   * Ingredients Table
   * Individual ingredients belonging to recipes.
   */
  ingredients: defineTable({
    /** Reference to parent recipe */
    recipeId: v.id("recipes"),
    /** Ingredient name */
    name: v.string(),
    /** Volume in milliliters */
    volumeInMl: v.float64(),
    /** Alcohol by volume percentage (0.0 to 1.0) */
    abv: v.float64(),
    /** Estimated price in USD (optional) */
    estimatedPrice: v.optional(v.float64()),
    /** Order position in recipe */
    order: v.float64()
  }).index("by_recipe", ["recipeId"]),

  /**
   * Steps Table
   * Preparation steps for recipes.
   */
  steps: defineTable({
    /** Reference to parent recipe */
    recipeId: v.id("recipes"),
    /** Step number (1-indexed) */
    stepNumber: v.float64(),
    /** Step description/instructions */
    description: v.string()
  }).index("by_recipe", ["recipeId"]),

  /**
   * Recipe Versions Table
   * Historical versions for recipe change tracking.
   */
  recipeVersions: defineTable({
    /** Reference to parent recipe */
    recipeId: v.id("recipes"),
    /** Version number */
    versionNumber: v.float64(),
    /** Snapshot of recipe data at this version */
    snapshot: v.object({
      title: v.string(),
      description: v.optional(v.string()),
      ingredients: v.array(
        v.object({
          name: v.string(),
          volumeInMl: v.float64(),
          abv: v.float64(),
          order: v.float64()
        })
      ),
      steps: v.array(
        v.object({
          stepNumber: v.float64(),
          description: v.string()
        })
      )
    }),
    /** Version creation timestamp */
    createdAt: v.float64(),
    /** Optional change description */
    changeNote: v.optional(v.string())
  }).index("by_recipe", ["recipeId"]),

  /**
   * Friendships Table
   * Bidirectional friend relationships between users.
   */
  friendships: defineTable({
    /** First user in friendship (lower ID) */
    userId1: v.id("users"),
    /** Second user in friendship (higher ID) */
    userId2: v.id("users"),
    /** Friendship creation timestamp */
    createdAt: v.float64()
  })
    .index("by_user1", ["userId1"])
    .index("by_user2", ["userId2"]),

  /**
   * Friend Requests Table
   * Pending friend request management.
   */
  friendRequests: defineTable({
    /** User who sent the request */
    senderId: v.id("users"),
    /** User who received the request */
    receiverId: v.id("users"),
    /** Request status: "pending" | "accepted" | "declined" */
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    /** Request creation timestamp */
    createdAt: v.float64()
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_receiver_status", ["receiverId", "status"]),

  /**
   * Likes Table
   * User likes on recipes.
   */
  likes: defineTable({
    /** Recipe being liked */
    recipeId: v.id("recipes"),
    /** User who liked */
    userId: v.id("users"),
    /** Like creation timestamp */
    createdAt: v.float64()
  })
    .index("by_recipe", ["recipeId"])
    .index("by_user", ["userId"])
    .index("by_recipe_user", ["recipeId", "userId"]),

  /**
   * Favorites Table
   * User-saved favorite recipes.
   */
  favorites: defineTable({
    /** Recipe being favorited */
    recipeId: v.id("recipes"),
    /** User who favorited */
    userId: v.id("users"),
    /** Favorite creation timestamp */
    createdAt: v.float64()
  })
    .index("by_recipe", ["recipeId"])
    .index("by_user", ["userId"])
    .index("by_recipe_user", ["recipeId", "userId"]),

  /**
   * Comments Table
   * User comments on recipes.
   */
  comments: defineTable({
    /** Recipe being commented on */
    recipeId: v.id("recipes"),
    /** User who commented */
    userId: v.id("users"),
    /** Comment text content */
    text: v.string(),
    /** Comment creation timestamp */
    createdAt: v.float64(),
    /** Last edit timestamp */
    updatedAt: v.float64()
  })
    .index("by_recipe", ["recipeId"])
    .index("by_user", ["userId"]),

  /**
   * Messages Table
   * Direct messages between users.
   */
  messages: defineTable({
    /** Message sender */
    senderId: v.id("users"),
    /** Message receiver */
    receiverId: v.id("users"),
    /** Message text content */
    text: v.string(),
    /** Optional attachment URLs */
    attachmentUrls: v.array(v.string()),
    /** Message creation timestamp */
    createdAt: v.float64(),
    /** Last edit timestamp */
    updatedAt: v.float64(),
    /** Read status */
    isRead: v.boolean()
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_conversation", ["senderId", "receiverId"]),

  /**
   * Notifications Table
   * User notifications for various events.
   */
  notifications: defineTable({
    /** User receiving notification */
    userId: v.id("users"),
    /** Notification type */
    type: v.union(
      v.literal("like"),
      v.literal("favorite"),
      v.literal("comment"),
      v.literal("friend_request"),
      v.literal("friend_accepted"),
      v.literal("message")
    ),
    /** Related entity ID (recipe, user, etc.) */
    relatedId: v.string(),
    /** Notification message */
    message: v.string(),
    /** Read status */
    isRead: v.boolean(),
    /** Creation timestamp */
    createdAt: v.float64()
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  /**
   * Ingredient Search Runs Table
   * Persisted local ingredient sourcing searches.
   */
  ingredientSearchRuns: defineTable({
    /** User who initiated search */
    userId: v.id("users"),
    /** Recipe being sourced */
    recipeId: v.id("recipes"),
    /** User's ZIP code for search */
    zipCode: v.string(),
    /** Search status: "running" | "completed" | "failed" */
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    /** Creation timestamp */
    createdAt: v.float64(),
    /** Completion timestamp */
    completedAt: v.optional(v.float64()),
    /** Error message if failed */
    errorMessage: v.optional(v.string())
  })
    .index("by_user", ["userId"])
    .index("by_recipe", ["recipeId"])
    .index("by_user_recipe", ["userId", "recipeId"]),

  /**
   * Ingredient Search Results Table
   * Individual product results from ingredient searches.
   */
  ingredientSearchResults: defineTable({
    /** Parent search run */
    runId: v.id("ingredientSearchRuns"),
    /** Ingredient name searched */
    ingredientName: v.string(),
    /** Array of matching products */
    products: v.array(
      v.object({
        /** Product title */
        title: v.string(),
        /** Product URL on retailer site */
        url: v.string(),
        /** Price text (e.g., "$24.99") */
        priceText: v.optional(v.string()),
        /** Size text (e.g., "750ml") */
        sizeText: v.optional(v.string()),
        /** Confidence score (0-1) */
        confidence: v.float64(),
        /** Retailer/vendor name */
        vendor: v.string()
      })
    ),
    /** Result creation timestamp */
    createdAt: v.float64()
  }).index("by_run", ["runId"])
});
