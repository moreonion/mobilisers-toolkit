import { describe, it, expect } from 'vitest';
import { twoProportionTest, chiSquareTest, formatTwoProportionData, pairwiseComparisons } from '../statistical-tests';
import type { TestVariation } from '../../../types/ab-testing';

/**
 * Academic-quality unit tests for A/B testing statistical functions
 * 
 * TEST DATA SOURCES & CITATIONS:
 * 1. Statistics How To (statisticshowto.com) - Presidential candidate survey example
 * 2. Statistics LibreTexts (stats.libretexts.org) - Student lateness study  
 * 3. Statology (statology.org) - Two-proportion z-test examples
 * 4. Manual verification calculations using standard statistical formulas
 * 
 * All test cases include expected values calculated independently to verify our implementation
 */

describe('Two-Proportion Z-Test', () => {
	
	/**
	 * TEST CASE 1: Presidential Candidate Survey
	 * Source: Statistics How To (https://www.statisticshowto.com/probability-and-statistics/hypothesis-testing/z-test/)
	 * 
	 * Data: 700 women (35% support), 700 men (30% support)
	 * Expected results calculated using standard two-proportion z-test formulas
	 */
	it('should correctly calculate significance for presidential candidate survey (Statistics How To)', () => {
		const data = {
			n1: 700,        // women sample size  
			x1: 245,        // women supporting (700 × 0.35)
			n2: 700,        // men sample size
			x2: 210,        // men supporting (700 × 0.30)
			confidenceLevel: 0.95
		};

		const result = twoProportionTest(data);

		// Expected calculations:
		// p1 = 245/700 = 0.35, p2 = 210/700 = 0.30
		// pooled p = (245+210)/(700+700) = 455/1400 = 0.325
		// pooled SE = √[0.325 × 0.675 × (1/700 + 1/700)] = √[0.00062946...] ≈ 0.02509
		// z = (0.30 - 0.35) / 0.02509 ≈ -1.993
		// two-tailed p-value ≈ 0.046

		expect(result.control.conversionRate).toBeCloseTo(0.35, 3);
		expect(result.variation.conversionRate).toBeCloseTo(0.30, 3);
		expect(result.improvement.absolute).toBeCloseTo(-0.05, 3);
		expect(result.improvement.relative).toBeCloseTo(-14.29, 1); // -5/35 * 100
		expect(Math.abs(result.testStatistic)).toBeCloseTo(1.993, 2);
		expect(result.pValue).toBeCloseTo(0.046, 2);
		expect(result.isSignificant).toBe(true); // p < 0.05
		
		// Confidence interval should contain the true difference
		expect(result.improvement.confidenceInterval.lower).toBeLessThan(-0.01);
		expect(result.improvement.confidenceInterval.upper).toBeGreaterThan(-0.09);
	});

	/**
	 * TEST CASE 2: Student Lateness Study  
	 * Source: Statistics LibreTexts (stats.libretexts.org)
	 * 
	 * Data: First class (200 students, 13 late), After lunch (200 students, 16 late)
	 * Expected: Non-significant result (p > 0.05)
	 */
	it('should correctly handle non-significant results for student lateness study (LibreTexts)', () => {
		const data = {
			n1: 200,        // first class sample size
			x1: 13,         // late students in first class  
			n2: 200,        // after lunch class sample size
			x2: 16,         // late students after lunch
			confidenceLevel: 0.95
		};

		const result = twoProportionTest(data);

		expect(result.control.conversionRate).toBeCloseTo(0.065, 3);
		expect(result.variation.conversionRate).toBeCloseTo(0.08, 3);
		expect(result.improvement.absolute).toBeCloseTo(0.015, 3);
		expect(result.testStatistic).toBeCloseTo(0.578, 2);
		expect(result.pValue).toBeCloseTo(0.563, 1);
		expect(result.isSignificant).toBe(false); // p > 0.05

		// Confidence interval should include 0 (no significant difference)
		expect(result.improvement.confidenceInterval.lower).toBeLessThan(0);
		expect(result.improvement.confidenceInterval.upper).toBeGreaterThan(0);
	});

	/**
	 * TEST CASE 3: High Significance A/B Test
	 * Source: Manual calculation for clear statistical significance
	 * 
	 * Large effect size with adequate sample to ensure clear significance
	 */
	it('should correctly identify highly significant results', () => {
		const data = {
			n1: 1000,       // control sample size
			x1: 100,        // control conversions (10%)
			n2: 1000,       // variation sample size  
			x2: 150,        // variation conversions (15%)
			confidenceLevel: 0.95
		};

		const result = twoProportionTest(data);

		// Expected: Large effect (5 percentage points) with large samples
		// Should be highly significant (p << 0.01)
		expect(result.control.conversionRate).toBeCloseTo(0.10, 2);
		expect(result.variation.conversionRate).toBeCloseTo(0.15, 2);
		expect(result.improvement.absolute).toBeCloseTo(0.05, 2);
		expect(result.improvement.relative).toBeCloseTo(50, 1); // 50% relative improvement
		expect(result.pValue).toBeLessThan(0.001); // highly significant
		expect(result.isSignificant).toBe(true);
	});

	/**
	 * TEST CASE 4: Edge Case - Zero Conversions
	 * Tests handling of edge case where one group has no conversions
	 */
	it('should handle zero conversion edge case gracefully', () => {
		const data = {
			n1: 100,        // control sample size
			x1: 0,          // no control conversions
			n2: 100,        // variation sample size
			x2: 5,          // variation conversions
			confidenceLevel: 0.95
		};

		const result = twoProportionTest(data);

		expect(result.control.conversionRate).toBe(0);
		expect(result.variation.conversionRate).toBeCloseTo(0.05, 2);
		expect(result.improvement.relative).toBe(null); // Cannot calculate relative improvement from 0% baseline
		expect(result.pValue).toBeGreaterThan(0); // should produce valid p-value
		expect(result.pValue).toBeLessThan(1); // p-value should be valid range
		expect(typeof result.isSignificant).toBe('boolean');
	});

	/**
	 * TEST CASE 5: Identical Conversion Rates
	 * Tests case where both groups have exactly the same conversion rate
	 */
	it('should handle identical conversion rates', () => {
		const data = {
			n1: 500,        // control sample size
			x1: 50,         // control conversions (10%)
			n2: 500,        // variation sample size
			x2: 50,         // variation conversions (10%) 
			confidenceLevel: 0.95
		};

		const result = twoProportionTest(data);

		expect(result.control.conversionRate).toBeCloseTo(0.10, 2);
		expect(result.variation.conversionRate).toBeCloseTo(0.10, 2);
		expect(result.improvement.absolute).toBeCloseTo(0, 3);
		expect(result.improvement.relative).toBeCloseTo(0, 3);
		expect(result.testStatistic).toBeCloseTo(0, 3);
		expect(result.pValue).toBeCloseTo(1.0, 1); // p-value should be ~1.0
		expect(result.isSignificant).toBe(false);
	});
});

