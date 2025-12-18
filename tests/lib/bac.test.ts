import { describe, expect, test } from "vitest";
import { calculateBAC, calculateTotalAlcoholGrams, getBACRiskLevel } from "../../src/convex/lib/bac";

/**
 * Define BAC calculation test cases.
 */
const defineBacTests = (): void => {
  /**
   * Assert total alcohol grams calculation.
   */
  const testTotalAlcoholGrams = (): void => {
    const ingredients = [
      { volumeInMl: 45, abv: 0.4 },
      { volumeInMl: 30, abv: 0 }
    ];

    const grams = calculateTotalAlcoholGrams(ingredients);
    expect(grams).toBeCloseTo(14.202, 2);
  };

  /**
   * Assert BAC calculation for a male user is within a reasonable range.
   */
  const testMaleBac = (): void => {
    const ingredients = [{ volumeInMl: 45, abv: 0.4 }];
    const bac = calculateBAC(ingredients, "male", 70);

    expect(bac).toBeGreaterThan(0);
    expect(bac).toBeLessThan(0.1);
  };

  /**
   * Assert female BAC is higher than male for equal intake and weight.
   */
  const testFemaleHigherBac = (): void => {
    const ingredients = [{ volumeInMl: 60, abv: 0.4 }];

    const maleBac = calculateBAC(ingredients, "male", 70);
    const femaleBac = calculateBAC(ingredients, "female", 70);

    expect(femaleBac).toBeGreaterThan(maleBac);
  };

  /**
   * Assert BAC risk level thresholds map correctly.
   */
  const testRiskLevels = (): void => {
    expect(getBACRiskLevel(0.01).level).toBe("safe");
    expect(getBACRiskLevel(0.03).level).toBe("caution");
    expect(getBACRiskLevel(0.06).level).toBe("warning");
    expect(getBACRiskLevel(0.1).level).toBe("danger");
  };

  test("calculates total alcohol grams correctly", testTotalAlcoholGrams);
  test("calculates BAC for male correctly", testMaleBac);
  test("female BAC higher than male for same consumption", testFemaleHigherBac);
  test("risk levels are correct", testRiskLevels);
};

describe("BAC Calculations", defineBacTests);
