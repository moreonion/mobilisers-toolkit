import { describe, it, expect } from 'vitest';
import {
	testVariationSchema,
	abTestInputSchema,
	twoProportionTestDataSchema,
	multiVariationTestDataSchema,
	validateABTestInput,
	validateTwoProportionTestData,
	validateMultiVariationTestData,
	validateStatisticalRequirements,
	formatValidationErrors
} from '../validation';
import type { ABTestInput } from '../../../types/ab-testing';

describe('testVariationSchema', () => {
	it('validates correct test variation data', () => {
		const validVariation = {
			name: "Control",
			visitors: 1000,
			conversions: 50
		};
		
		const result = testVariationSchema.safeParse(validVariation);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validVariation);
		}
	});

	it('rejects empty variation name', () => {
		const invalidVariation = {
			name: "",
			visitors: 1000,
			conversions: 50
		};
		
		const result = testVariationSchema.safeParse(invalidVariation);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("Please give this variation a name");
		}
	});

	it('rejects conversions exceeding visitors', () => {
		const invalidVariation = {
			name: "Test",
			visitors: 100,
			conversions: 150
		};
		
		const result = testVariationSchema.safeParse(invalidVariation);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("You can't have more conversions than visitors");
		}
	});

	it('rejects negative visitors', () => {
		const invalidVariation = {
			name: "Test",
			visitors: -10,
			conversions: 5
		};
		
		const result = testVariationSchema.safeParse(invalidVariation);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("You need at least 1 visitor");
		}
	});

	it('rejects negative conversions', () => {
		const invalidVariation = {
			name: "Test",
			visitors: 100,
			conversions: -5
		};
		
		const result = testVariationSchema.safeParse(invalidVariation);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("Conversions can't be negative");
		}
	});

	it('accepts zero conversions', () => {
		const validVariation = {
			name: "Low Performing Test",
			visitors: 1000,
			conversions: 0
		};
		
		const result = testVariationSchema.safeParse(validVariation);
		expect(result.success).toBe(true);
	});

	it('rejects decimal numbers for visitors and conversions', () => {
		const invalidVariation = {
			name: "Test",
			visitors: 100.5,
			conversions: 10.2
		};
		
		const result = testVariationSchema.safeParse(invalidVariation);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors.some(e => e.message.includes("whole number"))).toBe(true);
		}
	});
});

describe('abTestInputSchema', () => {
	const validABTest: ABTestInput = {
		controlVariation: {
			name: "Control",
			visitors: 1000,
			conversions: 50
		},
		variations: [
			{
				name: "Test A",
				visitors: 1000,
				conversions: 65
			}
		],
		confidenceLevel: 0.95
	};

	it('validates correct A/B test input', () => {
		const result = abTestInputSchema.safeParse(validABTest);
		expect(result.success).toBe(true);
	});

	it('rejects invalid confidence levels', () => {
		const invalidTest = {
			...validABTest,
			confidenceLevel: 0.75 // Too low
		};
		
		const result = abTestInputSchema.safeParse(invalidTest);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("We recommend at least 80% confidence");
		}
	});

	it('rejects non-standard confidence levels', () => {
		const invalidTest = {
			...validABTest,
			confidenceLevel: 0.92 // Not in allowed list
		};
		
		const result = abTestInputSchema.safeParse(invalidTest);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("Please choose a standard confidence level");
		}
	});

	it('rejects tests with no variations', () => {
		const invalidTest = {
			...validABTest,
			variations: []
		};
		
		const result = abTestInputSchema.safeParse(invalidTest);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("You need at least one test variation");
		}
	});

	it('rejects tests with too many variations', () => {
		const tooManyVariations = Array.from({ length: 11 }, (_, i) => ({
			name: `Test ${i + 1}`,
			visitors: 1000,
			conversions: 50
		}));
		
		const invalidTest = {
			...validABTest,
			variations: tooManyVariations
		};
		
		const result = abTestInputSchema.safeParse(invalidTest);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("Testing more than 10 variations");
		}
	});
});

describe('twoProportionTestDataSchema', () => {
	it('validates correct two-proportion test data', () => {
		const validData = {
			n1: 1000,
			x1: 50,
			n2: 1000,
			x2: 65,
			confidenceLevel: 0.95
		};
		
		const result = twoProportionTestDataSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('rejects when control conversions exceed control visitors', () => {
		const invalidData = {
			n1: 100,
			x1: 150, // More than n1
			n2: 1000,
			x2: 65,
			confidenceLevel: 0.95
		};
		
		const result = twoProportionTestDataSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("Control conversions can't exceed control visitors");
		}
	});

	it('rejects when test conversions exceed test visitors', () => {
		const invalidData = {
			n1: 1000,
			x1: 50,
			n2: 100,
			x2: 150, // More than n2
			confidenceLevel: 0.95
		};
		
		const result = twoProportionTestDataSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain("Test conversions can't exceed test visitors");
		}
	});
});

