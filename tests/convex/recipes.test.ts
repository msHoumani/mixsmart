import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../src/convex/schema";
import { parseRecipeInput } from "../../src/convex/lib/validators";
import { listRecipes } from "../../src/convex/functions/recipes";

/**
 * Seed data for creating a test user.
 */
type TestUserSeed = {
  authUserId: string;
  username: string;
};

/**
 * Seed data for creating a test recipe.
 */
type TestRecipeSeed = {
  creatorId: string;
  title: string;
  visibility: "private" | "friends_only" | "public";
};

/**
 * Create a user record for test scenarios.
 *
 * @param t - Convex test harness instance
 * @param seed - User seed data
 * @returns Created user ID
 */
const createUser = async (t: ReturnType<typeof convexTest>, seed: TestUserSeed): Promise<string> => {
  return t.run(async (ctx) => {
    return ctx.db.insert("users", {
      authUserId: seed.authUserId,
      username: seed.username,
      is2FAEnabled: false,
      ageVerified: true,
      createdAt: Date.now()
    });
  });
};

/**
 * Create a recipe record for test scenarios.
 *
 * @param t - Convex test harness instance
 * @param seed - Recipe seed data
 * @returns Created recipe ID
 */
const createRecipe = async (t: ReturnType<typeof convexTest>, seed: TestRecipeSeed): Promise<string> => {
  return t.run(async (ctx) => {
    return ctx.db.insert("recipes", {
      creatorId: seed.creatorId,
      title: seed.title,
      tasteProfiles: ["sweet"],
      visibility: seed.visibility,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isAIGenerated: false,
      currentVersion: 1
    });
  });
};

/**
 * Define Convex recipe function tests.
 */
const defineRecipeFunctionTests = (): void => {
  /**
   * Ensure recipe input validation enforces minimum ingredients.
   */
  const testMinimumIngredients = (): void => {
    expect(() =>
      parseRecipeInput({
        title: "Too Few Ingredients",
        description: "Validation test",
        tasteProfiles: ["sweet"],
        visibility: "private",
        ingredients: [{ name: "Vodka", volumeInMl: 45, abv: 0.4 }],
        steps: [{ stepNumber: 1, description: "Stir" }]
      })
    ).toThrow("Recipe must have at least 2 ingredients");
  };

  /**
   * Ensure private recipes are not returned to non-owners.
   */
  const testVisibilityControls = async (): Promise<void> => {
    const t = convexTest(schema);
    const user1Id = await createUser(t, { authUserId: "user1-auth", username: "user1" });
    const user2Id = await createUser(t, { authUserId: "user2-auth", username: "user2" });

    const privateRecipeId = await createRecipe(t, {
      creatorId: user1Id,
      title: "Private Recipe",
      visibility: "private"
    });

    const publicRecipeId = await createRecipe(t, {
      creatorId: user1Id,
      title: "Public Recipe",
      visibility: "public"
    });

    const results = await t.run(async (ctx) => {
      const ctxWithAuth = {
        ...ctx,
        auth: {
          getUserIdentity: async () => ({ subject: "user2-auth" })
        }
      };

      return listRecipes.handler(ctxWithAuth as typeof ctx, {
        visibility: "all",
        search: undefined
      });
    });

    const recipeIds = results.map((result) => result.recipe._id as string);
    expect(recipeIds).not.toContain(privateRecipeId);
    expect(recipeIds).toContain(publicRecipeId);

    expect(user2Id).not.toBe(user1Id);
  };

  test("createRecipe requires minimum 2 ingredients", testMinimumIngredients);
  test("recipe visibility controls access", testVisibilityControls);
};

describe("Recipe Functions", defineRecipeFunctionTests);
