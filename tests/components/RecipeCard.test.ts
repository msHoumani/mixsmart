import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/svelte";
import RecipeCard from "../../src/components/recipe/RecipeCard.svelte";

/**
 * Minimal recipe shape required by the RecipeCard component.
 */
type RecipeCardRecipe = {
  _id: string;
  title: string;
  description?: string;
  tasteProfiles: string[];
  isAIGenerated: boolean;
};

/**
 * Minimal ingredient shape required by the RecipeCard component.
 */
type RecipeCardIngredient = {
  _id: string;
  name: string;
  volumeInMl: number;
};

/**
 * Props accepted by the RecipeCard component in tests.
 */
type RecipeCardProps = {
  recipe: RecipeCardRecipe;
  ingredients: RecipeCardIngredient[];
  userProfile?: { biologicalSex?: "male" | "female"; weightInKg?: number } | undefined;
  likeCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  onLike: () => void;
  onFavorite: () => void;
};

/**
 * Define RecipeCard component test cases.
 */
const defineRecipeCardTests = (): void => {
  const mockRecipe: RecipeCardRecipe = {
    _id: "test-recipe-id",
    title: "Test Cocktail",
    description: "A test description",
    tasteProfiles: ["sweet", "sour"],
    isAIGenerated: false
  };

  const mockIngredients: RecipeCardIngredient[] = [
    { _id: "ing-1", name: "Vodka", volumeInMl: 45 },
    { _id: "ing-2", name: "Lime Juice", volumeInMl: 30 }
  ];

  /**
   * Render the RecipeCard with default props.
   */
  const renderCard = (): void => {
    const props: RecipeCardProps = {
      recipe: mockRecipe,
      ingredients: mockIngredients,
      userProfile: undefined,
      likeCount: 5,
      isLiked: false,
      isFavorited: false,
      onLike: () => {},
      onFavorite: () => {}
    };

    render(RecipeCard, { props: props as unknown as Record<string, unknown> });
  };

  /**
   * Assert that the recipe title renders.
   */
  const testTitleRender = (): void => {
    renderCard();
    expect(screen.getByText("Test Cocktail")).toBeInTheDocument();
  };

  /**
   * Assert that taste profile badges render.
   */
  const testTasteProfiles = (): void => {
    renderCard();
    expect(screen.getByText("sweet")).toBeInTheDocument();
    expect(screen.getByText("sour")).toBeInTheDocument();
  };

  test("renders recipe title", testTitleRender);
  test("displays taste profile badges", testTasteProfiles);
};

describe("RecipeCard", defineRecipeCardTests);
