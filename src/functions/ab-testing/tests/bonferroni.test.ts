import { describe, it, expect } from "vitest";
import { bonferroniCorrection, applyBonferroniToTests, bonferroniSummary } from "../bonferroni";

/**
 * Unit tests for Bonferroni correction implementation
 *
 * MATHEMATICAL VALIDATION:
 * All test cases use known mathematical examples that can be verified by hand
 *
 * SOURCES FOR TEST CASES:
 * 1. Standard statistical examples from multiple testing literature
 * 2. Manual calculations using Bonferroni formula: α_corrected = α / n_tests
 * 3. Verification against PRD specification (lines 170-182)
 */

function expectItem<T>(items: readonly T[], index: number): T {
	const item = items[index];
	if (item === undefined) {
		throw new Error(`Expected item at index ${index}`);
	}
	return item;
}

describe("Bonferroni Correction", () => {
	/**
	 * TEST CASE 1: Basic Three-Test Scenario
	 * Classic example: 3 tests with 95% confidence (α = 0.05)
	 * Expected corrected α = 0.05 / 3 = 0.0167
	 */
	it("should correctly apply Bonferroni correction for 3 tests", () => {
		const pValues = [0.01, 0.03, 0.08];
		const alpha = 0.05;

		const results = bonferroniCorrection(pValues, alpha);

		// Expected corrected alpha: 0.05 / 3 = 0.0167
		const expectedCorrectedAlpha = 0.05 / 3;

		expect(results).toHaveLength(3);
		const first = expectItem(results, 0);
		const second = expectItem(results, 1);
		const third = expectItem(results, 2);

		// Test 1: p=0.01, should be significant (0.01 < 0.0167)
		expect(first.originalPValue).toBe(0.01);
		expect(first.correctedPValue).toBe(0.03); // 0.01 × 3
		expect(first.isSignificant).toBe(true);
		expect(first.correctedAlpha).toBeCloseTo(expectedCorrectedAlpha, 4);

		// Test 2: p=0.03, should NOT be significant (0.03 > 0.0167)
		expect(second.originalPValue).toBe(0.03);
		expect(second.correctedPValue).toBe(0.09); // 0.03 × 3
		expect(second.isSignificant).toBe(false);
		expect(second.correctedAlpha).toBeCloseTo(expectedCorrectedAlpha, 4);

		// Test 3: p=0.08, should NOT be significant (0.08 > 0.0167)
		expect(third.originalPValue).toBe(0.08);
		expect(third.correctedPValue).toBe(0.24); // 0.08 × 3
		expect(third.isSignificant).toBe(false);
		expect(third.correctedAlpha).toBeCloseTo(expectedCorrectedAlpha, 4);
	});

	/**
	 * TEST CASE 2: Five-Test Scenario with Mixed Results
	 * Tests stricter correction with more tests
	 * Expected corrected α = 0.05 / 5 = 0.01
	 */
	it("should handle 5 tests with stricter correction", () => {
		const pValues = [0.005, 0.015, 0.025, 0.035, 0.045];
		const alpha = 0.05;

		const results = bonferroniCorrection(pValues, alpha);

		const expectedCorrectedAlpha = 0.01; // 0.05 / 5

		// Only first test should be significant (0.005 < 0.01)
		expect(expectItem(results, 0).isSignificant).toBe(true); // 0.005 < 0.01
		expect(expectItem(results, 1).isSignificant).toBe(false); // 0.015 > 0.01
		expect(expectItem(results, 2).isSignificant).toBe(false); // 0.025 > 0.01
		expect(expectItem(results, 3).isSignificant).toBe(false); // 0.035 > 0.01
		expect(expectItem(results, 4).isSignificant).toBe(false); // 0.045 > 0.01

		// All should have same corrected alpha
		results.forEach((result) => {
			expect(result.correctedAlpha).toBeCloseTo(expectedCorrectedAlpha, 4);
		});
	});

	/**
	 * TEST CASE 3: Edge Case - Corrected P-Value Capping
	 * Tests that corrected p-values are capped at 1.0
	 */
	it("should cap corrected p-values at 1.0", () => {
		const pValues = [0.8, 0.9, 0.7]; // High p-values
		const alpha = 0.05;

		const results = bonferroniCorrection(pValues, alpha);

		// Corrected p-values would be: 0.8×3=2.4, 0.9×3=2.7, 0.7×3=2.1
		// But should be capped at 1.0
		expect(expectItem(results, 0).correctedPValue).toBe(1.0); // capped from 2.4
		expect(expectItem(results, 1).correctedPValue).toBe(1.0); // capped from 2.7
		expect(expectItem(results, 2).correctedPValue).toBe(1.0); // capped from 2.1

		// None should be significant
		results.forEach((result) => {
			expect(result.isSignificant).toBe(false);
		});
	});

	/**
	 * TEST CASE 4: Single Test - No Correction Needed
	 * With only one test, Bonferroni correction should have no effect
	 */
	it("should not change results for single test", () => {
		const pValues = [0.03];
		const alpha = 0.05;

		const results = bonferroniCorrection(pValues, alpha);

		expect(results).toHaveLength(1);
		const result = expectItem(results, 0);
		expect(result.originalPValue).toBe(0.03);
		expect(result.correctedPValue).toBe(0.03); // 0.03 × 1 = 0.03
		expect(result.isSignificant).toBe(true); // 0.03 < 0.05
		expect(result.correctedAlpha).toBe(0.05); // 0.05 / 1 = 0.05
	});

	/**
	 * TEST CASE 5: Very Strict Alpha Level
	 * Tests with 99% confidence (α = 0.01)
	 */
	it("should work with strict alpha levels", () => {
		const pValues = [0.001, 0.005, 0.01];
		const alpha = 0.01; // 99% confidence

		const results = bonferroniCorrection(pValues, alpha);

		const expectedCorrectedAlpha = 0.01 / 3; // ≈ 0.0033

		// Only first test should be significant (0.001 < 0.0033)
		expect(expectItem(results, 0).isSignificant).toBe(true); // 0.001 < 0.0033
		expect(expectItem(results, 1).isSignificant).toBe(false); // 0.005 > 0.0033
		expect(expectItem(results, 2).isSignificant).toBe(false); // 0.01 > 0.0033

		results.forEach((result) => {
			expect(result.correctedAlpha).toBeCloseTo(expectedCorrectedAlpha, 4);
		});
	});
});

