import jStat from 'jstat';
import type { TwoProportionResult, ChiSquareResult } from '../../types/statistical-results';
import type { TestVariation, TwoProportionTestData } from '../../types/ab-testing';
import { bonferroniCorrection } from './bonferroni';

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
			relative: p1 > 0 ? (difference / p1) * 100 : null, // relative improvement as % (null when control is 0)
			confidenceInterval: p1 > 0 ? {
				// Calculate confidence interval for relative improvement (user-friendly)
				// Uses delta method: CI for relative improvement = CI for absolute difference / control rate * 100
				lower: ((difference - marginOfError) / p1) * 100,
				upper: ((difference + marginOfError) / p1) * 100
			} : {
				// When control rate is 0, fall back to absolute difference CI (converted to percentages)
				lower: (difference - marginOfError) * 100,
				upper: (difference + marginOfError) * 100
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

/**
 * Performs comprehensive pairwise analysis for all variations
 * 
 * WHAT THIS DOES (for novices):
 * Instead of just comparing everything to a "control", this compares every variation
 * against every other variation to find meaningful patterns and performance tiers.
 * 
 * HOW IT WORKS (for experts):
 * - Performs all possible pairwise two-proportion tests (n choose 2 comparisons)
 * - Groups variations by statistical performance tiers
 * - Identifies clear winners, losers, and statistical ties
 * - Applies appropriate multiple comparison corrections
 * - Returns business-friendly insights rather than raw statistical output
 * 
 * @param variations - Array of all test variations (3+ required)
 * @param confidenceLevel - Confidence level for statistical tests
 * @returns Comprehensive analysis with performance groupings and actionable insights
 */
export function comprehensivePairwiseAnalysis(
	variations: TestVariation[], 
	confidenceLevel: number
) {
	// Calculate conversion rates for all variations
	const variationsWithRates = calculateConversionRates(variations);
	
	// Perform all possible pairwise comparisons
	const allComparisons: TwoProportionResult[] = [];
	for (let i = 0; i < variations.length; i++) {
		for (let j = i + 1; j < variations.length; j++) {
			const data = formatTwoProportionData(variations[i], variations[j], confidenceLevel);
			const result = twoProportionTest(data, variations[i].name, variations[j].name);
			allComparisons.push(result);
		}
	}
	
	// Apply Bonferroni correction to all comparisons
	const bonferroniResults = bonferroniCorrection(
		allComparisons.map(r => r.pValue),
		1 - confidenceLevel
	);
	
	// Update comparisons with corrected significance
	const correctedComparisons = allComparisons.map((result, index) => ({
		...result,
		isSignificant: bonferroniResults[index].isSignificant,
		pValue: bonferroniResults[index].correctedPValue,
		originalPValue: bonferroniResults[index].originalPValue
	}));
	
	// Calculate evidence strength for confidence-based labeling
	const significantCount = correctedComparisons.filter(c => c.isSignificant).length;
	const evidenceStrength = significantCount / correctedComparisons.length;
	
	// Group variations by performance tiers with evidence strength
	const performanceGroups = groupVariationsByPerformance(
		variationsWithRates as (TestVariation & { conversionRate: number })[], 
		correctedComparisons,
		evidenceStrength
	);
	
	// Generate business insights
	const insights = generateBusinessInsights(performanceGroups, correctedComparisons);
	
	return {
		allComparisons: correctedComparisons,
		performanceGroups,
		insights,
		bonferroniCorrected: true,
		correctedAlpha: bonferroniResults[0].correctedAlpha
	};
}

/**
 * Groups variations into performance tiers based on statistical comparisons
 * 
 * @param variations - Variations with conversion rates
 * @param comparisons - Statistical comparison results
 * @param evidenceStrength - Proportion of significant comparisons (0-1)
 * @returns Performance groups (high, medium, low performers) or single group if no significant differences
 */
function groupVariationsByPerformance(
	variations: (TestVariation & { conversionRate: number })[], 
	comparisons: TwoProportionResult[],
	evidenceStrength: number
) {
	// Check if there are ANY significant differences
	const hasSignificantDifferences = comparisons.some(c => c.isSignificant);
	
// Sort variations by conversion rate (highest first)
	const sortedVariations = [...variations].sort((a, b) => b.conversionRate - a.conversionRate);
	
	// If no significant differences exist, return all variations as statistically tied
	if (!hasSignificantDifferences) {
		return [{
			tier: 1,
			label: "Similar Performance",
			variations: sortedVariations
		}];
	}
	
	// Determine confidence level for labeling
	const isStrongEvidence = evidenceStrength >= 0.5;
	const confidencePrefix = isStrongEvidence ? "" : "Tentative ";
	
	// Create initial empty performance tiers
	const performanceTiers: Array<{
		tier: number;
		label: string;
		variations: (TestVariation & { conversionRate: number })[];
	}> = [];
	
	// Group all variations based on statistical differences
	for (let i = 0; i < sortedVariations.length; i++) {
		const currentVariation = sortedVariations[i];
		let placedInTier = false;
		
		// Check if this variation is statistically similar to ALL variations in any existing tier
		for (const tier of performanceTiers) {
			const isStatisticallySimilar = tier.variations.every(tierVariation => {
				const comparison = comparisons.find(c => 
					(c.control.name === currentVariation.name && c.variation.name === tierVariation.name) ||
					(c.control.name === tierVariation.name && c.variation.name === currentVariation.name)
				);
				return comparison && !comparison.isSignificant;
			});
			
			if (isStatisticallySimilar) {
				tier.variations.push(currentVariation);
				placedInTier = true;
				break;
			}
		}
		
		// If not similar to any tier, create new tier
		if (!placedInTier) {
			const tierNumber = performanceTiers.length + 1;
			const tierLabel = tierNumber === 1 ? `${confidencePrefix}Highest Performers` : 
							 tierNumber === 2 ? `${confidencePrefix}Middle Performers` : 
							 tierNumber === 3 ? `${confidencePrefix}Lower Performers` : 
							 `${confidencePrefix}Tier ${tierNumber} Performers`;
			
			performanceTiers.push({
				tier: tierNumber,
				label: tierLabel,
				variations: [currentVariation]
			});
		}
	}
	
	return performanceTiers;
}

/**
 * Calculates tier-crossing evidence strength for decision-making confidence
 * 
 * @param performanceGroups - Grouped performance tiers
 * @param comparisons - Statistical comparison results
 * @returns Evidence strength based on meaningful tier-crossing comparisons
 */
function calculateTierCrossingEvidence(
	performanceGroups: Array<{
		tier: number;
		label: string;
		variations: (TestVariation & { conversionRate: number })[];
	}>,
	comparisons: TwoProportionResult[]
): number {
	if (performanceGroups.length <= 1) {
		// If all variants in one tier, use overall evidence
		const significantComparisons = comparisons.filter(c => c.isSignificant);
		return significantComparisons.length / comparisons.length;
	}
	
	// Get top tier and all lower tier variants
	const topTier = performanceGroups[0];
	const lowerTierVariants = performanceGroups.slice(1).flatMap(tier => tier.variations);
	
	if (lowerTierVariants.length === 0) {
		// Only one tier, fall back to overall evidence
		const significantComparisons = comparisons.filter(c => c.isSignificant);
		return significantComparisons.length / comparisons.length;
	}
	
	// Count significant comparisons between top tier and lower tiers
	let significantCrossings = 0;
	let totalCrossings = 0;
	
	for (const topVariant of topTier.variations) {
		for (const lowerVariant of lowerTierVariants) {
			const comparison = comparisons.find(c => 
				(c.control.name === topVariant.name && c.variation.name === lowerVariant.name) ||
				(c.control.name === lowerVariant.name && c.variation.name === topVariant.name)
			);
			
			if (comparison) {
				totalCrossings++;
				if (comparison.isSignificant) {
					significantCrossings++;
				}
			}
		}
	}
	
	return totalCrossings > 0 ? significantCrossings / totalCrossings : 0;
}

/**
 * Generates business-friendly insights from performance analysis
 * 
 * @param performanceGroups - Grouped performance tiers
 * @param comparisons - Statistical comparison results
 * @returns Array of actionable business insights
 */
function generateBusinessInsights(
	performanceGroups: Array<{
		tier: number;
		label: string;
		variations: (TestVariation & { conversionRate: number })[];
	}>,
	comparisons: TwoProportionResult[]
) {
	const insights: Array<{
		type: 'success' | 'warning' | 'info';
		title: string;
		message: string;
		actionable?: string;
	}> = [];
	
	// Calculate tier-crossing evidence strength for meaningful confidence assessment
	const evidenceStrength = calculateTierCrossingEvidence(performanceGroups, comparisons);
	
	// Determine confidence level for messaging
	const isStrongEvidence = evidenceStrength >= 0.5;  // 50%+ significant tier-crossing comparisons
	const hasAnyEvidence = evidenceStrength > 0;         // >0% significant tier-crossing comparisons
	
	// Performance tier analysis with confidence-based messaging
	if (performanceGroups.length > 1) {
		const topTier = performanceGroups[0];
		const bottomTier = performanceGroups[performanceGroups.length - 1];
		
		if (topTier.variations.length === 1 && bottomTier.variations.length === 1) {
			const topVariation = topTier.variations[0];
			const bottomVariation = bottomTier.variations[0];
			const improvement = ((topVariation.conversionRate - bottomVariation.conversionRate) / bottomVariation.conversionRate * 100);
			
			if (isStrongEvidence) {
				insights.push({
					type: 'success',
					title: 'Clear Performance Leader',
					message: `Variant ${topVariation.name} (${(topVariation.conversionRate * 100).toFixed(2)}%) significantly outperforms Variant ${bottomVariation.name} (${(bottomVariation.conversionRate * 100).toFixed(2)}%) by ${improvement.toFixed(1)}%.`,
					actionable: `Implement Variant ${topVariation.name} for maximum impact.`
				});
			} else {
				insights.push({
					type: 'info',
					title: 'Tentative Performance Leader',
					message: `Variant ${topVariation.name} (${(topVariation.conversionRate * 100).toFixed(2)}%) appears to outperform Variant ${bottomVariation.name} (${(bottomVariation.conversionRate * 100).toFixed(2)}%) by ${improvement.toFixed(1)}%, but evidence is limited.`,
					actionable: `Consider collecting more data or head-to-head testing before making final decisions.`
				});
			}
		} else if (topTier.variations.length > 1) {
			const topNames = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
				.format(topTier.variations.map(v => `<em>${v.name}</em>`));
			const avgTopRate = topTier.variations.reduce((sum, v) => sum + v.conversionRate, 0) / topTier.variations.length;
			
			if (isStrongEvidence) {
				insights.push({
					type: 'success',
					title: 'Multiple High Performers',
					message: `Variants ${topNames} are clearly top performers (avg. ${(avgTopRate * 100).toFixed(2)}%).`,
					actionable: `Any of these variants can be confidently implemented, or test them head-to-head for a definitive winner.`
				});
			} else {
				insights.push({
					type: 'info',
					title: 'Tentative High Performers',
					message: `Variants ${topNames} appear to perform better than others (avg. ${(avgTopRate * 100).toFixed(2)}%), but we can't reliably distinguish between them.`,
					actionable: `Consider collecting more data or head-to-head testing to identify the true winner.`
				});
			}
		}
	}
	
	// Overall evidence assessment using tier-crossing logic
	const totalComparisons = comparisons.length;
	const allSignificantComparisons = comparisons.filter(c => c.isSignificant);
	
	if (!hasAnyEvidence) {
		insights.push({
			type: 'warning',
			title: 'No Significant Differences',
			message: `None of your variants show statistically significant differences from each other.`,
			actionable: `Consider collecting more data or testing more distinct variations.`
		});
	} else if (!isStrongEvidence) {
		// Calculate tier-crossing specifics for messaging
		const topTier = performanceGroups[0];
		const lowerTierVariants = performanceGroups.slice(1).flatMap(tier => tier.variations);
		const tierCrossingComparisons = topTier.variations.length * lowerTierVariants.length;
		const significantTierCrossings = Math.round(evidenceStrength * tierCrossingComparisons);
		
		if (performanceGroups.length > 1 && tierCrossingComparisons > 0) {
			insights.push({
				type: 'info',
				title: 'Limited Evidence',
				message: `Only ${significantTierCrossings} of ${tierCrossingComparisons} key comparisons (top performers vs others) show significant differences. Results should be interpreted cautiously.`,
				actionable: `Consider collecting more data to strengthen conclusions, or test fewer variants for clearer results.`
			});
		} else {
			insights.push({
				type: 'info',
				title: 'Limited Evidence',
				message: `Only ${allSignificantComparisons.length} of ${totalComparisons} comparisons show significant differences. Results should be interpreted cautiously.`,
				actionable: `Consider collecting more data to strengthen conclusions, or test fewer variants for clearer results.`
			});
		}
	} else {
		// Calculate tier-crossing specifics for messaging
		const topTier = performanceGroups[0];
		const lowerTierVariants = performanceGroups.slice(1).flatMap(tier => tier.variations);
		const tierCrossingComparisons = topTier.variations.length * lowerTierVariants.length;
		const significantTierCrossings = Math.round(evidenceStrength * tierCrossingComparisons);
		
		if (performanceGroups.length > 1 && tierCrossingComparisons > 0) {
			insights.push({
				type: 'success',
				title: 'Strong Evidence',
				message: `${significantTierCrossings} of ${tierCrossingComparisons} key comparisons (top performers vs others) show significant differences, providing confident results.`,
				actionable: `Results are reliable enough to make implementation decisions.`
			});
		} else {
			insights.push({
				type: 'success',
				title: 'Strong Evidence',
				message: `${allSignificantComparisons.length} of ${totalComparisons} comparisons show significant differences, providing confident results.`,
				actionable: `Results are reliable enough to make implementation decisions.`
			});
		}
	}
	
	return insights;
}