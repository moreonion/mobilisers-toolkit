/**
 * Bonferroni correction for multiple hypothesis testing
 *
 * WHAT THIS DOES (for novices):
 * When you test multiple variations at once, you're more likely to find "fake" significant results by chance.
 * Think of it like flipping coins - if you flip one coin and get heads, that's normal. But if you flip 20 coins
 * and get heads on 19 of them, that's suspicious and probably not random.
 *
 * The Bonferroni correction makes each individual test stricter to keep your overall error rate low.
 *
 * HOW IT WORKS (for experts):
 * - Adjusts significance threshold: α_adjusted = α / number_of_tests
 * - Controls family-wise error rate (FWER) at desired α level
 * - Conservative approach: reduces Type I error but increases Type II error
 * - Alternative adjusted p-value: p_adjusted = min(p_original × number_of_tests, 1.0)
 *
 * EXAMPLE:
 * Testing 3 variations with 95% confidence (α = 0.05):
 * - Individual test threshold: 0.05 / 3 = 0.0167 (each test needs p < 0.0167)
 * - This keeps overall false positive rate at 5%
 *
 * @param pValues - Array of p-values from individual tests
 * @param alpha - Desired family-wise error rate (default: 0.05 for 95% confidence)
 * @returns Array of results with original p-values, adjusted thresholds, and significance decisions
 */
export function bonferroniCorrection(pValues: number[], alpha: number = 0.05) {
	const numTests = pValues.length;
	const correctedAlpha = alpha / numTests;

	return pValues.map((pValue) => ({
		originalPValue: pValue,
		correctedPValue: Math.min(pValue * numTests, 1.0),
		isSignificant: pValue <= correctedAlpha,
		correctedAlpha: correctedAlpha
	}));
}

/**
 * Type definition for Bonferroni correction results
 * Makes it clear what each result contains
 */
export interface BonferroniResult {
	/** The original p-value from the individual test */
	originalPValue: number;
	/** Adjusted p-value (original × number of tests, capped at 1.0) */
	correctedPValue: number;
	/** Whether this test is significant after Bonferroni correction */
	isSignificant: boolean;
	/** The adjusted significance threshold used for this family of tests */
	correctedAlpha: number;
}

/**
 * Apply Bonferroni correction to a set of A/B test results
 *
 * WHAT THIS DOES: Takes multiple A/B test results and adjusts them for multiple testing
 *
 * @param testResults - Array of test results with p-values
 * @param alpha - Family-wise error rate (default: 0.05)
 * @returns Array of results with Bonferroni correction applied
 */
export function applyBonferroniToTests<T extends { pValue: number; isSignificant: boolean }>(
	testResults: T[],
	alpha: number = 0.05
): (T & BonferroniResult)[] {
	const pValues = testResults.map((result) => result.pValue);
	const bonferroniResults = bonferroniCorrection(pValues, alpha);

	return testResults.map((result, index) => ({
		...result,
		...bonferroniResults[index],
		// Override the original significance with Bonferroni-corrected significance
		isSignificant: bonferroniResults[index].isSignificant
	}));
}

/**
 * Calculate how many tests would be significant with and without Bonferroni correction
 * Useful for showing users the impact of multiple testing correction
 *
 * @param pValues - Array of p-values from tests
 * @param alpha - Significance threshold
 * @returns Summary of significant tests before and after correction
 */
export function bonferroniSummary(pValues: number[], alpha: number = 0.05) {
	const results = bonferroniCorrection(pValues, alpha);

	const significantBefore = pValues.filter((p) => p <= alpha).length;
	const significantAfter = results.filter((r) => r.isSignificant).length;

	return {
		totalTests: pValues.length,
		significantBefore,
		significantAfter,
		correctedAlpha: alpha / pValues.length,
		familyWiseErrorRate: alpha,
		correctionApplied: pValues.length > 1
	};
}