describe("Bonferroni Application to Test Results", () => {
	/**
	 * TEST CASE 6: Apply to Mock A/B Test Results
	 * Tests the helper function that applies Bonferroni to test result objects
	 */
	it("should apply Bonferroni correction to test result objects", () => {
		const mockTestResults = [
			{ testName: "Variation A", pValue: 0.01, isSignificant: true },
			{ testName: "Variation B", pValue: 0.03, isSignificant: true },
			{ testName: "Variation C", pValue: 0.08, isSignificant: false }
		];

		const results = applyBonferroniToTests(mockTestResults, 0.05);

		expect(results).toHaveLength(3);

		const first = expectItem(results, 0);
		const second = expectItem(results, 1);
		const third = expectItem(results, 2);

		// Original properties should be preserved
		expect(first.testName).toBe("Variation A");
		expect(second.testName).toBe("Variation B");
		expect(third.testName).toBe("Variation C");

		// Bonferroni properties should be added
		expect(first.originalPValue).toBe(0.01);
		expect(first.correctedPValue).toBe(0.03);
		expect(first.correctedAlpha).toBeCloseTo(0.0167, 3);

		// Significance should be updated based on Bonferroni correction
		expect(first.isSignificant).toBe(true); // 0.01 < 0.0167
		expect(second.isSignificant).toBe(false); // 0.03 > 0.0167 (was true, now false)
		expect(third.isSignificant).toBe(false); // 0.08 > 0.0167
	});
});

describe("Bonferroni Summary Statistics", () => {
	/**
	 * TEST CASE 7: Summary Statistics for Multiple Testing Impact
	 * Shows the effect of Bonferroni correction on significance counts
	 */
	it("should provide accurate summary of correction impact", () => {
		const pValues = [0.01, 0.03, 0.02, 0.08, 0.06];
		const alpha = 0.05;

		const summary = bonferroniSummary(pValues, alpha);

		expect(summary.totalTests).toBe(5);
		expect(summary.significantBefore).toBe(3); // 0.01, 0.03, 0.02 < 0.05
		expect(summary.significantAfter).toBe(1); // Only 0.01 < (0.05/5 = 0.01)
		expect(summary.correctedAlpha).toBe(0.01); // 0.05 / 5
		expect(summary.familyWiseErrorRate).toBe(0.05);
		expect(summary.correctionApplied).toBe(true); // > 1 test
	});

	/**
	 * TEST CASE 8: Single Test Summary (No Correction)
	 * Verifies that single tests don't trigger correction
	 */
	it("should indicate no correction needed for single test", () => {
		const pValues = [0.03];
		const alpha = 0.05;

		const summary = bonferroniSummary(pValues, alpha);

		expect(summary.totalTests).toBe(1);
		expect(summary.significantBefore).toBe(1);
		expect(summary.significantAfter).toBe(1);
		expect(summary.correctedAlpha).toBe(0.05); // No change
		expect(summary.familyWiseErrorRate).toBe(0.05);
		expect(summary.correctionApplied).toBe(false); // Only 1 test
	});
});

/**
 * MATHEMATICAL VERIFICATION NOTES:
 *
 * These tests can be verified by hand using the Bonferroni formulas:
 * 1. Corrected α = α / number_of_tests
 * 2. Corrected p-value = min(original_p × number_of_tests, 1.0)
 * 3. Significance: original_p ≤ corrected_α
 *
 * Example verification for Test Case 1:
 * - Original α = 0.05, 3 tests → corrected α = 0.05/3 ≈ 0.0167
 * - p₁ = 0.01: corrected p = 0.01×3 = 0.03, significant = 0.01 ≤ 0.0167 ✓
 * - p₂ = 0.03: corrected p = 0.03×3 = 0.09, significant = 0.03 ≤ 0.0167 ✗
 * - p₃ = 0.08: corrected p = 0.08×3 = 0.24, significant = 0.08 ≤ 0.0167 ✗
 *
 * REFERENCE:
 * Implementation matches PRD specification exactly (lines 170-182)
 */
