// TypeScript interfaces for A/B testing data and calculations

/**
 * Data for a single test variation (control or test group)
 */
export interface TestVariation {
	/** Display name for this variation (e.g., "Control", "Red Button", "Version A") */
	name: string;
	/** Total number of people who saw this variation */
	visitors: number;
	/** Number of people who converted (completed the desired action) */
	conversions: number;
	/** Conversion rate as a decimal (calculated: conversions / visitors) */
	conversionRate?: number;
}

/**
 * Complete input data for an A/B test
 * Used when user provides all test data at once
 */
export interface ABTestInput {
	/** The control/baseline variation to compare against */
	controlVariation: TestVariation;
	/** Array of test variations to compare to the control */
	variations: TestVariation[];
	/** How confident you want to be in the results (0.90 = 90%, 0.95 = 95%, 0.99 = 99%) */
	confidenceLevel: number;
}

/**
 * Data formatted specifically for two-proportion statistical tests
 * This is the format most statistical libraries expect
 */
export interface TwoProportionTestData {
	/** Control group sample size (number of visitors) */
	n1: number;
	/** Control group successes (number of conversions) */
	x1: number;
	/** Variation group sample size (number of visitors) */
	n2: number;
	/** Variation group successes (number of conversions) */
	x2: number;
	/** Confidence level for the test */
	confidenceLevel: number;
}

/**
 * Data for multi-variation tests (3+ groups)
 */
export interface MultiVariationTestData {
	/** All variations including control */
	variations: TestVariation[];
	/** Confidence level for the overall test */
	confidenceLevel: number;
	/** Whether to apply Bonferroni correction for multiple comparisons */
	bonferroniCorrection: boolean;
}

/**
 * Configuration settings for the statistical test
 */
export interface TestConfiguration {
	/** Type of test to perform based on number of variations */
	testType: 'two-proportion' | 'multi-variation';
	/** Whether to apply correction for multiple testing */
	bonferroniCorrection: boolean;
	/** Confidence level for statistical significance */
	confidenceLevel: number;
}