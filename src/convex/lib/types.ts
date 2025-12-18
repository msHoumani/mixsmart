/**
 * Supported taste profile values for recipes.
 */
export const tasteProfileValues = ["boozy", "sweet", "sour", "bitter", "umami", "astringent", "hot", "cold"] as const;

/**
 * Union type for taste profile values.
 */
export type TasteProfile = (typeof tasteProfileValues)[number];

/**
 * Supported recipe visibility values.
 */
export const recipeVisibilityValues = ["private", "friends_only", "public"] as const;

/**
 * Union type for recipe visibility values.
 */
export type RecipeVisibility = (typeof recipeVisibilityValues)[number];

/**
 * Filter options for recipe list UI.
 */
export const recipeVisibilityFilters = ["all", "public", "friends", "mine"] as const;

/**
 * Union type for recipe list visibility filter values.
 */
export type RecipeVisibilityFilter = (typeof recipeVisibilityFilters)[number];

/**
 * Biological sex values used in BAC calculations.
 */
export const biologicalSexValues = ["male", "female"] as const;

/**
 * Union type for biological sex values.
 */
export type BiologicalSex = (typeof biologicalSexValues)[number];

/**
 * Friend request status values.
 */
export const friendRequestStatusValues = ["pending", "accepted", "declined"] as const;

/**
 * Union type for friend request status values.
 */
export type FriendRequestStatus = (typeof friendRequestStatusValues)[number];

/**
 * Notification type values.
 */
export const notificationTypeValues = [
  "like",
  "favorite",
  "comment",
  "friend_request",
  "friend_accepted",
  "message"
] as const;

/**
 * Union type for notification type values.
 */
export type NotificationType = (typeof notificationTypeValues)[number];

/**
 * Ingredient search run status values.
 */
export const ingredientSearchStatusValues = ["running", "completed", "failed"] as const;

/**
 * Union type for ingredient search run status values.
 */
export type IngredientSearchStatus = (typeof ingredientSearchStatusValues)[number];

/**
 * Input structure for recipe ingredients.
 */
export type IngredientInput = {
  /** Ingredient name */
  name: string;
  /** Volume in milliliters */
  volumeInMl: number;
  /** Alcohol by volume (0-1) */
  abv: number;
  /** Optional estimated price in USD */
  estimatedPrice?: number;
  /** Optional display order */
  order?: number;
};

/**
 * Input structure for recipe steps.
 */
export type StepInput = {
  /** Step number (1-indexed) */
  stepNumber: number;
  /** Step description */
  description: string;
};

/**
 * Input structure for recipe creation/update.
 */
export type RecipeInput = {
  /** Recipe title */
  title: string;
  /** Optional description */
  description?: string;
  /** Taste profile tags */
  tasteProfiles: TasteProfile[];
  /** Visibility setting */
  visibility: RecipeVisibility;
  /** Ingredient list */
  ingredients: IngredientInput[];
  /** Step list */
  steps: StepInput[];
};
