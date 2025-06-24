import jStat from 'jstat';
import type { TwoProportionTestData, TwoProportionResult, ChiSquareResult } from '../../types/statistical-results';
import type { TestVariation } from '../../types/ab-testing';

/**
 * Performs a two-proportion z-test to compare conversion rates between control and variation
 * 
 * WHAT THIS DOES (for novices):
 * Takes your A/B test data and tells you if the difference you see is real or just random luck.
 * Example: Control 5%, Variation 7% - is that 2% difference meaningful or coincidence?
 * 
 * HOW IT WORKS (for experts):
 * - Uses jStat.fn.twoSidedDifferenceOfProportions() for p-value (built-in pooled approach)
 * - Pooled SE for hypothesis testing (assumes H₀: p₁ = p₂)
 * - Unpooled SE for confidence intervals (estimates true difference without H₀ assumption)
 * - Two-tailed test: checks if variation is significantly different (better OR worse)
 * - Handles edge cases: zero conversions with continuity correction
 * 
 * @param data - Test data with sample sizes and conversion counts
 * @param controlName - Optional name for control group (default: 'Control')
 * @param variationName - Optional name for variation group (default: 'Variation')
 * @returns Statistical test results with significance and improvement metrics
 */
export function twoProportionTest(
	data: TwoProportionTestData, 
	controlName: string = 'Control', 
	variationName: string = 'Variation'
): TwoProportionResult {
	const { n1, x1, n2, x2, confidenceLevel } = data;
	
	// Calculate conversion rates (what percentage of people converted)
	let p1 = x1 / n1; // control conversion rate: conversions ÷ visitors
	let p2 = x2 / n2; // variation conversion rate: conversions ÷ visitors
	const difference = p2 - p1; // how much better (or worse) is the variation?
	
	// Handle edge case: jStat doesn't handle zero proportions gracefully
	// Apply continuity correction for edge cases (add small epsilon to avoid division by zero)
	const epsilon = 0.000001;
	const p1_adjusted = p1 === 0 ? epsilon : (p1 === 1 ? 1 - epsilon : p1);
	const p2_adjusted = p2 === 0 ? epsilon : (p2 === 1 ? 1 - epsilon : p2);
	
	// Get p-value using jStat's built-in function (this does the hard math for us)
	// p-value = probability this difference happened by random chance
	// Lower p-value = more confident the difference is real
	const pValue = jStat.fn.twoSidedDifferenceOfProportions(p1_adjusted, n1, p2_adjusted, n2);
	
	// Calculate z-statistic (how many "standard deviations" apart the groups are)
	// Uses pooled approach: assumes control and variation have same true rate for testing
	const pooledP = (x1 + x2) / (n1 + n2); // combined conversion rate across both groups
	const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2)); // standard error under null hypothesis
	const zScore = difference / pooledSE; // standardised difference
	
	// Is the result "statistically significant"?
	// If p-value < alpha (significance threshold), then YES the difference is likely real
	const alpha = 1 - confidenceLevel; // e.g., 95% confidence = 5% alpha = 0.05
	const isSignificant = pValue < alpha;
	
	// Calculate confidence interval: "We're 95% confident the true improvement is between X% and Y%"
	// Uses unpooled approach: doesn't assume the groups are the same (better for estimating)
	const criticalValue = jStat.normal.inv(1 - alpha/2, 0, 1); // z-score for desired confidence level
	const unpooledSE = Math.sqrt((p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2)); // separate variance estimates
	const marginOfError = criticalValue * unpooledSE;
	
	const result: TwoProportionResult = {
		isSignificant,
		pValue,
		confidenceLevel,
		testStatistic: zScore,
		control: {
			name: controlName,
			conversionRate: p1,
			visitors: n1,
			conversions: x1
		},
		variation: {
			name: variationName,
			conversionRate: p2,
			visitors: n2,
			conversions: x2
		},
		improvement: {
			absolute: difference, // raw percentage point difference (e.g., 0.02 for 2 percentage points)
			relative: p1 > 0 ? (difference / p1) * 100 : 0, // relative improvement as % (e.g., 40% improvement)
			confidenceInterval: {
				lower: difference - marginOfError,
				upper: difference + marginOfError
			}
		}
	};
	
	return result;
}

/**
 * Converts test variation data to the format needed for two-proportion tests
 * 
 * WHAT THIS DOES: Takes your A/B test data and formats it for the statistical functions
 * 
 * @param control - Control group data (your baseline/original version)
 * @param variation - Variation group data (your new version being tested)
 * @param confidenceLevel - How confident you want to be (0.95 = 95% confident)
 * @returns Formatted data ready for statistical testing
 */
export function formatTwoProportionData(
	control: TestVariation, 
	variation: TestVariation, 
	confidenceLevel: number
): TwoProportionTestData {
	return {
		n1: control.visitors,    // sample size for control
		x1: control.conversions, // successes for control
		n2: variation.visitors,    // sample size for variation
		x2: variation.conversions, // successes for variation
		confidenceLevel
	};
}

