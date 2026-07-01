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
 * Includes the overall significance test used by the technical details panel.
 */
export interface MultiVariationResult {
	/** Overall chi-square test to determine if any variations differ significantly */
	overallTest: ChiSquareResult;
	/** Whether multiple comparison correction was applied in the comprehensive analysis */
	bonferroniCorrected: boolean;
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
 * Performance tier grouping for comprehensive analysis
 * Groups variations by statistical performance levels
 */
export interface PerformanceTier {
	/** Tier number (1 = highest performing) */
	tier: number;
	/** Human-readable tier label */
	label: string;
	/** Variations in this performance tier */
	variations: Array<{
		name: string;
		visitors: number;
		conversions: number;
		conversionRate: number;
	}>;
}

/**
 * Business insight from comprehensive analysis
 * Provides actionable interpretation of statistical results
 */
export interface BusinessInsight {
	/** Type of insight for styling/iconography */
	type: "success" | "warning" | "info";
	/** Short descriptive title */
	title: string;
	/** Main insight message */
	message: string;
	/** Optional actionable recommendation */
	actionable?: string;
}

/**
 * Comprehensive pairwise analysis results
 * Provides business-friendly interpretation of all statistical comparisons
 */
export interface ComprehensiveAnalysisResult {
	/** All pairwise comparisons with Bonferroni correction applied */
	allComparisons: TwoProportionResult[];
	/** Variations grouped by statistical performance tiers */
	performanceGroups: PerformanceTier[];
	/** Business-friendly insights and recommendations */
	insights: BusinessInsight[];
	/** Whether Bonferroni correction was applied */
	bonferroniCorrected: boolean;
	/** The corrected alpha level used for significance testing */
	correctedAlpha: number;
}