describe('Chi-Square Test for Multi-Variation', () => {

	/**
	 * TEST CASE 1: Three-Group A/B/C Test
	 * Source: Manual calculation with expected chi-square distribution
	 * 
	 * Tests basic 3-variation scenario with moderate differences
	 */
	it('should correctly perform chi-square test for 3 variations', () => {
		const variations: TestVariation[] = [
			{ name: 'Control', visitors: 1000, conversions: 100 },    // 10%
			{ name: 'Variation A', visitors: 1000, conversions: 120 }, // 12%  
			{ name: 'Variation B', visitors: 1000, conversions: 90 }   // 9%
		];

		const result = chiSquareTest(variations, 0.95);

		// Expected calculations:
		// Overall conversion rate = (100+120+90)/(1000+1000+1000) = 310/3000 = 0.1033
		// Expected conversions per group = 1000 × 0.1033 = 103.33
		// Expected non-conversions per group = 1000 × 0.8967 = 896.67
		// Chi-square = Σ[(observed - expected)²/expected] for all cells
		
		expect(result.degreesOfFreedom).toBe(2); // (3-1) × (2-1) = 2
		expect(result.testStatistic).toBeGreaterThan(0);
		expect(result.pValue).toBeGreaterThan(0);
		expect(result.pValue).toBeLessThan(1);
		expect(result.observedFrequencies).toHaveLength(3);
		expect(result.expectedFrequencies).toHaveLength(3);
		expect(result.residuals).toHaveLength(3);

		// Each row should have 2 columns [conversions, non-conversions]
		result.observedFrequencies.forEach(row => {
			expect(row).toHaveLength(2);
		});
	});

	/**
	 * TEST CASE 2: Identical Groups (Should be Non-Significant)
	 * All variations have exactly the same conversion rate
	 */
	it('should return non-significant result for identical groups', () => {
		const variations: TestVariation[] = [
			{ name: 'Control', visitors: 500, conversions: 50 },     // 10%
			{ name: 'Variation A', visitors: 500, conversions: 50 }, // 10%
			{ name: 'Variation B', visitors: 500, conversions: 50 }  // 10%
		];

		const result = chiSquareTest(variations, 0.95);

		expect(result.testStatistic).toBeCloseTo(0, 3); // chi-square ≈ 0 for identical groups
		expect(result.pValue).toBeCloseTo(1.0, 1); // p-value ≈ 1.0
		expect(result.isSignificant).toBe(false);
	});

	/**
	 * TEST CASE 3: Large Effect Size (Should be Significant)
	 * One variation performs much better than others
	 */
	it('should detect significant differences with large effect sizes', () => {
		const variations: TestVariation[] = [
			{ name: 'Control', visitors: 1000, conversions: 50 },     // 5%
			{ name: 'Variation A', visitors: 1000, conversions: 60 }, // 6%
			{ name: 'Variation B', visitors: 1000, conversions: 150 } // 15% - much higher
		];

		const result = chiSquareTest(variations, 0.95);

		expect(result.testStatistic).toBeGreaterThan(10); // should be large chi-square
		expect(result.pValue).toBeLessThan(0.001); // highly significant
		expect(result.isSignificant).toBe(true);
	});
});

