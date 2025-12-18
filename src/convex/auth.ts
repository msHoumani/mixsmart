import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { type DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import authConfig from "./auth.config";
import { normalizeOptionalString, parseEmail, parsePhoneNumber, parseUsername, parseZipCode } from "./lib/validators";

/**
 * Resolve the MixSmart site URL from the environment.
 *
 * @returns Site URL string
 */
const getSiteUrl = (): string => {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error("SITE_URL environment variable is required");
  }
  return siteUrl;
};

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
  const siteUrl = getSiteUrl();

  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
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
      convex({ authConfig }),
      twoFactor({
        issuer: "MixSmart",
        totpOptions: {
          enabled: true
        },
        otpOptions: {
          enabled: true,
          sendOTP: async ({ email, otp }) => {
            const normalizedEmail = parseEmail(email);
            if (!otp || otp.trim().length === 0) {
              throw new Error("OTP is required");
            }

            console.info(`MixSmart OTP for ${normalizedEmail}: ${otp}`);
          }
        }
      })
    ]
  });
};

/**
 * Query to get the current authenticated user.
 * Returns undefined if not authenticated.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    return authUser ?? undefined;
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
    if (!authUser) {
      return undefined;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser.id))
      .first();

    return user ?? undefined;
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

    const normalizedUsername = parseUsername(username);

    const existingByAuth = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser.id))
      .first();

    if (existingByAuth) {
      throw new Error("User profile already exists");
    }

    const existingByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .first();

    if (existingByUsername) {
      throw new Error("Username already taken");
    }

    const userId = await ctx.db.insert("users", {
      authUserId: authUser.id,
      username: normalizedUsername,
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

    const patch: Partial<typeof user> = {};

    if (updates.zipCode !== undefined) {
      patch.zipCode = parseZipCode(updates.zipCode);
    }

    if (updates.biologicalSex !== undefined) {
      patch.biologicalSex = updates.biologicalSex;
    }

    if (updates.weightInKg !== undefined) {
      if (updates.weightInKg <= 0) {
        throw new Error("Weight must be positive");
      }
      patch.weightInKg = updates.weightInKg;
    }

    if (updates.email !== undefined) {
      patch.email = parseEmail(updates.email);
    }

    if (updates.phoneNumber !== undefined) {
      patch.phoneNumber = parsePhoneNumber(updates.phoneNumber);
    }

    if (updates.profilePicUrl !== undefined) {
      const normalizedProfilePic = normalizeOptionalString(updates.profilePicUrl);
      if (normalizedProfilePic !== undefined) {
        patch.profilePicUrl = normalizedProfilePic;
      }
    }

    await ctx.db.patch(user._id, patch);
    return user._id;
  }
});

/**
 * Mutation to enable 2FA for the user.
 * Requires email and optional phone number to be set.
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

    const normalizedEmail = parseEmail(email);
    const normalizedPhone = phoneNumber ? parsePhoneNumber(phoneNumber) : undefined;

    const patch: Partial<typeof user> = {
      is2FAEnabled: true,
      email: normalizedEmail
    };

    if (normalizedPhone !== undefined) {
      patch.phoneNumber = normalizedPhone;
    }

    await ctx.db.patch(user._id, patch);

    return true;
  }
});
