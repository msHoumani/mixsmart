import { z } from "zod";
import {
  biologicalSexValues,
  friendRequestStatusValues,
  ingredientSearchStatusValues,
  notificationTypeValues,
  recipeVisibilityValues,
  tasteProfileValues,
  type IngredientInput,
  type RecipeInput,
  type StepInput
} from "./types";

/**
 * Base schema for trimmed, non-empty strings.
 */
const requiredStringSchema = z.string().trim().min(1, "Value is required");

/**
 * Schema for optional, trimmed strings.
 */
const optionalStringSchema = z.string().trim().optional();

/**
 * Schema for taste profile values.
 */
export const tasteProfileSchema = z.enum(tasteProfileValues);

/**
 * Schema for recipe visibility values.
 */
export const recipeVisibilitySchema = z.enum(recipeVisibilityValues);

/**
 * Schema for biological sex values.
 */
export const biologicalSexSchema = z.enum(biologicalSexValues);

/**
 * Schema for friend request status values.
 */
export const friendRequestStatusSchema = z.enum(friendRequestStatusValues);

/**
 * Schema for notification type values.
 */
export const notificationTypeSchema = z.enum(notificationTypeValues);

/**
 * Schema for ingredient search run status values.
 */
export const ingredientSearchStatusSchema = z.enum(ingredientSearchStatusValues);

/**
 * Schema for usernames.
 */
export const usernameSchema = requiredStringSchema;

/**
 * Schema for ZIP codes (5-digit).
 */
export const zipCodeSchema = z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits");

/**
 * Schema for email addresses.
 */
export const emailSchema = z.string().email("Email must be a valid address");

/**
 * Schema for phone numbers (basic validation).
 */
export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7;
  }, "Phone number must contain at least 7 digits");

/**
 * Schema for recipe ingredient input.
 */
export const ingredientInputSchema: z.ZodType<IngredientInput> = z.object({
  name: requiredStringSchema,
  volumeInMl: z.number().positive("Volume must be greater than 0"),
  abv: z.number().min(0, "ABV cannot be negative").max(1, "ABV cannot exceed 1"),
  estimatedPrice: z.number().positive("Estimated price must be greater than 0").optional(),
  order: z.number().int().positive("Order must be a positive integer").optional()
});

/**
 * Schema for recipe step input.
 */
export const stepInputSchema: z.ZodType<StepInput> = z.object({
  stepNumber: z.number().int().positive("Step number must be positive"),
  description: requiredStringSchema
});

/**
 * Schema for recipe creation/update input.
 */
export const recipeInputSchema: z.ZodType<RecipeInput> = z.object({
  title: requiredStringSchema,
  description: optionalStringSchema,
  tasteProfiles: z.array(tasteProfileSchema),
  visibility: recipeVisibilitySchema,
  ingredients: z.array(ingredientInputSchema).min(2, "Recipe must have at least 2 ingredients"),
  steps: z.array(stepInputSchema).min(1, "Recipe must have at least 1 step")
});

/**
 * Parse input with a schema and throw a human-readable error on failure.
 *
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns Parsed value
 */
export const parseWithSchema = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(message);
  }
  return result.data;
};

/**
 * Normalize an optional string by trimming and converting blanks to undefined.
 *
 * @param value - String value to normalize
 * @returns Normalized string or undefined
 */
export const normalizeOptionalString = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Validate and normalize a username.
 *
 * @param value - Username value to validate
 * @returns Normalized username
 */
export const parseUsername = (value: unknown): string => parseWithSchema(usernameSchema, value).trim();

/**
 * Validate and normalize a ZIP code.
 *
 * @param value - ZIP code value to validate
 * @returns Normalized ZIP code
 */
export const parseZipCode = (value: unknown): string => parseWithSchema(zipCodeSchema, value);

/**
 * Validate and normalize an email address.
 *
 * @param value - Email value to validate
 * @returns Normalized email
 */
export const parseEmail = (value: unknown): string => parseWithSchema(emailSchema, value).trim();

/**
 * Validate and normalize a phone number.
 *
 * @param value - Phone number value to validate
 * @returns Normalized phone number
 */
export const parsePhoneNumber = (value: unknown): string => parseWithSchema(phoneNumberSchema, value).trim();

/**
 * Validate and normalize a recipe input payload.
 *
 * @param value - Recipe input to validate
 * @returns Parsed recipe input
 */
export const parseRecipeInput = (value: unknown): RecipeInput => parseWithSchema(recipeInputSchema, value);