describe('validateABTestInput helper function', () => {
	it('returns success for valid input', () => {
		const validInput = {
			controlVariation: {
				name: "Control",
				visitors: 1000,
				conversions: 50
			},
			variations: [
				{
					name: "Test A",
					visitors: 1000,
					conversions: 65
				}
			],
			confidenceLevel: 0.95
		};
		
		const result = validateABTestInput(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validInput);
		}
	});

	it('returns formatted errors for invalid input', () => {
		const invalidInput = {
			controlVariation: {
				name: "",
				visitors: -10,
				conversions: 50
			},
			variations: [],
			confidenceLevel: 0.75
		};
		
		const result = validateABTestInput(invalidInput);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors.some(error => error.includes("Please give this variation a name"))).toBe(true);
		}
	});
});

describe('validateStatisticalRequirements', () => {
	const baseTestData: ABTestInput = {
		controlVariation: {
			name: "Control",
			visitors: 1000,
			conversions: 50
		},
		variations: [
			{
				name: "Test A",
				visitors: 1000,
				conversions: 65
			}
		],
		confidenceLevel: 0.95
	};

	it('returns no warnings for good quality data', () => {
		const warnings = validateStatisticalRequirements(baseTestData);
		expect(warnings).toEqual([]);
	});

	it('warns about small sample sizes', () => {
		const smallSampleTest = {
			...baseTestData,
			controlVariation: {
				...baseTestData.controlVariation,
				visitors: 50,
				conversions: 2
			}
		};
		
		const warnings = validateStatisticalRequirements(smallSampleTest);
		expect(warnings.some(w => w.includes("only 50 visitors"))).toBe(true);
		expect(warnings.some(w => w.includes("at least 100 visitors"))).toBe(true);
	});

	it('warns about low conversion counts', () => {
		const lowConversionTest = {
			...baseTestData,
			controlVariation: {
				...baseTestData.controlVariation,
				conversions: 2
			}
		};
		
		const warnings = validateStatisticalRequirements(lowConversionTest);
		expect(warnings.some(w => w.includes("only 2 conversions"))).toBe(true);
		expect(warnings.some(w => w.includes("fewer than 5 conversions"))).toBe(true);
	});

	it('warns about very low conversion rates', () => {
		const lowRateTest = {
			...baseTestData,
			controlVariation: {
				...baseTestData.controlVariation,
				visitors: 10000,
				conversions: 2 // 0.02% conversion rate
			}
		};
		
		const warnings = validateStatisticalRequirements(lowRateTest);
		expect(warnings.some(w => w.includes("Very low rates"))).toBe(true);
		expect(warnings.some(w => w.includes("0.02%"))).toBe(true);
	});

	it('warns about zero conversions', () => {
		const zeroConversionTest = {
			...baseTestData,
			controlVariation: {
				...baseTestData.controlVariation,
				conversions: 0
			}
		};
		
		const warnings = validateStatisticalRequirements(zeroConversionTest);
		expect(warnings.some(w => w.includes("zero conversions"))).toBe(true);
		expect(warnings.some(w => w.includes("at least one conversion"))).toBe(true);
	});

	it('warns about identical conversion rates', () => {
		const identicalRatesTest = {
			...baseTestData,
			variations: [
				{
					name: "Test A",
					visitors: 1000,
					conversions: 50 // Same rate as control (50/1000 = 0.05)
				}
			]
		};
		
		const warnings = validateStatisticalRequirements(identicalRatesTest);
		expect(warnings.some(w => w.includes("identical conversion rates"))).toBe(true);
	});

	it('warns about unbalanced sample sizes', () => {
		const unbalancedTest = {
			...baseTestData,
			variations: [
				{
					name: "Test A",
					visitors: 100, // Much smaller than control (1000)
					conversions: 10
				}
			]
		};
		
		const warnings = validateStatisticalRequirements(unbalancedTest);
		expect(warnings.some(w => w.includes("quite unbalanced"))).toBe(true);
	});
});

describe('formatValidationErrors', () => {
	it('formats field names for control variation', () => {
		const invalidInput = {
			controlVariation: {
				name: "",
				visitors: 1000,
				conversions: 50
			},
			variations: [{
				name: "Test",
				visitors: 1000,
				conversions: 50
			}],
			confidenceLevel: 0.95
		};
		
		const result = abTestInputSchema.safeParse(invalidInput);
		expect(result.success).toBe(false);
		if (!result.success) {
			const formattedErrors = formatValidationErrors(result.error);
			expect(formattedErrors.some(e => e.includes("Control name"))).toBe(true);
		}
	});

	it('formats field names for test variations', () => {
		const invalidInput = {
			controlVariation: {
				name: "Control",
				visitors: 1000,
				conversions: 50
			},
			variations: [{
				name: "",
				visitors: 1000,
				conversions: 50
			}],
			confidenceLevel: 0.95
		};
		
		const result = abTestInputSchema.safeParse(invalidInput);
		expect(result.success).toBe(false);
		if (!result.success) {
			const formattedErrors = formatValidationErrors(result.error);
			expect(formattedErrors.some(e => e.includes("Variation 1 name"))).toBe(true);
		}
	});
});