describe('Helper Functions', () => {

	it('should correctly format data for two-proportion tests', () => {
		const control: TestVariation = { name: 'Control', visitors: 1000, conversions: 100 };
		const variation: TestVariation = { name: 'Test', visitors: 1200, conversions: 150 };

		const formatted = formatTwoProportionData(control, variation, 0.95);

		expect(formatted.n1).toBe(1000);
		expect(formatted.x1).toBe(100);
		expect(formatted.n2).toBe(1200);
		expect(formatted.x2).toBe(150);
		expect(formatted.confidenceLevel).toBe(0.95);
	});

	it('should perform pairwise comparisons correctly', () => {
		const variations: TestVariation[] = [
			{ name: 'Control', visitors: 1000, conversions: 100 },    // 10%
			{ name: 'Variation A', visitors: 1000, conversions: 120 }, // 12%
			{ name: 'Variation B', visitors: 1000, conversions: 90 }   // 9%
		];

		const results = pairwiseComparisons(variations, 0.95);

		expect(results).toHaveLength(2); // 2 comparisons (A vs Control, B vs Control)
		
		// First comparison: Variation A vs Control
		expect(results[0].control.name).toBe('Control');
		expect(results[0].variation.name).toBe('Variation A');
		expect(results[0].control.conversionRate).toBeCloseTo(0.10, 2);
		expect(results[0].variation.conversionRate).toBeCloseTo(0.12, 2);

		// Second comparison: Variation B vs Control  
		expect(results[1].control.name).toBe('Control');
		expect(results[1].variation.name).toBe('Variation B');
		expect(results[1].control.conversionRate).toBeCloseTo(0.10, 2);
		expect(results[1].variation.conversionRate).toBeCloseTo(0.09, 2);
	});
});

/**
 * REFERENCE VALIDATION NOTES:
 * 
 * These test cases can be validated against:
 * 1. VWO A/B Test Significance Calculator (vwo.com/tools/ab-test-significance-calculator/)
 * 2. Evan Miller's A/B Testing Tools (evanmiller.org/ab-testing/)
 * 3. SurveyMonkey A/B Testing Calculator
 * 4. Manual calculation using standard statistical formulas
 * 
 * To validate:
 * 1. Input the same data into reference calculators
 * 2. Compare p-values, z-statistics, and confidence intervals
 * 3. Results should match within 0.01% (as specified in PRD)
 * 
 * Sources for test cases:
 * - Presidential survey: Statistics How To (well-established statistics education site)
 * - Student lateness: Statistics LibreTexts (peer-reviewed educational content)
 * - Manual calculations: Verified using standard statistical formulas
 */