/**
 * Performs a chi-square test of independence for multi-variation A/B tests
 * 
 * WHAT THIS DOES (for novices):
 * When testing 3+ variations, this tells you "is there ANY significant difference between groups?"
 * Think of it as the first question: "Should I bother looking deeper, or are all groups basically the same?"
 * 
 * HOW IT WORKS (for experts):
 * - Builds 2×k contingency table: [conversions, non-conversions] × [k variations]
 * - H₀: conversion rates are equal across all groups (independence assumption)
 * - Expected frequencies based on marginal totals and overall conversion rate
 * - Test statistic: Σ[(Oᵢⱼ - Eᵢⱼ)² / Eᵢⱼ] ~ χ²(df = (k-1)×(2-1) = k-1)
 * - Uses jStat.chisquare.cdf() for accurate p-value from theoretical distribution
 * 
 * @param variations - Array of all test variations including control (must be 3+)
 * @param confidenceLevel - Desired confidence level (e.g., 0.95 for 95%)
 * @returns Chi-square test results with detailed breakdown
 */
export function chiSquareTest(variations: TestVariation[], confidenceLevel: number): ChiSquareResult {
	const totalVisitors = variations.reduce((sum, v) => sum + v.visitors, 0);
	const totalConversions = variations.reduce((sum, v) => sum + v.conversions, 0);
	const overallConversionRate = totalConversions / totalVisitors; // what we'd expect if all groups were the same
	
	// Build the contingency table
	// This is like a spreadsheet: rows = groups, columns = [converted, didn't convert]
	const observed: number[][] = []; // what we actually saw
	const expected: number[][] = [];  // what we'd expect if no real differences
	
	for (const variation of variations) {
		const expectedConversions = variation.visitors * overallConversionRate;
		const expectedNonConversions = variation.visitors * (1 - overallConversionRate);
		
		// Row format: [conversions, non-conversions]
		observed.push([variation.conversions, variation.visitors - variation.conversions]);
		expected.push([expectedConversions, expectedNonConversions]);
	}
	
	// Calculate the chi-square statistic
	// This measures "how far off" our actual results are from expected
	// Bigger number = more evidence that groups are actually different
	let chiSquareStatistic = 0;
	const residuals: number[][] = []; // standardised differences for each cell
	
	for (let i = 0; i < observed.length; i++) {
		const rowResiduals: number[] = [];
		for (let j = 0; j < observed[i].length; j++) {
			const expectedValue = expected[i][j];
			const observedValue = observed[i][j];
			
			// Standardised residual: (observed - expected) / √expected
			// Shows which cells contribute most to the overall chi-square
			const residual = (observedValue - expectedValue) / Math.sqrt(expectedValue);
			rowResiduals.push(residual);
			
			// Chi-square contribution: (observed - expected)² / expected
			// This is the classic chi-square formula
			chiSquareStatistic += Math.pow(observedValue - expectedValue, 2) / expectedValue;
		}
		residuals.push(rowResiduals);
	}
	
	// Degrees of freedom: how many "independent" pieces of information we have
	// Formula: (number of groups - 1) × (number of outcomes - 1)
	// We have k groups and 2 outcomes (convert/don't convert), so df = (k-1) × (2-1) = k-1
	const degreesOfFreedom = (variations.length - 1) * (2 - 1);
	
	// Convert chi-square statistic to p-value using the theoretical distribution
	// p-value = P(χ² ≥ our statistic | H₀ is true)
	const pValue = 1 - jStat.chisquare.cdf(chiSquareStatistic, degreesOfFreedom);
	
	// Is there significant evidence that groups differ?
	const alpha = 1 - confidenceLevel;
	const isSignificant = pValue < alpha;
	
	return {
		isSignificant,
		pValue,
		confidenceLevel,
		testStatistic: chiSquareStatistic,
		degreesOfFreedom,
		expectedFrequencies: expected,
		observedFrequencies: observed,
		residuals
	};
}

/**
 * Performs pairwise two-proportion tests between each variation and control
 * 
 * WHAT THIS DOES (for novices):
 * After the overall test says "yes, there are differences", this tells you WHICH specific
 * variations are significantly better/worse than your control.
 * 
 * EXPERT NOTE:
 * These individual tests should use Bonferroni-corrected significance levels to control
 * family-wise error rate when multiple comparisons are performed.
 * 
 * @param variations - Array starting with control, followed by test variations
 * @param confidenceLevel - Confidence level for individual comparisons
 * @returns Array of pairwise comparison results (each variation vs control)
 */
export function pairwiseComparisons(
	variations: TestVariation[], 
	confidenceLevel: number
): TwoProportionResult[] {
	const control = variations[0]; // first variation should be the control group
	const testVariations = variations.slice(1); // all the others are test variations
	
	return testVariations.map(variation => {
		const data = formatTwoProportionData(control, variation, confidenceLevel);
		return twoProportionTest(data, control.name, variation.name);
	});
}

/**
 * Calculates sample conversion rates for all variations
 * 
 * WHAT THIS DOES: Simple utility to calculate conversion percentage for each group
 * Conversion rate = (people who converted ÷ total people) × 100%
 * 
 * @param variations - Array of test variations
 * @returns Same array but with conversionRate field populated
 */
export function calculateConversionRates(variations: TestVariation[]): TestVariation[] {
	return variations.map(variation => ({
		...variation,
		conversionRate: variation.conversions / variation.visitors
	}));
}