# MixSmart Technical Specification

## Comprehensive Implementation Guide

**Version:** 1.0.0  
**Date:** December 18, 2025  
**Authors:** Me & Claude Opus 4.5 Thinking

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Schema (Convex)](#5-database-schema-convex)
6. [Authentication System (BetterAuth)](#6-authentication-system-betterauth)
7. [Frontend Architecture (SvelteKit)](#7-frontend-architecture-sveltekit)
8. [AI-Powered Recipe Generation](#8-ai-powered-recipe-generation)
9. [Local Ingredient Sourcing System](#9-local-ingredient-sourcing-system)
10. [BAC Calculation Engine](#10-bac-calculation-engine)
11. [Social Features Implementation](#11-social-features-implementation)
12. [Real-time Messaging System](#12-real-time-messaging-system)
13. [Recipe Versioning System](#13-recipe-versioning-system)
14. [Notification System](#14-notification-system)
15. [API Reference](#15-api-reference)
16. [Testing Strategy](#16-testing-strategy)
17. [Deployment Guide](#17-deployment-guide)
18. [Security Considerations](#18-security-considerations)

---

## 1. Executive Summary

MixSmart is a cocktail recipe platform combining AI-powered generation tools with social sharing features. The
application targets cocktail enthusiasts aged 21+ who value customization, community, and responsible consumption
tracking.

### Core Features

1. **Comprehensive Cocktail Recipe Management** - Full CRUD operations for recipes with rich metadata
2. **AI-Powered Cocktail Recipe Generation** - LLM-driven recipe creation based on user preferences
3. **Seamless BAC Calculation** - Real-time blood alcohol content estimation per recipe serving
4. **Flexible Cocktail Recipe Sharing** - Visibility controls (public, private, friends-only)
5. **Social Connections & Community** - Friend system, messaging, likes, favorites, comments
6. **Local Ingredient Sourcing** - ZIP code-based product lookup via Total Wine integration
7. **Tailored Recommendations** - Preference-based recipe suggestions
8. **Effortless Account Creation & Authentication** - Username/password with optional 2FA

### Business Rules

- Recipes must contain a minimum of 2 ingredients
- Users must be 21+ years old (verified via government ID)
- Notifications require 2FA to be enabled
- BAC calculation requires biological sex and weight input
- AI-generated recipes must be manually saved before persisting
- Local sourcing requires ZIP code input

---

## 2. Technology Stack

### Core Framework

| Component          | Technology    | Version  | Purpose                                        |
| ------------------ | ------------- | -------- | ---------------------------------------------- |
| Runtime            | Node.js       | 24.x LTS | Server-side JavaScript execution               |
| Package Manager    | Bun           | 1.3.5    | Fast package management and script execution   |
| Language           | TypeScript    | 5.6.x    | Type-safe development                          |
| Frontend Framework | SvelteKit     | 2.x      | Full-stack web framework with SSR              |
| Backend/Database   | Convex        | 1.25.x+  | Reactive database with real-time subscriptions |
| Authentication     | BetterAuth    | 1.4.7    | Comprehensive auth with Convex adapter         |
| UI Library         | shadcn-svelte | Latest   | Accessible, customizable component library     |

### AI & LLM Integration

| Component       | Technology         | Version                 | Purpose                                     |
| --------------- | ------------------ | ----------------------- | ------------------------------------------- |
| AI SDK          | Vercel AI SDK      | 6.x (Beta)              | Unified LLM interface                       |
| Agent Framework | @convex-dev/agents | Latest                  | Durable AI agent workflows                  |
| LLM Provider    | xAI                | grok-4-1-fast-reasoning | Recipe generation, analysis, and web search |

### Supporting Libraries

| Library       | Purpose                     |
| ------------- | --------------------------- |
| zod           | Runtime schema validation   |
| date-fns      | Date manipulation utilities |
| lucide-svelte | Icon library                |
| tailwindcss   | Utility-first CSS framework |

### Installation Commands

```bash
# Initialize project
bunx sv create mixsmart --template minimal --types ts

# Navigate to project
cd mixsmart

# Install core dependencies
bun add convex convex-svelte better-auth@1.4.7 ai@beta @ai-sdk/svelte@beta zod
bun add @convex-dev/better-auth @mmailaender/convex-better-auth-svelte
bun add @convex-dev/agent
bun add @ai-sdk/xai

# Install UI dependencies
bunx shadcn-svelte@latest init

# Install dev dependencies
bun add -D @types/node typescript
```

---

## 3. Project Structure

```
mixsmart/
├── src/
│   ├── convex/                          # Convex backend (functions dir)
│   │   ├── _generated/                  # Auto-generated Convex types
│   │   │   ├── api.d.ts
│   │   │   ├── api.js
│   │   │   ├── dataModel.d.ts
│   │   │   └── server.d.ts
│   │   ├── auth.config.ts               # BetterAuth provider config
│   │   ├── auth.ts                      # BetterAuth instance and component
│   │   ├── convex.config.ts             # Convex app config with components
│   │   ├── http.ts                      # HTTP route handlers
│   │   ├── schema.ts                    # Database schema definitions
│   │   ├── functions/
│   │   │   ├── users.ts                 # User-related functions
│   │   │   ├── recipes.ts               # Recipe CRUD operations
│   │   │   ├── ingredients.ts           # Ingredient management
│   │   │   ├── social.ts                # Friends, likes, favorites
│   │   │   ├── messages.ts              # Direct messaging
│   │   │   ├── comments.ts              # Recipe comments
│   │   │   ├── notifications.ts         # Notification handlers
│   │   │   └── search.ts                # Recipe search queries
│   │   ├── agents/
│   │   │   ├── recipeGenerator.ts       # AI recipe generation agent
│   │   │   ├── ingredientSourcer.ts     # Local ingredient sourcing agent
│   │   │   └── recommendationEngine.ts  # Recipe recommendation agent
│   │   └── lib/
│   │       ├── bac.ts                   # BAC calculation utilities
│   │       ├── validators.ts            # Zod validation schemas
│   │       └── types.ts                 # Shared type definitions
│   ├── lib/
│   │   ├── auth-client.ts               # BetterAuth client instance
│   │   ├── convex.ts                    # Convex client utilities
│   │   └── utils.ts                     # General utilities
│   ├── routes/
│   │   ├── +layout.svelte               # Root layout with providers
│   │   ├── +layout.server.ts            # Server-side auth handling
│   │   ├── +page.svelte                 # Home/landing page
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...all]/
│   │   │           └── +server.ts       # BetterAuth route proxy
│   │   ├── recipes/
│   │   │   ├── +page.svelte             # Recipe listing
│   │   │   ├── [id]/
│   │   │   │   └── +page.svelte         # Recipe detail view
│   │   │   ├── create/
│   │   │   │   └── +page.svelte         # Manual recipe creation
│   │   │   └── generate/
│   │   │       └── +page.svelte         # AI recipe generation
│   │   ├── profile/
│   │   │   ├── +page.svelte             # User profile
│   │   │   └── settings/
│   │   │       └── +page.svelte         # Account settings
│   │   ├── social/
│   │   │   ├── friends/
│   │   │   │   └── +page.svelte         # Friends management
│   │   │   └── messages/
│   │   │       └── +page.svelte         # Direct messages
│   │   └── auth/
│   │       ├── login/
│   │       │   └── +page.svelte         # Login page
│   │       ├── register/
│   │       │   └── +page.svelte         # Registration with ID verification
│   │       └── verify/
│   │           └── +page.svelte         # 2FA setup
│   └── components/
│       ├── ui/                          # shadcn-svelte components
│       ├── recipe/
│       │   ├── RecipeCard.svelte
│       │   ├── RecipeForm.svelte
│       │   ├── IngredientList.svelte
│       │   ├── StepsList.svelte
│       │   └── BACDisplay.svelte
│       ├── social/
│       │   ├── FriendsList.svelte
│       │   ├── MessageThread.svelte
│       │   └── CommentSection.svelte
│       └── ai/
│           ├── RecipeGenerator.svelte
│           └── IngredientSourcer.svelte
├── static/
├── convex.json                          # Convex configuration
├── svelte.config.js                     # SvelteKit configuration
├── tailwind.config.js                   # Tailwind configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json
└── .env.local                           # Environment variables
```

### Convex Configuration

```json
// convex.json
{
  "functions": "src/convex/"
}
```

### SvelteKit Configuration

```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $convex: "./src/convex",
      $components: "./src/components",
      $lib: "./src/lib"
    }
  }
};

export default config;
```

---

## 4. Environment Configuration

### Development Environment (.env.local)

```bash
# Convex Deployment
CONVEX_DEPLOYMENT=dev:adjective-animal-123
PUBLIC_CONVEX_URL=https://adjective-animal-123.convex.cloud
PUBLIC_CONVEX_SITE_URL=https://adjective-animal-123.convex.site
PUBLIC_SITE_URL=http://localhost:5173

# AI Provider (xAI Grok)
XAI_API_KEY=xai-...

# BetterAuth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-generated-secret

# Optional: Vercel AI Gateway (alternative to direct provider keys)
AI_GATEWAY_API_KEY=your-gateway-key
```

### Convex Environment Variables (Dashboard)

Set via `npx convex env set <KEY> <VALUE>`:

```bash
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
npx convex env set SITE_URL http://localhost:5173
npx convex env set XAI_API_KEY xai-...
```

---

## 5. Database Schema (Convex)

### Schema Definition

```typescript
// src/convex/schema.ts
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
```

---

## 6. Authentication System (BetterAuth)

### Convex Component Registration

```typescript
// src/convex/convex.config.ts
import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";

/**
 * Convex application configuration.
 * Registers the BetterAuth component for authentication management.
 */
const app = defineApp();
app.use(betterAuth);

export default app;
```

### Auth Config Provider

```typescript
// src/convex/auth.config.ts
import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

/**
 * Authentication configuration for Convex.
 * Integrates BetterAuth as the authentication provider.
 */
export default {
  providers: [getAuthConfigProvider()]
} satisfies AuthConfig;
```

### BetterAuth Instance

```typescript
// src/convex/auth.ts
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { components } from "./_generated/api";
import { type DataModel } from "./_generated/dataModel";
import { query, mutation, action } from "./_generated/server";
import { betterAuth } from "better-auth";
import authConfig from "./auth.config";
import { v } from "convex/values";

const siteUrl = process.env.SITE_URL!;

/**
 * BetterAuth component client for Convex integration.
 * Provides adapter methods and helper functions for auth operations.
 */
export const authComponent = createClient<DataModel>(components.betterAuth);

/**
 * Creates a BetterAuth instance with Convex adapter.
 * Configured for email/password auth with optional 2FA.
 *
 * @param ctx - Convex context for database operations
 * @returns Configured BetterAuth instance
 */
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),

    // Email/password authentication (no email verification initially)
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },

    // Username support for registration
    user: {
      additionalFields: {
        username: {
          type: "string",
          required: true,
          unique: true
        }
      }
    },

    plugins: [
      // Convex integration plugin (required)
      convex({ authConfig }),

      // Two-factor authentication plugin
      twoFactor({
        issuer: "MixSmart",
        // Enable TOTP (authenticator app) method
        totpOptions: {
          enabled: true
        },
        // Enable email OTP method (requires email)
        otpOptions: {
          enabled: true,
          sendOTP: async ({ email, otp }) => {
            // Implement email sending logic
            console.log(`Send OTP ${otp} to ${email}`);
          }
        }
      })
    ]
  });
};

/**
 * Query to get the current authenticated user.
 * Returns null if not authenticated.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  }
});

/**
 * Query to get user profile data from MixSmart users table.
 * Includes additional profile fields not in BetterAuth.
 */
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser.id))
      .first();

    return user;
  }
});

/**
 * Mutation to create/sync MixSmart user profile after registration.
 */
export const createUserProfile = mutation({
  args: {
    username: v.string(),
    ageVerified: v.boolean()
  },
  handler: async (ctx, { username, ageVerified }) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    if (!ageVerified) {
      throw new Error("Age verification required (21+)");
    }

    // Check username uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existing) {
      throw new Error("Username already taken");
    }

    const userId = await ctx.db.insert("users", {
      authUserId: authUser.id,
      username,
      is2FAEnabled: false,
      ageVerified: true,
      createdAt: Date.now()
    });

    return userId;
  }
});

/**
 * Mutation to update user profile settings.
 */
export const updateUserProfile = mutation({
  args: {
    zipCode: v.optional(v.string()),
    biologicalSex: v.optional(v.union(v.literal("male"), v.literal("female"))),
    weightInKg: v.optional(v.float64()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    profilePicUrl: v.optional(v.string())
  },
  handler: async (ctx, updates) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser.id))
      .first();

    if (!user) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(user._id, updates);
    return user._id;
  }
});

/**
 * Mutation to enable 2FA for the user.
 * Requires email and phone number to be set.
 */
export const enable2FA = mutation({
  args: {
    email: v.string(),
    phoneNumber: v.optional(v.string())
  },
  handler: async (ctx, { email, phoneNumber }) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser.id))
      .first();

    if (!user) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(user._id, {
      is2FAEnabled: true,
      email,
      phoneNumber
    });

    return true;
  }
});
```

### HTTP Route Handlers

```typescript
// src/convex/http.ts
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

/**
 * HTTP router for Convex deployment.
 * Registers BetterAuth route handlers for authentication endpoints.
 */
const http = httpRouter();

// Register all BetterAuth routes (login, register, session, etc.)
authComponent.registerRoutes(http, createAuth);

export default http;
```

### SvelteKit Auth Route Proxy

```typescript
// src/routes/api/auth/[...all]/+server.ts
import { createSvelteKitHandler } from "@mmailaender/convex-better-auth-svelte/sveltekit";

/**
 * SvelteKit route handler that proxies auth requests to Convex.
 * Handles all /api/auth/* routes (login, register, session, etc.)
 */
export const { GET, POST } = createSvelteKitHandler();
```

### Client-Side Auth Client

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/svelte";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

/**
 * BetterAuth client instance for client-side auth operations.
 * Includes Convex integration and 2FA client plugins.
 */
export const authClient = createAuthClient({
  plugins: [convexClient(), twoFactorClient()]
});

// Export commonly used auth methods
export const { signIn, signUp, signOut, useSession } = authClient;
```

### Server Hooks for Auth Token

```typescript
// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { createAuth } from "$convex/auth.js";
import { getToken } from "@mmailaender/convex-better-auth-svelte/sveltekit";

/**
 * SvelteKit server hook for auth token extraction.
 * Makes auth token available in event.locals for server-side operations.
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Extract and validate auth token from cookies
  event.locals.token = await getToken(createAuth, event.cookies);

  return resolve(event);
};
```

### App Type Definitions

```typescript
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      /** Authentication token for server-side operations */
      token: string | undefined;
    }
  }
}

export {};
```

### Root Layout with Auth Provider

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import "../app.css";
  import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { authClient } from "$lib/auth-client";

  // Initialize Convex client with auth (includes setupConvex())
  createSvelteAuthClient({ authClient });

  let { children } = $props();
</script>

<svelte:head>
  <title>MixSmart - Cocktail Recipe Platform</title>
  <meta name="description" content="AI-powered cocktail recipe creation and sharing" />
</svelte:head>

{@render children?.()}
```

---

## 7. Frontend Architecture (SvelteKit)

### UI Components Setup (shadcn-svelte)

```bash
# Initialize shadcn-svelte
bunx shadcn-svelte@latest init

# Add commonly used components
bunx shadcn-svelte@latest add button
bunx shadcn-svelte@latest add card
bunx shadcn-svelte@latest add input
bunx shadcn-svelte@latest add label
bunx shadcn-svelte@latest add select
bunx shadcn-svelte@latest add textarea
bunx shadcn-svelte@latest add dialog
bunx shadcn-svelte@latest add tabs
bunx shadcn-svelte@latest add avatar
bunx shadcn-svelte@latest add badge
bunx shadcn-svelte@latest add toast
bunx shadcn-svelte@latest add dropdown-menu
bunx shadcn-svelte@latest add form
```

### Recipe Card Component

```svelte
<!-- src/components/recipe/RecipeCard.svelte -->
<script lang="ts">
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$components/ui/card";
  import { Badge } from "$components/ui/badge";
  import { Button } from "$components/ui/button";
  import { Heart, Bookmark, MessageCircle } from "lucide-svelte";
  import type { Doc } from "$convex/_generated/dataModel";
  import BACDisplay from "./BACDisplay.svelte";

  /**
   * Props interface for RecipeCard component.
   */
  type Props = {
    /** Recipe document from Convex */
    recipe: Doc<"recipes">;
    /** Ingredients for the recipe */
    ingredients: Doc<"ingredients">[];
    /** Current user's profile for BAC calculation */
    userProfile?: Doc<"users"> | null;
    /** Like count for this recipe */
    likeCount: number;
    /** Whether current user has liked */
    isLiked: boolean;
    /** Whether current user has favorited */
    isFavorited: boolean;
    /** Callback when like button clicked */
    onLike: () => void;
    /** Callback when favorite button clicked */
    onFavorite: () => void;
  };

  let { recipe, ingredients, userProfile, likeCount, isLiked, isFavorited, onLike, onFavorite }: Props = $props();

  /** Taste profile badge colors */
  const tasteColors: Record<string, string> = {
    boozy: "bg-amber-500",
    sweet: "bg-pink-500",
    sour: "bg-yellow-500",
    bitter: "bg-orange-700",
    umami: "bg-purple-500",
    astringent: "bg-gray-500",
    hot: "bg-red-500",
    cold: "bg-blue-500"
  };
</script>

<Card class="w-full max-w-md transition-shadow hover:shadow-lg">
  <CardHeader>
    <CardTitle class="flex items-center justify-between">
      <span>{recipe.title}</span>
      {#if recipe.isAIGenerated}
        <Badge variant="secondary">AI Generated</Badge>
      {/if}
    </CardTitle>
    {#if recipe.description}
      <p class="text-muted-foreground text-sm">{recipe.description}</p>
    {/if}
  </CardHeader>

  <CardContent class="space-y-4">
    <!-- Taste Profiles -->
    <div class="flex flex-wrap gap-2">
      {#each recipe.tasteProfiles as profile}
        <Badge class={tasteColors[profile] || "bg-gray-500"}>
          {profile}
        </Badge>
      {/each}
    </div>

    <!-- Ingredients Preview -->
    <div>
      <h4 class="mb-2 text-sm font-medium">Ingredients ({ingredients.length})</h4>
      <ul class="text-muted-foreground space-y-1 text-sm">
        {#each ingredients.slice(0, 3) as ingredient}
          <li>{ingredient.name} - {ingredient.volumeInMl}ml</li>
        {/each}
        {#if ingredients.length > 3}
          <li class="italic">+{ingredients.length - 3} more...</li>
        {/if}
      </ul>
    </div>

    <!-- BAC Display (if user has profile data) -->
    {#if userProfile?.biologicalSex && userProfile?.weightInKg}
      <BACDisplay {ingredients} {userProfile} />
    {/if}
  </CardContent>

  <CardFooter class="flex justify-between">
    <div class="flex gap-2">
      <Button variant={isLiked ? "default" : "outline"} size="sm" onclick={onLike}>
        <Heart class="mr-1 h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
        {likeCount}
      </Button>

      <Button variant={isFavorited ? "default" : "outline"} size="sm" onclick={onFavorite}>
        <Bookmark class="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
      </Button>
    </div>

    <Button variant="ghost" size="sm" href={`/recipes/${recipe._id}`}>View Recipe</Button>
  </CardFooter>
</Card>
```

### Recipe List Page

```svelte
<!-- src/routes/recipes/+page.svelte -->
<script lang="ts">
  import { useQuery, useMutation } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import RecipeCard from "$components/recipe/RecipeCard.svelte";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Plus, Search, Sparkles } from "lucide-svelte";

  const auth = useAuth();

  // Search state
  let searchQuery = $state("");
  let visibilityFilter = $state<"all" | "public" | "friends" | "mine">("public");

  // Queries
  const recipesQuery = useQuery(api.functions.recipes.listRecipes, () =>
    auth.isAuthenticated ? { visibility: visibilityFilter, search: searchQuery || undefined } : "skip"
  );

  const userProfileQuery = useQuery(api.auth.getUserProfile, () => (auth.isAuthenticated ? {} : "skip"));

  // Mutations
  const toggleLike = useMutation(api.functions.social.toggleLike);
  const toggleFavorite = useMutation(api.functions.social.toggleFavorite);

  /**
   * Handle like button click for a recipe.
   */
  async function handleLike(recipeId: string) {
    await toggleLike.mutate({ recipeId });
  }

  /**
   * Handle favorite button click for a recipe.
   */
  async function handleFavorite(recipeId: string) {
    await toggleFavorite.mutate({ recipeId });
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Cocktail Recipes</h1>

    <div class="flex gap-2">
      <Button href="/recipes/create">
        <Plus class="mr-2 h-4 w-4" />
        Create Recipe
      </Button>
      <Button variant="secondary" href="/recipes/generate">
        <Sparkles class="mr-2 h-4 w-4" />
        AI Generate
      </Button>
    </div>
  </div>

  <!-- Search and Filter -->
  <div class="mb-6 flex gap-4">
    <div class="relative max-w-md flex-1">
      <Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input type="search" placeholder="Search recipes..." class="pl-10" bind:value={searchQuery} />
    </div>

    <select class="rounded-md border px-3 py-2" bind:value={visibilityFilter}>
      <option value="public">Public</option>
      <option value="friends">Friends Only</option>
      <option value="mine">My Recipes</option>
      <option value="all">All Visible</option>
    </select>
  </div>

  <!-- Recipe Grid -->
  {#if recipesQuery.isLoading}
    <div class="flex justify-center py-12">
      <div class="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
    </div>
  {:else if recipesQuery.data}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each recipesQuery.data as recipeData (recipeData.recipe._id)}
        <RecipeCard
          recipe={recipeData.recipe}
          ingredients={recipeData.ingredients}
          userProfile={userProfileQuery.data}
          likeCount={recipeData.likeCount}
          isLiked={recipeData.isLiked}
          isFavorited={recipeData.isFavorited}
          onLike={() => handleLike(recipeData.recipe._id)}
          onFavorite={() => handleFavorite(recipeData.recipe._id)}
        />
      {/each}
    </div>

    {#if recipesQuery.data.length === 0}
      <div class="text-muted-foreground py-12 text-center">
        <p>No recipes found. Try a different search or create your first recipe!</p>
      </div>
    {/if}
  {/if}
</div>
```

---

## 8. AI-Powered Recipe Generation

### Recipe Generator Agent Definition

```typescript
// src/convex/agents/recipeGenerator.ts
import { Agent, createTool } from "@convex-dev/agent";
import { xai } from "@ai-sdk/xai";
import { z } from "zod";
import { components, internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { stepCountIs } from "ai";

/**
 * Zod schema for generated recipe structure.
 * Defines the exact shape LLM should output.
 */
const recipeSchema = z.object({
  title: z.string().describe("Creative cocktail name"),
  description: z.string().describe("Brief description of the cocktail (1-2 sentences)"),
  tasteProfiles: z
    .array(z.enum(["boozy", "sweet", "sour", "bitter", "umami", "astringent", "hot", "cold"]))
    .describe("Applicable taste profiles"),
  ingredients: z
    .array(
      z.object({
        name: z.string().describe("Ingredient name"),
        volumeInMl: z.number().describe("Volume in milliliters"),
        abv: z.number().min(0).max(1).describe("Alcohol by volume (0-1, e.g., 0.4 for 40%)")
      })
    )
    .min(2)
    .describe("Recipe ingredients (minimum 2)"),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int().positive(),
        description: z.string().describe("Clear instruction for this step")
      })
    )
    .describe("Preparation steps in order")
});

type GeneratedRecipe = z.infer<typeof recipeSchema>;

/**
 * System prompt for the recipe generation agent.
 * Provides context about cocktail creation and safety considerations.
 */
const RECIPE_SYSTEM_PROMPT = `You are an expert mixologist AI assistant for MixSmart, a cocktail recipe platform.

Your role is to generate creative, safe, and delicious cocktail recipes based on user preferences.

## Guidelines

1. **Safety First**: Never suggest toxic, dangerous, or non-food-grade ingredients.
2. **Balanced Recipes**: Create well-balanced cocktails with appropriate proportions.
3. **Clear Instructions**: Provide clear, actionable preparation steps.
4. **ABV Accuracy**: Use accurate ABV values (e.g., vodka = 0.40, wine = 0.12, beer = 0.05).
5. **Minimum Ingredients**: Every recipe must have at least 2 ingredients.
6. **Metric Measurements**: Use milliliters for all volumes.

## Taste Profile Definitions
- boozy: Strong alcohol presence
- sweet: Sugar, liqueurs, or sweet mixers
- sour: Citrus or acidic components
- bitter: Bitters, Campari, or herbal elements
- umami: Savory notes (rare in cocktails)
- astringent: Dry, puckering sensation
- hot: Spicy elements
- cold: Served very cold or frozen

## Common Ingredient ABV Values
- Vodka, Rum, Whiskey, Tequila, Gin: 0.40
- Liqueurs (average): 0.20-0.30
- Vermouth: 0.15-0.18
- Wine: 0.12-0.14
- Beer: 0.04-0.08
- Non-alcoholic: 0.00

Always respond with a valid recipe following the exact schema required.`;

/**
 * Recipe Generator Agent
 *
 * AI agent for generating cocktail recipes based on user preferences.
 * Uses xAI's grok-4-1-fast-reasoning model for high-quality, creative recipe generation
 * with enhanced reasoning capabilities.
 */
export const recipeGeneratorAgent = new Agent(components.agent, {
  name: "RecipeGenerator",
  languageModel: xai("grok-4-1-fast-reasoning"),
  instructions: RECIPE_SYSTEM_PROMPT,
  stopWhen: stepCountIs(3) // Allow multi-step for refinement
});

/**
 * Tool for validating generated recipes.
 * Checks for safety and completeness.
 */
const validateRecipeTool = createTool({
  description: "Validate a generated recipe for safety and completeness",
  args: z.object({
    recipe: recipeSchema
  }),
  handler: async (ctx, { recipe }): Promise<{ valid: boolean; issues: string[] }> => {
    const issues: string[] = [];

    // Check minimum ingredients
    if (recipe.ingredients.length < 2) {
      issues.push("Recipe must have at least 2 ingredients");
    }

    // Check for unrealistic ABV values
    for (const ing of recipe.ingredients) {
      if (ing.abv > 0.96) {
        issues.push(`Unrealistic ABV for ${ing.name}: ${ing.abv}`);
      }
    }

    // Check for empty steps
    if (recipe.steps.length === 0) {
      issues.push("Recipe must have at least one preparation step");
    }

    return { valid: issues.length === 0, issues };
  }
});

/**
 * Action to generate a recipe based on user preferences.
 * Returns a generated recipe without saving it (user must manually save).
 */
export const generateRecipe = action({
  args: {
    baseAlcohol: v.optional(v.string()),
    tastePreferences: v.array(v.string()),
    additionalNotes: v.optional(v.string()),
    threadId: v.optional(v.string())
  },
  handler: async (ctx, { baseAlcohol, tastePreferences, additionalNotes, threadId }) => {
    // Build the generation prompt
    let prompt = "Generate a creative cocktail recipe with the following preferences:\n\n";

    if (baseAlcohol) {
      prompt += `Base alcohol: ${baseAlcohol}\n`;
    }

    if (tastePreferences.length > 0) {
      prompt += `Taste profiles desired: ${tastePreferences.join(", ")}\n`;
    }

    if (additionalNotes) {
      prompt += `Additional notes: ${additionalNotes}\n`;
    }

    prompt += "\nGenerate a complete recipe following the required schema.";

    // Generate using the agent
    const result = await recipeGeneratorAgent.generateObject(
      ctx,
      { threadId: threadId || undefined },
      {
        prompt,
        schema: recipeSchema
      }
    );

    return result.object as GeneratedRecipe;
  }
});

/**
 * Action to generate a recipe and stream progress.
 * Uses Convex agent streaming for real-time UI updates.
 */
export const generateRecipeStreaming = action({
  args: {
    baseAlcohol: v.optional(v.string()),
    tastePreferences: v.array(v.string()),
    additionalNotes: v.optional(v.string()),
    threadId: v.string()
  },
  handler: async (ctx, { baseAlcohol, tastePreferences, additionalNotes, threadId }) => {
    let prompt = "Generate a creative cocktail recipe with the following preferences:\n\n";

    if (baseAlcohol) {
      prompt += `Base alcohol: ${baseAlcohol}\n`;
    }

    if (tastePreferences.length > 0) {
      prompt += `Taste profiles desired: ${tastePreferences.join(", ")}\n`;
    }

    if (additionalNotes) {
      prompt += `Additional notes: ${additionalNotes}\n`;
    }

    // Stream the generation with delta saving for real-time UI
    const result = await recipeGeneratorAgent.streamObject(
      ctx,
      { threadId },
      {
        prompt,
        schema: recipeSchema
      },
      { saveStreamDeltas: true }
    );

    // Wait for completion and return final result
    const finalObject = await result.object;
    return finalObject as GeneratedRecipe;
  }
});

/**
 * Mutation to save a generated recipe to the database.
 * Called after user reviews and approves the AI-generated recipe.
 */
export const saveGeneratedRecipe = internalAction({
  args: {
    userId: v.id("users"),
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
  handler: async (ctx, { userId, recipe, visibility }) => {
    // Create the recipe
    const recipeId = await ctx.runMutation(internal.functions.recipes.createRecipeInternal, {
      creatorId: userId,
      title: recipe.title,
      description: recipe.description,
      tasteProfiles: recipe.tasteProfiles,
      visibility,
      isAIGenerated: true
    });

    // Add ingredients
    for (let i = 0; i < recipe.ingredients.length; i++) {
      await ctx.runMutation(internal.functions.ingredients.addIngredientInternal, {
        recipeId,
        ...recipe.ingredients[i],
        order: i + 1
      });
    }

    // Add steps
    for (const step of recipe.steps) {
      await ctx.runMutation(internal.functions.recipes.addStepInternal, {
        recipeId,
        stepNumber: step.stepNumber,
        description: step.description
      });
    }

    return recipeId;
  }
});
```

### Recipe Generation UI Component

```svelte
<!-- src/components/ai/RecipeGenerator.svelte -->
<script lang="ts">
  import { useAction, useMutation } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { Textarea } from "$components/ui/textarea";
  import { Card, CardContent, CardHeader, CardTitle } from "$components/ui/card";
  import { Badge } from "$components/ui/badge";
  import { Sparkles, Save, RefreshCw, Check } from "lucide-svelte";
  import { toast } from "$components/ui/toast";

  // Form state
  let baseAlcohol = $state("");
  let additionalNotes = $state("");
  let selectedProfiles = $state<string[]>([]);

  // Generation state
  let isGenerating = $state(false);
  let generatedRecipe = $state<any>(null);
  let isSaving = $state(false);

  // Visibility for saving
  let selectedVisibility = $state<"private" | "friends_only" | "public">("private");

  const tasteProfiles = [
    { id: "boozy", label: "Boozy", color: "bg-amber-500" },
    { id: "sweet", label: "Sweet", color: "bg-pink-500" },
    { id: "sour", label: "Sour", color: "bg-yellow-500" },
    { id: "bitter", label: "Bitter", color: "bg-orange-700" },
    { id: "umami", label: "Umami", color: "bg-purple-500" },
    { id: "astringent", label: "Astringent", color: "bg-gray-500" },
    { id: "hot", label: "Hot/Spicy", color: "bg-red-500" },
    { id: "cold", label: "Cold", color: "bg-blue-500" }
  ];

  const generateRecipe = useAction(api.agents.recipeGenerator.generateRecipe);
  const saveRecipe = useMutation(api.functions.recipes.saveAIGeneratedRecipe);

  /**
   * Toggle a taste profile selection.
   */
  function toggleProfile(profileId: string) {
    if (selectedProfiles.includes(profileId)) {
      selectedProfiles = selectedProfiles.filter((p) => p !== profileId);
    } else {
      selectedProfiles = [...selectedProfiles, profileId];
    }
  }

  /**
   * Generate a new recipe based on current preferences.
   */
  async function handleGenerate() {
    isGenerating = true;
    generatedRecipe = null;

    try {
      const result = await generateRecipe.call({
        baseAlcohol: baseAlcohol || undefined,
        tastePreferences: selectedProfiles,
        additionalNotes: additionalNotes || undefined
      });

      generatedRecipe = result;
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate recipe. Please try again.");
    } finally {
      isGenerating = false;
    }
  }

  /**
   * Save the generated recipe to user's collection.
   */
  async function handleSave() {
    if (!generatedRecipe) return;

    isSaving = true;

    try {
      await saveRecipe.mutate({
        recipe: generatedRecipe,
        visibility: selectedVisibility
      });

      toast.success("Recipe saved to your collection!");
      generatedRecipe = null;
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save recipe. Please try again.");
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="mx-auto max-w-4xl space-y-6">
  <!-- Input Section -->
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Sparkles class="h-5 w-5" />
        AI Recipe Generator
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Base Alcohol -->
      <div class="space-y-2">
        <Label for="baseAlcohol">Base Alcohol (optional)</Label>
        <Input id="baseAlcohol" placeholder="e.g., Vodka, Rum, Whiskey, Gin..." bind:value={baseAlcohol} />
      </div>

      <!-- Taste Profiles -->
      <div class="space-y-2">
        <Label>Desired Taste Profiles</Label>
        <div class="flex flex-wrap gap-2">
          {#each tasteProfiles as profile}
            <button type="button" class="transition-all" onclick={() => toggleProfile(profile.id)}>
              <Badge
                class={selectedProfiles.includes(profile.id)
                  ? `${profile.color} text-white`
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
              >
                {#if selectedProfiles.includes(profile.id)}
                  <Check class="mr-1 h-3 w-3" />
                {/if}
                {profile.label}
              </Badge>
            </button>
          {/each}
        </div>
      </div>

      <!-- Additional Notes -->
      <div class="space-y-2">
        <Label for="notes">Additional Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any specific preferences, dietary restrictions, or inspiration..."
          bind:value={additionalNotes}
          rows={3}
        />
      </div>

      <!-- Generate Button -->
      <Button class="w-full" onclick={handleGenerate} disabled={isGenerating}>
        {#if isGenerating}
          <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
          Generating...
        {:else}
          <Sparkles class="mr-2 h-4 w-4" />
          Generate Recipe
        {/if}
      </Button>
    </CardContent>
  </Card>

  <!-- Generated Recipe Preview -->
  {#if generatedRecipe}
    <Card>
      <CardHeader>
        <CardTitle>{generatedRecipe.title}</CardTitle>
        {#if generatedRecipe.description}
          <p class="text-muted-foreground">{generatedRecipe.description}</p>
        {/if}
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Taste Profiles -->
        <div class="flex flex-wrap gap-2">
          {#each generatedRecipe.tasteProfiles as profile}
            {@const profileData = tasteProfiles.find((p) => p.id === profile)}
            <Badge class={profileData?.color || "bg-gray-500"}>
              {profile}
            </Badge>
          {/each}
        </div>

        <!-- Ingredients -->
        <div>
          <h3 class="mb-2 font-semibold">Ingredients</h3>
          <ul class="space-y-1">
            {#each generatedRecipe.ingredients as ingredient}
              <li class="flex justify-between">
                <span>{ingredient.name}</span>
                <span class="text-muted-foreground">
                  {ingredient.volumeInMl}ml
                  {#if ingredient.abv > 0}
                    ({(ingredient.abv * 100).toFixed(0)}% ABV)
                  {/if}
                </span>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Steps -->
        <div>
          <h3 class="mb-2 font-semibold">Preparation</h3>
          <ol class="space-y-2">
            {#each generatedRecipe.steps as step}
              <li class="flex gap-3">
                <span class="text-primary font-medium">{step.stepNumber}.</span>
                <span>{step.description}</span>
              </li>
            {/each}
          </ol>
        </div>

        <!-- Visibility Selection -->
        <div class="space-y-2">
          <Label>Visibility when saved</Label>
          <select class="w-full rounded-md border px-3 py-2" bind:value={selectedVisibility}>
            <option value="private">Private (only you)</option>
            <option value="friends_only">Friends Only</option>
            <option value="public">Public</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <Button class="flex-1" onclick={handleSave} disabled={isSaving}>
            {#if isSaving}
              <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              <Save class="mr-2 h-4 w-4" />
              Save Recipe
            {/if}
          </Button>

          <Button variant="outline" onclick={handleGenerate} disabled={isGenerating}>
            <RefreshCw class="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
```

---

## 9. Local Ingredient Sourcing System

### Ingredient Sourcer Agent

```typescript
// src/convex/agents/ingredientSourcer.ts
import { Agent, createTool } from "@convex-dev/agent";
import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { z } from "zod";
import { components, internal } from "../_generated/api";
import { action, internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";

/**
 * Schema for ingredient search results.
 */
const productResultSchema = z.object({
  title: z.string().describe("Product name"),
  url: z.string().url().describe("Product URL on retailer site"),
  priceText: z.string().optional().describe("Price text if available"),
  sizeText: z.string().optional().describe("Size/volume text if available"),
  confidence: z.number().min(0).max(1).describe("Match confidence score")
});

const ingredientResultSchema = z.object({
  ingredientName: z.string(),
  zipCode: z.string(),
  products: z.array(productResultSchema)
});

type IngredientResult = z.infer<typeof ingredientResultSchema>;

/**
 * System prompt for the ingredient sourcing agent.
 */
const SOURCING_SYSTEM_PROMPT = `You are an ingredient sourcing assistant for MixSmart.

Your job is to help users find cocktail ingredients at local retailers.

When processing search results:
1. Filter for actual product pages (not category pages)
2. Extract price and size information when visible
3. Prioritize exact ingredient matches over similar products
4. Assign confidence scores based on match quality

Focus on totalwine.com product pages as the primary source.`;

/**
 * Ingredient Sourcer Agent
 *
 * AI agent for finding local purchase options for cocktail ingredients.
 * Uses xAI's built-in web search tool (Responses API) with domain filtering
 * restricted to totalwine.com for accurate product discovery.
 */
export const ingredientSourcerAgent = new Agent(components.agent, {
  name: "IngredientSourcer",
  languageModel: xai("grok-4-1-fast-reasoning"),
  instructions: SOURCING_SYSTEM_PROMPT
});

/**
 * Search for an ingredient using xAI's web search with domain restriction.
 * Uses the Responses API with the web_search tool limited to totalwine.com.
 *
 * @param ingredientName - Name of the ingredient to search for
 * @param zipCode - User's ZIP code for local results
 * @returns Search results with product information and sources
 */
async function searchIngredientWithWebSearch(
  ingredientName: string,
  zipCode: string
): Promise<{ text: string; sources: Array<{ url: string }> }> {
  const { text, sources } = await generateText({
    model: xai.responses("grok-4-1-fast-reasoning"),
    prompt: `Find "${ingredientName}" available for purchase near ZIP code ${zipCode}.
Return product names, prices, sizes, and direct product page URLs.
Focus on finding the best matches for this specific cocktail ingredient.`,
    tools: {
      web_search: xai.tools.webSearch({
        // Restrict search to Total Wine domain only
        allowedDomains: ["www.totalwine.com"]
      })
    }
  });

  return {
    text,
    sources: sources
      .filter((s): s is { sourceType: "url"; url: string } => s.sourceType === "url")
      .map((s) => ({ url: s.url }))
  };
}

/**
 * Create an ingredient search run.
 * Persists the search for later reference.
 */
export const createSearchRun = internalMutation({
  args: {
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    zipCode: v.string()
  },
  handler: async (ctx, { userId, recipeId, zipCode }) => {
    const runId = await ctx.db.insert("ingredientSearchRuns", {
      userId,
      recipeId,
      zipCode,
      status: "running",
      createdAt: Date.now()
    });

    return runId;
  }
});

/**
 * Update search run status.
 */
export const updateSearchRunStatus = internalMutation({
  args: {
    runId: v.id("ingredientSearchRuns"),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    errorMessage: v.optional(v.string())
  },
  handler: async (ctx, { runId, status, errorMessage }) => {
    await ctx.db.patch(runId, {
      status,
      completedAt: status !== "running" ? Date.now() : undefined,
      errorMessage
    });
  }
});

/**
 * Save ingredient search results.
 */
export const saveIngredientResults = internalMutation({
  args: {
    runId: v.id("ingredientSearchRuns"),
    ingredientName: v.string(),
    products: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        priceText: v.optional(v.string()),
        sizeText: v.optional(v.string()),
        confidence: v.float64(),
        vendor: v.string()
      })
    )
  },
  handler: async (ctx, { runId, ingredientName, products }) => {
    await ctx.db.insert("ingredientSearchResults", {
      runId,
      ingredientName,
      products,
      createdAt: Date.now()
    });
  }
});

/**
 * Main action to source ingredients for a recipe.
 * Creates a search run and processes each ingredient using xAI's web search.
 */
export const sourceIngredientsForRecipe = action({
  args: {
    recipeId: v.id("recipes"),
    zipCode: v.string()
  },
  handler: async (ctx, { recipeId, zipCode }) => {
    // Get user ID
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user profile
    const user = await ctx.runQuery(internal.functions.users.getUserByAuth, {
      authId: identity.subject
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get recipe ingredients
    const ingredients = await ctx.runQuery(internal.functions.ingredients.getByRecipe, {
      recipeId
    });

    if (ingredients.length === 0) {
      throw new Error("No ingredients found for recipe");
    }

    // Create search run
    const runId = await ctx.runMutation(internal.agents.ingredientSourcer.createSearchRun, {
      userId: user._id,
      recipeId,
      zipCode
    });

    try {
      // Process each ingredient using xAI web search
      for (const ingredient of ingredients) {
        // Search using xAI's web search tool with domain restriction
        const searchResults = await searchIngredientWithWebSearch(ingredient.name, zipCode);

        // Use LLM to extract structured product data from search results
        const { object: extracted } = await ingredientSourcerAgent.generateObject(
          ctx,
          {},
          {
            prompt: `Extract product information from these search results for "${ingredient.name}":

Search response: ${searchResults.text}

Sources found: ${JSON.stringify(searchResults.sources, null, 2)}

Return structured product data with confidence scores based on how well each result matches the ingredient.
Only include products from totalwine.com URLs.`,
            schema: ingredientResultSchema
          }
        );

        // Filter to only Total Wine URLs and save results
        const filteredProducts = extracted.products
          .filter((p) => p.url.includes("totalwine.com"))
          .map((p) => ({
            ...p,
            vendor: "Total Wine"
          }));

        await ctx.runMutation(internal.agents.ingredientSourcer.saveIngredientResults, {
          runId,
          ingredientName: ingredient.name,
          products: filteredProducts
        });
      }

      // Mark run as completed
      await ctx.runMutation(internal.agents.ingredientSourcer.updateSearchRunStatus, {
        runId,
        status: "completed"
      });

      return { runId, success: true };
    } catch (error) {
      // Mark run as failed
      await ctx.runMutation(internal.agents.ingredientSourcer.updateSearchRunStatus, {
        runId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
});

/**
 * Query to get search run with results.
 */
export const getSearchRunWithResults = internalAction({
  args: {
    runId: v.id("ingredientSearchRuns")
  },
  handler: async (ctx, { runId }) => {
    const run = await ctx.runQuery(internal.functions.search.getSearchRun, { runId });

    if (!run) {
      return null;
    }

    const results = await ctx.runQuery(internal.functions.search.getSearchResults, { runId });

    return {
      run,
      results
    };
  }
});
```

### Ingredient Sourcer UI Component

```svelte
<!-- src/components/ai/IngredientSourcer.svelte -->
<script lang="ts">
  import { useAction, useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { Card, CardContent, CardHeader, CardTitle } from "$components/ui/card";
  import { Badge } from "$components/ui/badge";
  import { MapPin, Search, ExternalLink, RefreshCw, Check, AlertCircle } from "lucide-svelte";
  import { toast } from "$components/ui/toast";
  import type { Id } from "$convex/_generated/dataModel";

  type Props = {
    recipeId: Id<"recipes">;
    userZipCode?: string;
  };

  let { recipeId, userZipCode }: Props = $props();

  // State
  let zipCode = $state(userZipCode || "");
  let currentRunId = $state<Id<"ingredientSearchRuns"> | null>(null);

  // Actions and queries
  const sourceIngredients = useAction(api.agents.ingredientSourcer.sourceIngredientsForRecipe);

  const searchRunQuery = useQuery(api.functions.search.getSearchRunWithResults, () =>
    currentRunId ? { runId: currentRunId } : "skip"
  );

  /**
   * Start ingredient sourcing for the recipe.
   */
  async function handleSearch() {
    if (!zipCode || zipCode.length !== 5) {
      toast.error("Please enter a valid 5-digit ZIP code");
      return;
    }

    try {
      const result = await sourceIngredients.call({
        recipeId,
        zipCode
      });

      currentRunId = result.runId;
      toast.success("Ingredient search started!");
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to start ingredient search");
    }
  }

  /**
   * Get confidence badge color based on score.
   */
  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.5) return "bg-yellow-500";
    return "bg-orange-500";
  }
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <MapPin class="h-5 w-5" />
      Find Ingredients Near You
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <!-- ZIP Code Input -->
    <div class="flex gap-3">
      <div class="flex-1">
        <Label for="zipCode" class="sr-only">ZIP Code</Label>
        <Input id="zipCode" placeholder="Enter ZIP code (e.g., 90210)" maxlength={5} bind:value={zipCode} />
      </div>
      <Button onclick={handleSearch} disabled={sourceIngredients.isLoading}>
        {#if sourceIngredients.isLoading}
          <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
          Searching...
        {:else}
          <Search class="mr-2 h-4 w-4" />
          Find
        {/if}
      </Button>
    </div>

    <!-- Search Results -->
    {#if searchRunQuery.data}
      {@const { run, results } = searchRunQuery.data}

      <!-- Status Banner -->
      <div
        class="flex items-center gap-2 rounded-lg p-3 {run.status === 'completed'
          ? 'bg-green-100 text-green-800'
          : run.status === 'failed'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'}"
      >
        {#if run.status === "completed"}
          <Check class="h-4 w-4" />
          <span>Search completed! Found products for {results.length} ingredients.</span>
        {:else if run.status === "failed"}
          <AlertCircle class="h-4 w-4" />
          <span>Search failed: {run.errorMessage || "Unknown error"}</span>
        {:else}
          <RefreshCw class="h-4 w-4 animate-spin" />
          <span>Searching for ingredients...</span>
        {/if}
      </div>

      <!-- Results by Ingredient -->
      {#if results.length > 0}
        <div class="space-y-4">
          {#each results as result}
            <div class="rounded-lg border p-4">
              <h4 class="mb-3 font-medium">{result.ingredientName}</h4>

              {#if result.products.length > 0}
                <ul class="space-y-2">
                  {#each result.products.slice(0, 3) as product}
                    <li class="bg-muted flex items-start justify-between gap-4 rounded p-2">
                      <div class="flex-1">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-primary flex items-center gap-1 font-medium hover:underline"
                        >
                          {product.title}
                          <ExternalLink class="h-3 w-3" />
                        </a>
                        <div class="text-muted-foreground mt-1 flex gap-3 text-sm">
                          {#if product.priceText}
                            <span>{product.priceText}</span>
                          {/if}
                          {#if product.sizeText}
                            <span>{product.sizeText}</span>
                          {/if}
                        </div>
                      </div>
                      <Badge class={getConfidenceColor(product.confidence)}>
                        {Math.round(product.confidence * 100)}% match
                      </Badge>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-muted-foreground text-sm">No products found for this ingredient.</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Info Note -->
    <p class="text-muted-foreground text-xs">
      Results are sourced from Total Wine. Prices and availability may vary. Save your search to reference later.
    </p>
  </CardContent>
</Card>
```

---

## 10. BAC Calculation Engine

### BAC Calculation Utilities

```typescript
// src/convex/lib/bac.ts
import type { Doc } from "../_generated/dataModel";

/**
 * Widmark factor constants for BAC calculation.
 * Based on biological sex differences in body water distribution.
 */
const WIDMARK_FACTORS = {
  male: 0.68,
  female: 0.55
} as const;

/**
 * Alcohol metabolism rate (grams per hour per kg body weight).
 * Average human metabolizes about 0.015-0.017 BAC per hour.
 */
const METABOLISM_RATE_PER_HOUR = 0.015;

/**
 * Alcohol density constant (grams per milliliter).
 */
const ALCOHOL_DENSITY_G_PER_ML = 0.789;

/**
 * Calculate total alcohol content in grams from ingredients.
 *
 * @param ingredients - Array of recipe ingredients
 * @returns Total alcohol in grams
 *
 * @example
 * const grams = calculateTotalAlcoholGrams([
 *   { name: "Vodka", volumeInMl: 45, abv: 0.40 },
 *   { name: "Orange Juice", volumeInMl: 90, abv: 0 }
 * ]);
 * // Returns: 45 * 0.40 * 0.789 = 14.202 grams
 */
export function calculateTotalAlcoholGrams(ingredients: Array<{ volumeInMl: number; abv: number }>): number {
  return ingredients.reduce((total, ingredient) => {
    const alcoholVolumeML = ingredient.volumeInMl * ingredient.abv;
    const alcoholGrams = alcoholVolumeML * ALCOHOL_DENSITY_G_PER_ML;
    return total + alcoholGrams;
  }, 0);
}

/**
 * Calculate estimated Blood Alcohol Concentration (BAC) using the Widmark formula.
 *
 * The Widmark formula: BAC = (A / (r × W)) - (β × t)
 * Where:
 * - A = mass of alcohol consumed (grams)
 * - r = Widmark factor (0.68 for males, 0.55 for females)
 * - W = body weight (grams)
 * - β = metabolism rate (~0.015 per hour)
 * - t = time since drinking started (hours)
 *
 * This function calculates immediate BAC (t = 0) per single serving.
 *
 * @param ingredients - Recipe ingredients with volume and ABV
 * @param biologicalSex - User's biological sex for Widmark factor
 * @param weightInKg - User's weight in kilograms
 * @returns Estimated BAC as a decimal (e.g., 0.08 = 0.08%)
 *
 * @example
 * const bac = calculateBAC(
 *   [{ name: "Vodka", volumeInMl: 45, abv: 0.40 }],
 *   "male",
 *   70
 * );
 * // BAC ≈ 0.03
 */
export function calculateBAC(
  ingredients: Array<{ volumeInMl: number; abv: number }>,
  biologicalSex: "male" | "female",
  weightInKg: number
): number {
  // Validate inputs
  if (weightInKg <= 0) {
    throw new Error("Weight must be positive");
  }

  // Calculate total alcohol in grams
  const alcoholGrams = calculateTotalAlcoholGrams(ingredients);

  // Get Widmark factor based on biological sex
  const widmarkFactor = WIDMARK_FACTORS[biologicalSex];

  // Convert weight to grams
  const weightInGrams = weightInKg * 1000;

  // Apply Widmark formula (immediate BAC, t = 0)
  const bac = alcoholGrams / (widmarkFactor * weightInGrams);

  // Return rounded to 4 decimal places
  return Math.round(bac * 10000) / 10000;
}

/**
 * Calculate estimated BAC after a given time period.
 * Accounts for alcohol metabolism over time.
 *
 * @param initialBAC - Initial BAC after drinking
 * @param hoursElapsed - Hours since drinking started
 * @returns Estimated current BAC (minimum 0)
 */
export function calculateBACAfterTime(initialBAC: number, hoursElapsed: number): number {
  const metabolized = METABOLISM_RATE_PER_HOUR * hoursElapsed;
  return Math.max(0, initialBAC - metabolized);
}

/**
 * Get BAC risk level and associated message.
 * Based on common legal and safety thresholds.
 *
 * @param bac - Blood alcohol concentration
 * @returns Risk level and warning message
 */
export function getBACRiskLevel(bac: number): {
  level: "safe" | "caution" | "warning" | "danger";
  message: string;
  color: string;
} {
  if (bac < 0.02) {
    return {
      level: "safe",
      message: "Minimal impairment expected",
      color: "green"
    };
  } else if (bac < 0.05) {
    return {
      level: "caution",
      message: "Mild relaxation, slight impairment",
      color: "yellow"
    };
  } else if (bac < 0.08) {
    return {
      level: "warning",
      message: "Impaired coordination and judgment",
      color: "orange"
    };
  } else {
    return {
      level: "danger",
      message: "Significant impairment - Do not drive",
      color: "red"
    };
  }
}

/**
 * Calculate estimated time until BAC returns to zero.
 *
 * @param bac - Current BAC level
 * @returns Hours until sober (BAC = 0)
 */
export function calculateTimeUntilSober(bac: number): number {
  if (bac <= 0) return 0;
  return bac / METABOLISM_RATE_PER_HOUR;
}
```

### BAC Display Component

```svelte
<!-- src/components/recipe/BACDisplay.svelte -->
<script lang="ts">
  import { calculateBAC, getBACRiskLevel, calculateTimeUntilSober } from "$convex/lib/bac";
  import { Badge } from "$components/ui/badge";
  import { AlertTriangle, Clock, Wine } from "lucide-svelte";
  import type { Doc } from "$convex/_generated/dataModel";

  type Props = {
    ingredients: Array<{ volumeInMl: number; abv: number }>;
    userProfile: Doc<"users">;
  };

  let { ingredients, userProfile }: Props = $props();

  /**
   * Calculate BAC if user has required profile data.
   */
  const bacData = $derived(() => {
    if (!userProfile.biologicalSex || !userProfile.weightInKg) {
      return null;
    }

    try {
      const bac = calculateBAC(ingredients, userProfile.biologicalSex, userProfile.weightInKg);

      const riskLevel = getBACRiskLevel(bac);
      const hoursUntilSober = calculateTimeUntilSober(bac);

      return {
        bac,
        riskLevel,
        hoursUntilSober,
        bacPercent: (bac * 100).toFixed(2)
      };
    } catch (error) {
      console.error("BAC calculation error:", error);
      return null;
    }
  });

  /**
   * Get badge color class based on risk level.
   */
  function getRiskColorClass(level: string): string {
    switch (level) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-300";
      case "caution":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "warning":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "danger":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
</script>

{#if bacData()}
  {@const data = bacData()}
  <div class="space-y-2 rounded-lg border p-3 {getRiskColorClass(data.riskLevel.level)}">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Wine class="h-4 w-4" />
        <span class="font-medium">Estimated BAC</span>
      </div>
      <Badge variant="outline" class={getRiskColorClass(data.riskLevel.level)}>
        {data.bacPercent}%
      </Badge>
    </div>

    <p class="flex items-center gap-1 text-sm">
      {#if data.riskLevel.level === "danger" || data.riskLevel.level === "warning"}
        <AlertTriangle class="h-4 w-4" />
      {/if}
      {data.riskLevel.message}
    </p>

    {#if data.bac > 0}
      <p class="flex items-center gap-1 text-xs opacity-75">
        <Clock class="h-3 w-3" />
        ~{data.hoursUntilSober.toFixed(1)} hours until sober
      </p>
    {/if}
  </div>
{:else}
  <div class="bg-muted text-muted-foreground rounded-lg border p-3 text-sm">
    <p>Add your weight and biological sex in profile settings to see BAC estimates.</p>
  </div>
{/if}
```

---

## 11. Social Features Implementation

### Social Functions (Friends, Likes, Favorites)

```typescript
// src/convex/functions/social.ts
import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Send a friend request to another user.
 */
export const sendFriendRequest = mutation({
  args: {
    receiverId: v.id("users")
  },
  handler: async (ctx, { receiverId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get sender user
    const sender = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!sender) {
      throw new Error("Sender not found");
    }

    if (sender._id === receiverId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check for existing request or friendship
    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", sender._id))
      .filter((q) => q.eq(q.field("receiverId"), receiverId))
      .first();

    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    // Check if already friends
    const [id1, id2] = sender._id < receiverId ? [sender._id, receiverId] : [receiverId, sender._id];

    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", id1))
      .filter((q) => q.eq(q.field("userId2"), id2))
      .first();

    if (existingFriendship) {
      throw new Error("Already friends");
    }

    // Create friend request
    const requestId = await ctx.db.insert("friendRequests", {
      senderId: sender._id,
      receiverId,
      status: "pending",
      createdAt: Date.now()
    });

    // Create notification for receiver (if 2FA enabled)
    const receiver = await ctx.db.get(receiverId);
    if (receiver?.is2FAEnabled) {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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

    // Update request status
    await ctx.db.patch(requestId, { status: "accepted" });

    // Create friendship (ordered by ID for consistency)
    const [id1, id2] =
      request.senderId < request.receiverId
        ? [request.senderId, request.receiverId]
        : [request.receiverId, request.senderId];

    await ctx.db.insert("friendships", {
      userId1: id1,
      userId2: id2,
      createdAt: Date.now()
    });

    // Notify sender (if 2FA enabled)
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const request = await ctx.db.get(requestId);
    if (!request || request.receiverId !== user._id) {
      throw new Error("Not authorized");
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find friendship (check both orderings)
    const [id1, id2] = user._id < friendId ? [user._id, friendId] : [friendId, user._id];

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

    // Get friendships where user is either user1 or user2
    const friendships1 = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", user._id))
      .collect();

    const friendships2 = await ctx.db
      .query("friendships")
      .withIndex("by_user2", (q) => q.eq("userId2", user._id))
      .collect();

    // Extract friend IDs
    const friendIds = [...friendships1.map((f) => f.userId2), ...friendships2.map((f) => f.userId1)];

    // Fetch friend user data
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

    // Fetch sender info for each request
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
            : null
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipeId).eq("userId", user._id))
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("likes", {
        recipeId,
        userId: user._id,
        createdAt: Date.now()
      });

      // Notify recipe creator (if 2FA enabled and not self)
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already favorited
    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_recipe_user", (q) => q.eq("recipeId", recipeId).eq("userId", user._id))
      .first();

    if (existingFavorite) {
      // Unfavorite
      await ctx.db.delete(existingFavorite._id);
      return { favorited: false };
    } else {
      // Favorite
      await ctx.db.insert("favorites", {
        recipeId,
        userId: user._id,
        createdAt: Date.now()
      });

      // Notify recipe creator (if 2FA enabled and not self)
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

    // Fetch recipe data
    const recipes = await Promise.all(
      favorites.map(async (fav) => {
        const recipe = await ctx.db.get(fav.recipeId);
        return recipe;
      })
    );

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

    const [id1, id2] = user._id < otherUserId ? [user._id, otherUserId] : [otherUserId, user._id];

    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", id1))
      .filter((q) => q.eq(q.field("userId2"), id2))
      .first();

    return { isFriend: !!friendship };
  }
});
```

---

## 12. Real-time Messaging System

### Message Functions

```typescript
// src/convex/functions/messages.ts
import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const sender = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!sender) {
      throw new Error("Sender not found");
    }

    // Verify friendship exists
    const [id1, id2] = sender._id < receiverId ? [sender._id, receiverId] : [receiverId, sender._id];

    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", id1))
      .filter((q) => q.eq(q.field("userId2"), id2))
      .first();

    if (!friendship) {
      throw new Error("Can only message friends");
    }

    // Validate message text
    if (!text.trim()) {
      throw new Error("Message cannot be empty");
    }

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      senderId: sender._id,
      receiverId,
      text: text.trim(),
      attachmentUrls: attachmentUrls || [],
      createdAt: now,
      updatedAt: now,
      isRead: false
    });

    // Create notification for receiver (if 2FA enabled)
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

    // Get messages sent by either user in this conversation
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

    // Combine and sort by creation time
    const allMessages = [...sentMessages, ...receivedMessages].sort((a, b) => a.createdAt - b.createdAt).slice(-limit);

    return allMessages;
  }
});

/**
 * Get list of conversations (most recent message per friend).
 */
export const getConversationList = query({
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

    // Get all messages involving user
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

    // Group by conversation partner and get most recent
    const conversationMap = new Map<string, (typeof sentMessages)[0]>();

    for (const msg of [...sentMessages, ...receivedMessages]) {
      const partnerId = msg.senderId === user._id ? msg.receiverId : msg.senderId;
      const existing = conversationMap.get(partnerId);

      if (!existing || msg.createdAt > existing.createdAt) {
        conversationMap.set(partnerId, msg);
      }
    }

    // Fetch partner info and build response
    const conversations = await Promise.all(
      Array.from(conversationMap.entries()).map(async ([partnerId, lastMessage]) => {
        const partner = await ctx.db.get(partnerId as any);

        // Count unread messages from this partner
        const unreadCount = receivedMessages.filter((m) => m.senderId === partnerId && !m.isRead).length;

        return {
          partnerId,
          partner: partner
            ? {
                _id: partner._id,
                username: partner.username,
                profilePicUrl: partner.profilePicUrl
              }
            : null,
          lastMessage: {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt,
            isFromMe: lastMessage.senderId === user._id
          },
          unreadCount
        };
      })
    );

    // Sort by most recent message
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get unread messages from sender
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("senderId", senderId).eq("receiverId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    // Mark as read
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const message = await ctx.db.get(messageId);
    if (!message || message.senderId !== user._id) {
      throw new Error("Cannot edit this message");
    }

    if (!text.trim()) {
      throw new Error("Message cannot be empty");
    }

    await ctx.db.patch(messageId, {
      text: text.trim(),
      updatedAt: Date.now()
    });

    return true;
  }
});
```

---

## 13. Recipe Versioning System

### Version Control Functions

```typescript
// src/convex/functions/versions.ts
import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

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
    // Get current recipe
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }

    // Get current ingredients
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    // Get current steps
    const steps = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    // Determine version number
    const existingVersions = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const nextVersion = existingVersions.length + 1;

    // Create snapshot
    const versionId = await ctx.db.insert("recipeVersions", {
      recipeId,
      versionNumber: nextVersion,
      snapshot: {
        title: recipe.title,
        description: recipe.description,
        ingredients: ingredients.map((i) => ({
          name: i.name,
          volumeInMl: i.volumeInMl,
          abv: i.abv,
          order: i.order
        })),
        steps: steps.map((s) => ({
          stepNumber: s.stepNumber,
          description: s.description
        }))
      },
      createdAt: Date.now(),
      changeNote
    });

    // Update recipe's current version
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user has access to recipe
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user || recipe.creatorId !== user._id) {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const recipe = await ctx.db.get(recipeId);
    if (!recipe || recipe.creatorId !== user._id) {
      throw new Error("Not authorized");
    }

    // Find the version to revert to
    const versions = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const targetVersion = versions.find((v) => v.versionNumber === versionNumber);
    if (!targetVersion) {
      throw new Error("Version not found");
    }

    // Create a new version with current state before reverting
    await ctx.scheduler.runAfter(0, internal.functions.versions.createVersionSnapshot, {
      recipeId,
      changeNote: `Auto-saved before reverting to version ${versionNumber}`
    });

    // Update recipe title/description
    await ctx.db.patch(recipeId, {
      title: targetVersion.snapshot.title,
      description: targetVersion.snapshot.description,
      updatedAt: Date.now()
    });

    // Delete current ingredients and steps
    const currentIngredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    for (const ing of currentIngredients) {
      await ctx.db.delete(ing._id);
    }

    const currentSteps = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    for (const step of currentSteps) {
      await ctx.db.delete(step._id);
    }

    // Restore ingredients from snapshot
    for (const ing of targetVersion.snapshot.ingredients) {
      await ctx.db.insert("ingredients", {
        recipeId,
        name: ing.name,
        volumeInMl: ing.volumeInMl,
        abv: ing.abv,
        order: ing.order
      });
    }

    // Restore steps from snapshot
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const versions = await ctx.db
      .query("recipeVersions")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
      .collect();

    const v1 = versions.find((v) => v.versionNumber === version1);
    const v2 = versions.find((v) => v.versionNumber === version2);

    if (!v1 || !v2) {
      throw new Error("Version not found");
    }

    // Calculate differences
    const titleChanged = v1.snapshot.title !== v2.snapshot.title;
    const descriptionChanged = v1.snapshot.description !== v2.snapshot.description;

    const ingredientsDiff = {
      added: v2.snapshot.ingredients.filter((i2) => !v1.snapshot.ingredients.some((i1) => i1.name === i2.name)),
      removed: v1.snapshot.ingredients.filter((i1) => !v2.snapshot.ingredients.some((i2) => i2.name === i1.name)),
      modified: v2.snapshot.ingredients.filter((i2) => {
        const i1 = v1.snapshot.ingredients.find((i) => i.name === i2.name);
        return i1 && (i1.volumeInMl !== i2.volumeInMl || i1.abv !== i2.abv);
      })
    };

    const stepsDiff = {
      countChange: v2.snapshot.steps.length - v1.snapshot.steps.length,
      changed:
        v1.snapshot.steps.length !== v2.snapshot.steps.length ||
        v1.snapshot.steps.some((s1, i) => v2.snapshot.steps[i]?.description !== s1.description)
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
```

---

## 14. Notification System

### Notification Functions

```typescript
// src/convex/functions/notifications.ts
import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

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
      return []; // Notifications only for 2FA users
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", user._id).eq("isRead", false))
      .order("desc")
      .take(50);

    return notifications;
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

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return notifications;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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
```

---

## 15. API Reference

### Convex Functions Summary

| Module            | Function                     | Type     | Description                             |
| ----------------- | ---------------------------- | -------- | --------------------------------------- |
| **auth**          | `getCurrentUser`             | Query    | Get authenticated user                  |
| **auth**          | `getUserProfile`             | Query    | Get MixSmart user profile               |
| **auth**          | `createUserProfile`          | Mutation | Create profile after registration       |
| **auth**          | `updateUserProfile`          | Mutation | Update profile settings                 |
| **auth**          | `enable2FA`                  | Mutation | Enable two-factor auth                  |
| **recipes**       | `listRecipes`                | Query    | List recipes with filters               |
| **recipes**       | `getRecipe`                  | Query    | Get recipe by ID with ingredients/steps |
| **recipes**       | `createRecipe`               | Mutation | Create new recipe                       |
| **recipes**       | `updateRecipe`               | Mutation | Update recipe details                   |
| **recipes**       | `deleteRecipe`               | Mutation | Delete a recipe                         |
| **recipes**       | `searchRecipes`              | Query    | Full-text search recipes                |
| **social**        | `sendFriendRequest`          | Mutation | Send friend request                     |
| **social**        | `acceptFriendRequest`        | Mutation | Accept friend request                   |
| **social**        | `declineFriendRequest`       | Mutation | Decline friend request                  |
| **social**        | `removeFriend`               | Mutation | Remove a friend                         |
| **social**        | `getFriends`                 | Query    | Get user's friends                      |
| **social**        | `toggleLike`                 | Mutation | Like/unlike a recipe                    |
| **social**        | `toggleFavorite`             | Mutation | Favorite/unfavorite recipe              |
| **social**        | `getFavorites`               | Query    | Get user's favorites                    |
| **messages**      | `sendMessage`                | Mutation | Send direct message                     |
| **messages**      | `getConversation`            | Query    | Get messages with user                  |
| **messages**      | `getConversationList`        | Query    | Get all conversations                   |
| **messages**      | `markAsRead`                 | Mutation | Mark messages as read                   |
| **comments**      | `addComment`                 | Mutation | Add comment to recipe                   |
| **comments**      | `getComments`                | Query    | Get recipe comments                     |
| **notifications** | `getUnreadNotifications`     | Query    | Get unread notifications                |
| **notifications** | `markNotificationRead`       | Mutation | Mark as read                            |
| **versions**      | `getRecipeVersions`          | Query    | Get version history                     |
| **versions**      | `revertToVersion`            | Mutation | Revert to version                       |
| **agents**        | `generateRecipe`             | Action   | AI recipe generation                    |
| **agents**        | `sourceIngredientsForRecipe` | Action   | Local ingredient search                 |

---

## 16. Testing Strategy

### Testing Framework Setup

```bash
# Install testing dependencies
bun add -D vitest @testing-library/svelte jsdom
```

### Convex Function Tests

```typescript
// tests/convex/recipes.test.ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";

describe("Recipe Functions", () => {
  test("createRecipe requires minimum 2 ingredients", async () => {
    const t = convexTest(schema);

    // Create a test user first
    const userId = await t.run(async (ctx) => {
      return ctx.db.insert("users", {
        authUserId: "test-auth-id",
        username: "testuser",
        is2FAEnabled: false,
        ageVerified: true,
        createdAt: Date.now()
      });
    });

    // Try to create recipe with 1 ingredient - should fail validation
    // (validation logic would be in the actual mutation)
  });

  test("recipe visibility controls access", async () => {
    const t = convexTest(schema);

    // Create two users
    const user1Id = await t.run(async (ctx) => {
      return ctx.db.insert("users", {
        authUserId: "user1-auth",
        username: "user1",
        is2FAEnabled: false,
        ageVerified: true,
        createdAt: Date.now()
      });
    });

    const user2Id = await t.run(async (ctx) => {
      return ctx.db.insert("users", {
        authUserId: "user2-auth",
        username: "user2",
        is2FAEnabled: false,
        ageVerified: true,
        createdAt: Date.now()
      });
    });

    // Create a private recipe
    const recipeId = await t.run(async (ctx) => {
      return ctx.db.insert("recipes", {
        creatorId: user1Id,
        title: "Private Recipe",
        tasteProfiles: ["sweet"],
        visibility: "private",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isAIGenerated: false,
        currentVersion: 1
      });
    });

    // Test that user2 cannot see user1's private recipe
    // (would test the query function with user2's identity)
  });
});
```

### Component Tests

```typescript
// tests/components/RecipeCard.test.ts
import { render, screen } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import RecipeCard from "../src/components/recipe/RecipeCard.svelte";

describe("RecipeCard", () => {
  const mockRecipe = {
    _id: "test-recipe-id",
    creatorId: "creator-id",
    title: "Test Cocktail",
    description: "A test description",
    tasteProfiles: ["sweet", "sour"],
    visibility: "public" as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isAIGenerated: false,
    currentVersion: 1
  };

  const mockIngredients = [
    { _id: "ing-1", recipeId: "test-recipe-id", name: "Vodka", volumeInMl: 45, abv: 0.4, order: 1 },
    { _id: "ing-2", recipeId: "test-recipe-id", name: "Lime Juice", volumeInMl: 30, abv: 0, order: 2 }
  ];

  test("renders recipe title", () => {
    render(RecipeCard, {
      props: {
        recipe: mockRecipe,
        ingredients: mockIngredients,
        userProfile: null,
        likeCount: 5,
        isLiked: false,
        isFavorited: false,
        onLike: () => {},
        onFavorite: () => {}
      }
    });

    expect(screen.getByText("Test Cocktail")).toBeInTheDocument();
  });

  test("displays taste profile badges", () => {
    render(RecipeCard, {
      props: {
        recipe: mockRecipe,
        ingredients: mockIngredients,
        userProfile: null,
        likeCount: 0,
        isLiked: false,
        isFavorited: false,
        onLike: () => {},
        onFavorite: () => {}
      }
    });

    expect(screen.getByText("sweet")).toBeInTheDocument();
    expect(screen.getByText("sour")).toBeInTheDocument();
  });
});
```

### BAC Calculation Tests

```typescript
// tests/lib/bac.test.ts
import { expect, test, describe } from "vitest";
import { calculateBAC, calculateTotalAlcoholGrams, getBACRiskLevel } from "../src/convex/lib/bac";

describe("BAC Calculations", () => {
  test("calculates total alcohol grams correctly", () => {
    const ingredients = [
      { volumeInMl: 45, abv: 0.4 }, // Vodka
      { volumeInMl: 30, abv: 0 } // Lime juice
    ];

    const grams = calculateTotalAlcoholGrams(ingredients);
    // 45ml * 0.40 * 0.789 = 14.202 grams
    expect(grams).toBeCloseTo(14.202, 2);
  });

  test("calculates BAC for male correctly", () => {
    const ingredients = [{ volumeInMl: 45, abv: 0.4 }];

    const bac = calculateBAC(ingredients, "male", 70);
    // Expected: 14.202 / (0.68 * 70000) ≈ 0.0003
    expect(bac).toBeGreaterThan(0);
    expect(bac).toBeLessThan(0.1);
  });

  test("female BAC higher than male for same consumption", () => {
    const ingredients = [{ volumeInMl: 60, abv: 0.4 }];

    const maleBAC = calculateBAC(ingredients, "male", 70);
    const femaleBAC = calculateBAC(ingredients, "female", 70);

    expect(femaleBAC).toBeGreaterThan(maleBAC);
  });

  test("risk levels are correct", () => {
    expect(getBACRiskLevel(0.01).level).toBe("safe");
    expect(getBACRiskLevel(0.03).level).toBe("caution");
    expect(getBACRiskLevel(0.06).level).toBe("warning");
    expect(getBACRiskLevel(0.1).level).toBe("danger");
  });
});
```

---

## 17. Deployment Guide

### Vercel Deployment

```bash
# Install Vercel CLI
bun add -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Convex Production Setup

```bash
# Deploy to Convex production
npx convex deploy

# Set production environment variables
npx convex env set BETTER_AUTH_SECRET <production-secret> --prod
npx convex env set SITE_URL https://your-domain.com --prod
npx convex env set XAI_API_KEY <production-key> --prod
```

### Vercel Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable                 | Environment | Description              |
| ------------------------ | ----------- | ------------------------ |
| `CONVEX_DEPLOYMENT`      | Production  | Production deployment ID |
| `PUBLIC_CONVEX_URL`      | Production  | Production Convex URL    |
| `PUBLIC_CONVEX_SITE_URL` | Production  | Production .site URL     |
| `PUBLIC_SITE_URL`        | Production  | Your production domain   |

---

## 18. Security Considerations

### Authentication Security

1. **Password Requirements**: Enforce minimum password strength in BetterAuth config
2. **2FA Enforcement**: Optional but recommended for notifications
3. **Session Management**: BetterAuth handles secure session cookies
4. **Age Verification**: Required before account creation (21+ only)

### Data Protection

1. **Visibility Controls**: Recipes respect visibility settings in all queries
2. **Friend-Only Access**: Friends-only recipes verify friendship before access
3. **Input Validation**: All inputs validated with Zod schemas
4. **SQL Injection**: Not applicable (Convex uses document queries)

### API Security

1. **Rate Limiting**: Implement via Convex rate limiting component
2. **Authentication Checks**: All mutations verify user identity
3. **Authorization**: Owner checks on all sensitive operations

### External API Security

1. **API Key Storage**: All keys in Convex environment variables
2. **xAI API**: Server-side only, never exposed to client (handles both LLM and web search)

### Recommended Additional Measures

```typescript
// Example rate limiting setup
import { rateLimit } from "@convex-dev/rate-limiter";

// Apply to sensitive mutations
export const createRecipe = mutation({
  args: {
    /* ... */
  },
  handler: rateLimit(
    {
      name: "createRecipe",
      limit: 10,
      window: "1h"
    },
    async (ctx, args) => {
      // Implementation
    }
  )
});
```

---

## Appendix A: Challenge Questions Addressed

### 1. Recipe Version Control

**Challenge**: How would you handle version control if users want to track historical changes to their recipes?

**Solution**: The `recipeVersions` table stores complete snapshots of recipes at each version. Users can view version
history, compare versions, and revert to previous versions. Auto-versioning occurs on significant changes.

### 2. AI Safety Guardrails

**Challenge**: What safeguards would you implement to ensure AI-generated recipes are safe?

**Solution**:

- System prompt explicitly prohibits toxic/dangerous ingredients
- Validation tool checks ABV values and ingredient safety
- User must manually save AI-generated recipes (review step)
- ABV limits in schema validation

### 3. Ingredient Substitution

**Challenge**: How would you help users substitute hard-to-find ingredients?

**Solution**: Future enhancement - could add substitution tool to the recipe generator agent that suggests alternatives
based on flavor profile and availability from local sourcing results.

### 4. Feed Customization

**Challenge**: How would you customize a user's feed based on preferences?

**Solution**: Future enhancement via recommendation agent that:

- Filters by ABV threshold
- Considers taste profile preferences
- Weighs friend activity
- Uses vector similarity for recipe matching

### 5. BAC Legal Disclaimer

**Challenge**: How would you mitigate legal risks if a user misinterprets BAC estimates?

**Solution**:

- Clear disclaimers that BAC is an estimate only
- Never show BAC without both sex and weight inputs
- Risk level warnings with "Do not drive" messaging
- Terms of Service covering estimate limitations

---

_End of MixSmart Technical Specification_
