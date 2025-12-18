import type { Doc } from "../_generated/dataModel";
import { parseWithSchema } from "./validators";
import { z } from "zod";

/**
 * Widmark factor constants for BAC calculation.
 * Based on biological sex differences in body water distribution.
 */
const WIDMARK_FACTORS = {
  male: 0.68,
  female: 0.55
} as const;

/**
 * Alcohol metabolism rate (BAC per hour).
 * Average human metabolizes about 0.015 BAC per hour.
 */
const METABOLISM_RATE_PER_HOUR = 0.015;

/**
 * Alcohol density constant (grams per milliliter).
 */
const ALCOHOL_DENSITY_G_PER_ML = 0.789;

/**
 * Schema for validating BAC ingredient inputs.
 */
const bacIngredientSchema = z.object({
  volumeInMl: z.number().positive("Volume must be greater than 0"),
  abv: z.number().min(0, "ABV cannot be negative").max(1, "ABV cannot exceed 1")
});

/**
 * Schema for validating BAC ingredient arrays.
 */
const bacIngredientListSchema = z.array(bacIngredientSchema);

/**
 * Calculate total alcohol content in grams from ingredients.
 *
 * @param ingredients - Array of recipe ingredients
 * @returns Total alcohol in grams
 *
 * @example
 * const grams = calculateTotalAlcoholGrams([
 *   { name: "Vodka", volumeInMl: 45, abv: 0.4 },
 *   { name: "Orange Juice", volumeInMl: 90, abv: 0 }
 * ]);
 * // Returns: 45 * 0.40 * 0.789 = 14.202 grams
 */
export const calculateTotalAlcoholGrams = (ingredients: Array<{ volumeInMl: number; abv: number }>): number => {
  const parsed = parseWithSchema(bacIngredientListSchema, ingredients);

  return parsed.reduce((total, ingredient) => {
    const alcoholVolumeML = ingredient.volumeInMl * ingredient.abv;
    const alcoholGrams = alcoholVolumeML * ALCOHOL_DENSITY_G_PER_ML;
    return total + alcoholGrams;
  }, 0);
};

/**
 * Calculate estimated Blood Alcohol Concentration (BAC) using the Widmark formula.
 *
 * The Widmark formula: BAC = A / (r x W)
 * Where:
 * - A = mass of alcohol consumed (grams)
 * - r = Widmark factor (0.68 for males, 0.55 for females)
 * - W = body weight (grams)
 *
 * This function calculates immediate BAC per single serving.
 *
 * @param ingredients - Recipe ingredients with volume and ABV
 * @param biologicalSex - User's biological sex for Widmark factor
 * @param weightInKg - User's weight in kilograms
 * @returns Estimated BAC as a decimal (e.g., 0.08 = 0.08%)
 */
export const calculateBAC = (
  ingredients: Array<{ volumeInMl: number; abv: number }>,
  biologicalSex: "male" | "female",
  weightInKg: number
): number => {
  if (weightInKg <= 0) {
    throw new Error("Weight must be positive");
  }

  const alcoholGrams = calculateTotalAlcoholGrams(ingredients);
  const widmarkFactor = WIDMARK_FACTORS[biologicalSex];
  const weightInGrams = weightInKg * 1000;

  const bac = alcoholGrams / (widmarkFactor * weightInGrams);
  return Math.round(bac * 10000) / 10000;
};

/**
 * Calculate estimated BAC after a given time period.
 * Accounts for alcohol metabolism over time.
 *
 * @param initialBAC - Initial BAC after drinking
 * @param hoursElapsed - Hours since drinking started
 * @returns Estimated current BAC (minimum 0)
 */
export const calculateBACAfterTime = (initialBAC: number, hoursElapsed: number): number => {
  if (initialBAC < 0) {
    throw new Error("Initial BAC cannot be negative");
  }
  if (hoursElapsed < 0) {
    throw new Error("Hours elapsed cannot be negative");
  }

  const metabolized = METABOLISM_RATE_PER_HOUR * hoursElapsed;
  return Math.max(0, initialBAC - metabolized);
};

/**
 * Get BAC risk level and associated message.
 * Based on common legal and safety thresholds.
 *
 * @param bac - Blood alcohol concentration
 * @returns Risk level and warning message
 */
export const getBACRiskLevel = (
  bac: number
): {
  level: "safe" | "caution" | "warning" | "danger";
  message: string;
  color: string;
} => {
  if (bac < 0) {
    throw new Error("BAC cannot be negative");
  }

  if (bac < 0.02) {
    return {
      level: "safe",
      message: "Minimal impairment expected",
      color: "green"
    };
  }
  if (bac < 0.05) {
    return {
      level: "caution",
      message: "Mild relaxation, slight impairment",
      color: "yellow"
    };
  }
  if (bac < 0.08) {
    return {
      level: "warning",
      message: "Impaired coordination and judgment",
      color: "orange"
    };
  }

  return {
    level: "danger",
    message: "Significant impairment - Do not drive",
    color: "red"
  };
};

/**
 * Calculate estimated time until BAC returns to zero.
 *
 * @param bac - Current BAC level
 * @returns Hours until sober (BAC = 0)
 */
export const calculateTimeUntilSober = (bac: number): number => {
  if (bac <= 0) {
    return 0;
  }

  return bac / METABOLISM_RATE_PER_HOUR;
};

/**
 * Calculate BAC summary data for a recipe and user profile.
 *
 * @param ingredients - Recipe ingredient list
 * @param userProfile - User profile document for sex/weight
 * @returns BAC summary data or undefined when profile is incomplete
 */
export const calculateBACSummary = (
  ingredients: Array<{ volumeInMl: number; abv: number }>,
  userProfile: Pick<Doc<"users">, "biologicalSex" | "weightInKg">
):
  | {
      bac: number;
      bacPercent: string;
      hoursUntilSober: number;
      riskLevel: ReturnType<typeof getBACRiskLevel>;
    }
  | undefined => {
  if (!userProfile.biologicalSex || !userProfile.weightInKg) {
    return undefined;
  }

  const bac = calculateBAC(ingredients, userProfile.biologicalSex, userProfile.weightInKg);
  const riskLevel = getBACRiskLevel(bac);
  const hoursUntilSober = calculateTimeUntilSober(bac);

  return {
    bac,
    bacPercent: (bac * 100).toFixed(2),
    hoursUntilSober,
    riskLevel
  };
};
