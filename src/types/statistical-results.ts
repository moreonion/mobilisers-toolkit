// TypeScript interfaces for statistical test results

/**
 * Base interface for all statistical test results
 * Contains common properties returned by statistical tests
 */
export interface StatisticalTestResult {
	/** Whether the test result is statistically significant at the given confidence level */
	isSignificant: boolean;
	/** The p-value from the statistical test (probability of observing this result by chance) */
	pValue: number;
	/** The confidence level used for the test (e.g., 0.95 for 95% confidence) */
	confidenceLevel: number;
	/** The calculated test statistic (z-score, t-statistic, chi-square value, etc.) */
	testStatistic: number;
	/** 
	 * Degrees of freedom: A statistical concept that roughly means "how many independent pieces of data we have"
	 * For chi-square tests: (number of rows - 1) × (number of columns - 1)
	 * For t-tests: roughly the sample size minus 1
	 * Higher degrees of freedom generally mean more reliable results
	 */
	degreesOfFreedom?: number;
}

/**
 * Results from a two-proportion z-test comparing control vs single variation
 * Used for simple A/B tests with one control and one variation
 */
export interface TwoProportionResult extends StatisticalTestResult {
	/** Control group data and metrics */
	control: {
		/** Display name for the control group */
		name: string;
		/** Conversion rate as a decimal (e.g., 0.15 for 15%) */
		conversionRate: number;
		/** Total number of visitors/users in control group */
		visitors: number;
		/** Number of conversions in control group */
		conversions: number;
	};
	/** Variation group data and metrics */
	variation: {
		/** Display name for the variation group */
		name: string;
		/** Conversion rate as a decimal (e.g., 0.18 for 18%) */
		conversionRate: number;
		/** Total number of visitors/users in variation group */
		visitors: number;
		/** Number of conversions in variation group */
		conversions: number;
	};
	/** Calculated improvement metrics comparing variation to control */
	improvement: {
		/** Absolute difference in conversion rates (variation - control) */
		absolute: number;
		/** Relative improvement as a percentage (e.g., 20.5 for 20.5% improvement), or null if control has 0 conversions */
		relative: number | null;
		/** Confidence interval for the improvement estimate */
		confidenceInterval: {
			/** Lower bound of the confidence interval */
			lower: number;
			/** Upper bound of the confidence interval */
			upper: number;
		};
	};
}

/**
 * Results from a chi-square test of independence
 * Used for multi-variation tests and contingency table analysis
 */
export interface ChiSquareResult extends StatisticalTestResult {
	/** 
	 * Expected frequencies: What we would expect to see in each group if there were no real differences
	 * Calculated based on the overall conversion rate applied to each group's sample size
	 * This is a 2D array: [group1_conversions, group1_non_conversions], [group2_conversions, group2_non_conversions], etc.
	 */
	expectedFrequencies: number[][];
	/** 
	 * Observed frequencies: What we actually saw in the test results
	 * This is a 2D array showing actual conversions and non-conversions for each group
	 * Format: [group1_conversions, group1_non_conversions], [group2_conversions, group2_non_conversions], etc.
	 */
	observedFrequencies: number[][];
	/** 
	 * Residuals: Show which groups contributed most to the overall chi-square result
	 * Larger absolute values indicate groups that deviate most from expected results
	 * Positive values = more conversions than expected, negative = fewer conversions than expected
	 */
	residuals: number[][];
}

/**
 * Complete results for multi-variation A/B tests (3+ variations)
 * Includes overall significance test and pairwise comparisons
 */
export interface MultiVariationResult {
	/** Overall chi-square test to determine if any variations differ significantly */
	overallTest: ChiSquareResult;
	/** 
	 * Individual pairwise comparisons: When you have 3+ variations, you often want to know
	 * which specific variations beat the control, not just "something is different"
	 * This compares each variation individually against the control (Variation A vs Control, Variation B vs Control, etc.)
	 * Each comparison is a separate two-proportion test
	 */
	pairwiseComparisons: TwoProportionResult[];
	/** Whether Bonferroni correction was applied to adjust for multiple comparisons */
	bonferroniCorrected: boolean;
	/** 
	 * The stricter confidence level used for each individual test when Bonferroni correction is applied
	 * Problem: When you do multiple tests, you're more likely to find false positives by chance
	 * Solution: Bonferroni correction makes each individual test more strict to compensate
	 * Example: For 95% overall confidence with 3 comparisons, each test uses 95%/3 = 98.33% confidence
	 * This keeps your overall false positive rate at the desired 5%
	 */
	bonferroniAlpha?: number;
	/** The best performing variation if one exists */
	winningVariation?: {
		/** Name of the winning variation */
		name: string;
		/** Conversion rate of the winning variation */
		conversionRate: number;
		/** Percentage improvement over control */
		improvement: number;
	};
}

/**
 * Individual validation error for specific input fields
 */
export interface ValidationError {
	/** The field name that failed validation */
	field: string;
	/** User-friendly error message describing the problem */
	message: string;
	/** Error code for programmatic handling */
	code: string;
}

/**
 * Error information for calculation failures
 * Provides context about what went wrong during statistical calculations
 */
export interface CalculationError {
	/** Type of error that occurred */
	type: 'validation' | 'statistical' | 'computation';
	/** High-level error message for display to users */
	message: string;
	/** Detailed validation errors if type is 'validation' */
	errors?: ValidationError[];
}