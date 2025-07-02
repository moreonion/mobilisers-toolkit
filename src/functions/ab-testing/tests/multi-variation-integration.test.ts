import { describe, it, expect } from "vitest";
import { chiSquareTest, pairwiseComparisons } from "../statistical-tests";
import { applyBonferroniToTests } from "../bonferroni";
import type { TestVariation } from "../../../types/ab-testing";

/**
 * Integration tests for complete multi-variation A/B testing workflow
 *
 * COMPLETE WORKFLOW TESTED:
 * 1. Overall chi-square test: "Is there ANY significant difference?"
 * 2. Pairwise comparisons: "Which variations differ from control?"
 * 3. Bonferroni correction: "Adjust for multiple testing"
 * 4. Final decision: "Which variations are truly significant?"
 *
 * This tests the real-world scenario users will face with 3+ variations.
 */

describe("Multi-Variation A/B Testing - Complete Workflow", () => {
	/**
	 * INTEGRATION TEST 1: Strong Effect Size - Should Find Significant Results
	 *
	 * Scenario: E-commerce checkout flow test
	 * - Control: Original checkout (5% conversion)
	 * - Variation A: Simplified checkout (6% conversion)
	 * - Variation B: One-click checkout (12% conversion) - big improvement
	 * - Variation C: Guest checkout (7% conversion)
	 *
	 * Expected: Overall significant, Variation B significant after Bonferroni
	 */
	it("should detect significant variation with strong effect size", () => {
		const variations: TestVariation[] = [
			{ name: "Control", visitors: 2000, conversions: 100 }, // 5.0%
			{ name: "Simplified", visitors: 2000, conversions: 120 }, // 6.0%
			{ name: "One-Click", visitors: 2000, conversions: 240 }, // 12.0% - strong effect
			{ name: "Guest", visitors: 2000, conversions: 140 } // 7.0%
		];
		const confidenceLevel = 0.95;

		// STEP 1: Overall chi-square test
		const overallTest = chiSquareTest(variations, confidenceLevel);

		expect(overallTest.isSignificant).toBe(true); // Should detect overall difference
		expect(overallTest.degreesOfFreedom).toBe(3); // (4 groups - 1) = 3 df
		expect(overallTest.pValue).toBeLessThan(0.001); // Should be highly significant

		// STEP 2: Pairwise comparisons (each variation vs control)
		const pairwiseResults = pairwiseComparisons(variations, confidenceLevel);

		expect(pairwiseResults).toHaveLength(3); // 3 variations vs control

		// Before Bonferroni correction, some tests might be significant
		const significantBefore = pairwiseResults.filter((r) => r.isSignificant).length;
		expect(significantBefore).toBeGreaterThan(0); // At least one should be significant

		// STEP 3: Apply Bonferroni correction for multiple testing
		const bonferroniResults = applyBonferroniToTests(pairwiseResults, 0.05);

		// Check Bonferroni adjustment
		expect(bonferroniResults[0].correctedAlpha).toBeCloseTo(0.05 / 3, 4); // ≈ 0.0167

		// STEP 4: Final significance after correction
		const significantAfter = bonferroniResults.filter((r) => r.isSignificant).length;

		// With strong effect (12% vs 5%), One-Click should remain significant
		expect(significantAfter).toBeGreaterThan(0);

		// Verify specific results
		const oneClickResult = bonferroniResults.find((r) => r.variation.name === "One-Click");
		expect(oneClickResult).toBeDefined();
		expect(oneClickResult!.isSignificant).toBe(true); // Strong effect survives correction

		// Document the complete workflow results
		console.log("Multi-Variation Test Results:");
		console.log(`Overall chi-square p-value: ${overallTest.pValue.toFixed(6)}`);
		console.log(`Significant before Bonferroni: ${significantBefore}/3`);
		console.log(`Significant after Bonferroni: ${significantAfter}/3`);
		console.log(`Corrected alpha threshold: ${bonferroniResults[0].correctedAlpha.toFixed(4)}`);
	});

	/**
	 * INTEGRATION TEST 2: Moderate Effects - Bonferroni Should Reduce Significance
	 *
	 * Scenario: Landing page optimization test
	 * - Control: Original page (8% conversion)
	 * - Variation A: New headline (9% conversion) - small effect
	 * - Variation B: New design (10% conversion) - small effect
	 * - Variation C: New CTA (8.5% conversion) - tiny effect
	 *
	 * Expected: Some might be significant individually, fewer after Bonferroni
	 */
	it("should show Bonferroni correction reducing false positives", () => {
		const variations: TestVariation[] = [
			{ name: "Control", visitors: 1000, conversions: 80 }, // 8.0%
			{ name: "New Headline", visitors: 1000, conversions: 90 }, // 9.0%
			{ name: "New Design", visitors: 1000, conversions: 100 }, // 10.0%
			{ name: "New CTA", visitors: 1000, conversions: 85 } // 8.5%
		];
		const confidenceLevel = 0.95;

		// STEP 1: Overall test
		// const overallTest = chiSquareTest(variations, confidenceLevel);

		// STEP 2: Pairwise comparisons
		const pairwiseResults = pairwiseComparisons(variations, confidenceLevel);
		const significantBefore = pairwiseResults.filter((r) => r.isSignificant).length;

		// STEP 3: Bonferroni correction
		const bonferroniResults = applyBonferroniToTests(pairwiseResults, 0.05);
		const significantAfter = bonferroniResults.filter((r) => r.isSignificant).length;

		// VERIFICATION: Bonferroni should be more conservative
		expect(significantAfter).toBeLessThanOrEqual(significantBefore);

		// With moderate effects and smaller samples, might have no significant results after correction
		console.log("Moderate Effects Test:");
		console.log(`Before Bonferroni: ${significantBefore}/3 significant`);
		console.log(`After Bonferroni: ${significantAfter}/3 significant`);
		console.log(`Correction reduced false positives by: ${significantBefore - significantAfter}`);
	});

	/**
	 * INTEGRATION TEST 3: No Real Differences - Should Find Nothing Significant
	 *
	 * Scenario: Variations that are essentially identical
	 * All groups have very similar conversion rates (random variation only)
	 *
	 * Expected: No significance in any test
	 */
	it("should find no significance when variations are identical", () => {
		const variations: TestVariation[] = [
			{ name: "Control", visitors: 1500, conversions: 150 }, // 10.0%
			{ name: "Variation A", visitors: 1500, conversions: 148 }, // 9.87%
			{ name: "Variation B", visitors: 1500, conversions: 152 }, // 10.13%
			{ name: "Variation C", visitors: 1500, conversions: 151 } // 10.07%
		];
		const confidenceLevel = 0.95;

		// Complete workflow
		const overallTest = chiSquareTest(variations, confidenceLevel);
		const pairwiseResults = pairwiseComparisons(variations, confidenceLevel);
		const bonferroniResults = applyBonferroniToTests(pairwiseResults, 0.05);

		// Verification: Nothing should be significant
		expect(overallTest.isSignificant).toBe(false);
		expect(overallTest.pValue).toBeGreaterThan(0.05);

		const significantAfter = bonferroniResults.filter((r) => r.isSignificant).length;
		expect(significantAfter).toBe(0); // No variations should be significant

		// All individual p-values should be high
		bonferroniResults.forEach((result) => {
			expect(result.pValue).toBeGreaterThan(0.1); // High p-values for no difference
		});
	});

	/**
	 * INTEGRATION TEST 4: Single Strong Winner Among Weak Competitors
	 *
	 * Scenario: Most variations fail, but one is a clear winner
	 * Tests that Bonferroni doesn't mask genuine strong effects
	 *
	 * Expected: Only the strong winner survives Bonferroni correction
	 */
	it("should identify single strong winner despite multiple testing", () => {
		const variations: TestVariation[] = [
			{ name: "Control", visitors: 2000, conversions: 200 }, // 10.0%
			{ name: "Weak A", visitors: 2000, conversions: 205 }, // 10.25% - tiny effect
			{ name: "Strong Winner", visitors: 2000, conversions: 320 }, // 16.0% - strong effect
			{ name: "Weak B", visitors: 2000, conversions: 195 }, // 9.75% - tiny effect
			{ name: "Weak C", visitors: 2000, conversions: 210 } // 10.5% - tiny effect
		];
		const confidenceLevel = 0.95;

		// Complete workflow
		const overallTest = chiSquareTest(variations, confidenceLevel);
		const pairwiseResults = pairwiseComparisons(variations, confidenceLevel);
		const bonferroniResults = applyBonferroniToTests(pairwiseResults, 0.05);

		// Overall test should be significant (driven by strong winner)
		expect(overallTest.isSignificant).toBe(true);

		// After Bonferroni, only strong winner should survive
		const significantResults = bonferroniResults.filter((r) => r.isSignificant);
		expect(significantResults).toHaveLength(1);
		expect(significantResults[0].variation.name).toBe("Strong Winner");

		// Verify the winner has genuinely low p-value even after correction
		const winner = significantResults[0];
		expect(winner.pValue).toBeLessThan(winner.correctedAlpha);
		expect(winner.correctedPValue).toBeLessThan(0.05); // Adjusted p-value still significant

		console.log("Single Winner Test:");
		console.log(`Winner: ${winner.variation.name}`);
		console.log(`Original p-value: ${winner.originalPValue.toFixed(6)}`);
		console.log(`Corrected p-value: ${winner.correctedPValue.toFixed(6)}`);
		console.log(
			`Improvement: ${winner.improvement.relative !== null ? winner.improvement.relative.toFixed(1) + "%" : "N/A"}`
		);
	});

	/**
	 * INTEGRATION TEST 5: Edge Case - All Variations Worse Than Control
	 *
	 * Tests scenario where all variations perform worse than control
	 * Important for product teams to know when new ideas aren't working
	 */
	it("should detect when all variations perform worse than control", () => {
		const variations: TestVariation[] = [
			{ name: "Control", visitors: 1000, conversions: 120 }, // 12.0% - best
			{ name: "Change A", visitors: 1000, conversions: 100 }, // 10.0% - worse
			{ name: "Change B", visitors: 1000, conversions: 90 }, // 9.0% - worse
			{ name: "Change C", visitors: 1000, conversions: 95 } // 9.5% - worse
		];
		const confidenceLevel = 0.95;

		// const overallTest = chiSquareTest(variations, confidenceLevel);
		const pairwiseResults = pairwiseComparisons(variations, confidenceLevel);
		const bonferroniResults = applyBonferroniToTests(pairwiseResults, 0.05);

		// Overall test might be significant (there are differences)
		// But no individual variations should beat control
		bonferroniResults.forEach((result) => {
			// All improvements should be negative (worse than control)
			if (result.improvement.relative !== null) {
				expect(result.improvement.relative).toBeLessThan(0);
			}
		});

		console.log("All Variations Worse Test:");
		bonferroniResults.forEach((result) => {
			console.log(
				`${result.variation.name}: ${result.improvement.relative !== null ? result.improvement.relative.toFixed(1) + "% change" : "N/A"}`
			);
		});
	});
});

/**
 * REAL-WORLD USAGE EXAMPLE:
 *
 * This is how a product team would use our complete multi-variation testing:
 *
 * ```typescript
 * // 1. Define test data
 * const testResults = [control, variationA, variationB, variationC];
 *
 * // 2. Run overall test
 * const overall = chiSquareTest(testResults, 0.95);
 * if (!overall.isSignificant) {
 *   return "No significant differences found";
 * }
 *
 * // 3. Run pairwise comparisons
 * const pairwise = pairwiseComparisons(testResults, 0.95);
 *
 * // 4. Apply Bonferroni correction
 * const final = applyBonferroniToTests(pairwise, 0.05);
 *
 * // 5. Report winners
 * const winners = final.filter(r => r.isSignificant && r.improvement.relative > 0);
 * return winners.map(w => `${w.variation.name}: +${w.improvement.relative.toFixed(1)}%`);
 * ```
 */
