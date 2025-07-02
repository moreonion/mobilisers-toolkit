import { z } from "zod";
import type {
	ABTestInput,
	TwoProportionTestData,
	MultiVariationTestData
} from "../../types/ab-testing";

/**
 * Zod schema for validating a single test variation
 * Provides clear, actionable error messages for both novices and experts
 */
export const testVariationSchema = z
	.object({
		name: z
			.string()
			.min(1, "Please give this variation a name (e.g., 'Control', 'Red Button', 'Version A')")
			.max(50, "Please use a shorter name (50 characters or less)"),

		visitors: z
			.number()
			.int("Please enter a whole number for visitors (no decimals)")
			.min(1, "You need at least 1 visitor to run a test")
			.max(1000000000, "Please enter a smaller number (less than 1 billion visitors)"),

		conversions: z
			.number()
			.int("Please enter a whole number for conversions (no decimals)")
			.min(0, "Conversions can't be negative - enter 0 if no one converted"),

		conversionRate: z.number().optional()
	})
	.refine((data) => data.conversions <= data.visitors, {
		message: "You can't have more conversions than visitors - please check your numbers",
		path: ["conversions"]
	});

/**
 * Zod schema for validating complete A/B test input
 */
export const abTestInputSchema = z.object({
	controlVariation: testVariationSchema,

	variations: z
		.array(testVariationSchema)
		.min(1, "You need at least one test variation to compare against your control")
		.max(10, "Testing more than 10 variations at once makes results hard to interpret"),

	confidenceLevel: z
		.number()
		.min(0.8, "We recommend at least 80% confidence - anything lower isn't reliable")
		.max(0.99, "99% is the highest confidence level we support")
		.refine((level) => [0.8, 0.85, 0.9, 0.95, 0.99].includes(level), {
			message: "Please choose a standard confidence level: 80%, 85%, 90%, 95%, or 99%"
		})
});

/**
 * Zod schema for two-proportion test data validation
 */
export const twoProportionTestDataSchema = z
	.object({
		n1: z
			.number()
			.int("Control group size must be a whole number")
			.min(1, "Control group needs at least 1 visitor"),

		x1: z
			.number()
			.int("Control conversions must be a whole number")
			.min(0, "Control conversions can't be negative"),

		n2: z
			.number()
			.int("Test group size must be a whole number")
			.min(1, "Test group needs at least 1 visitor"),

		x2: z
			.number()
			.int("Test conversions must be a whole number")
			.min(0, "Test conversions can't be negative"),

		confidenceLevel: z
			.number()
			.min(0.8, "Please use at least 80% confidence")
			.max(0.99, "Maximum confidence level is 99%")
	})
	.refine((data) => data.x1 <= data.n1, {
		message: "Control conversions can't exceed control visitors - please double-check",
		path: ["x1"]
	})
	.refine((data) => data.x2 <= data.n2, {
		message: "Test conversions can't exceed test visitors - please double-check",
		path: ["x2"]
	});

/**
 * Zod schema for multi-variation test data validation
 */
export const multiVariationTestDataSchema = z.object({
	variations: z
		.array(testVariationSchema)
		.min(3, "Multi-variation tests need at least 3 groups (including control)")
		.max(10, "Testing more than 10 variations makes results unreliable"),

	confidenceLevel: z
		.number()
		.min(0.8, "Please use at least 80% confidence")
		.max(0.99, "Maximum confidence level is 99%"),

	bonferroniCorrection: z.boolean()
});

/**
 * Transform Zod validation errors into helpful messages
 * Focuses on what users should do, not just what went wrong
 */
export function formatValidationErrors(error: z.ZodError): string[] {
	return error.errors.map((err) => {
		// Make field names more user-friendly
		const fieldPath = err.path.join(".");
		let friendlyField = fieldPath;

		if (fieldPath.includes("controlVariation")) {
			friendlyField = fieldPath.replace("controlVariation.", "Control ");
		} else if (fieldPath.includes("variations")) {
			const match = fieldPath.match(/variations\.(\d+)\.(.+)/);
			if (match) {
				const variationNum = parseInt(match[1]) + 1;
				friendlyField = `Variation ${variationNum} ${match[2]}`;
			}
		}

		return `${friendlyField}: ${err.message}`;
	});
}

/**
 * Safe validation with helpful error messages
 */
export function validateABTestInput(
	input: unknown
): { success: true; data: ABTestInput } | { success: false; errors: string[] } {
	const result = abTestInputSchema.safeParse(input);

	if (result.success) {
		return { success: true, data: result.data };
	} else {
		return { success: false, errors: formatValidationErrors(result.error) };
	}
}

export function validateTwoProportionTestData(
	input: unknown
): { success: true; data: TwoProportionTestData } | { success: false; errors: string[] } {
	const result = twoProportionTestDataSchema.safeParse(input);

	if (result.success) {
		return { success: true, data: result.data };
	} else {
		return { success: false, errors: formatValidationErrors(result.error) };
	}
}

export function validateMultiVariationTestData(
	input: unknown
): { success: true; data: MultiVariationTestData } | { success: false; errors: string[] } {
	const result = multiVariationTestDataSchema.safeParse(input);

	if (result.success) {
		return { success: true, data: result.data };
	} else {
		return { success: false, errors: formatValidationErrors(result.error) };
	}
}

/**
 * Check for statistical issues and provide helpful guidance
 * Explains why certain conditions matter and what users can do about them
 */
export function validateStatisticalRequirements(data: ABTestInput): string[] {
	const warnings: string[] = [];
	const allVariations = [data.controlVariation, ...data.variations];

	allVariations.forEach((variation, index) => {
		const label = index === 0 ? "Control" : `Variation ${index}`;

		// Small sample size warning with explanation
		if (variation.visitors < 100) {
			warnings.push(
				`${label} has only ${variation.visitors} visitors. For reliable results, try to get at least 100 visitors per variation before drawing conclusions.`
			);
		}

		// Low conversion warning with context
		if (variation.conversions < 5) {
			warnings.push(
				`${label} has only ${variation.conversions} conversions. With fewer than 5 conversions, the results might change significantly with just a few more data points.`
			);
		}

		// Very low conversion rate with actionable advice
		const conversionRate = variation.conversions / variation.visitors;
		if (conversionRate < 0.005) {
			warnings.push(
				`${label} has a ${(conversionRate * 100).toFixed(2)}% conversion rate. Very low rates need much larger sample sizes - consider running your test longer or checking if your tracking is working correctly.`
			);
		}

		// Zero conversions handling
		if (variation.conversions === 0) {
			warnings.push(
				`${label} has zero conversions. The statistical test can still run, but you'll need at least one conversion to calculate meaningful improvement percentages.`
			);
		}
	});

	// Identical rates warning with explanation
	const controlRate = data.controlVariation.conversions / data.controlVariation.visitors;
	const identicalRates = data.variations.filter(
		(v) => Math.abs(v.conversions / v.visitors - controlRate) < 0.0001
	);

	if (identicalRates.length > 0) {
		warnings.push(
			"Some variations have identical conversion rates. This is fine early in a test, but if rates stay identical with large sample sizes, there may be no real difference to detect."
		);
	}

	// Unbalanced sample sizes warning
	const minVisitors = Math.min(...allVariations.map((v) => v.visitors));
	const maxVisitors = Math.max(...allVariations.map((v) => v.visitors));

	if (maxVisitors > minVisitors * 3) {
		warnings.push(
			"Your sample sizes are quite unbalanced. While the test will still work, more balanced groups usually give clearer results."
		);
	}

	return warnings;
}

/**
 * Simple input sanitisation - handles the most common issues
 */
export function sanitiseABTestInput(input: unknown): unknown {
	if (!input || typeof input !== "object") return input;

	return {
		controlVariation: sanitiseVariation(input.controlVariation),
		variations: Array.isArray(input.variations)
			? input.variations.map(sanitiseVariation)
			: input.variations,
		confidenceLevel: sanitiseConfidenceLevel(input.confidenceLevel)
	};
}

function sanitiseVariation(input: unknown): unknown {
	if (!input || typeof input !== "object") return input;

	return {
		name: typeof input.name === "string" ? input.name.trim() : input.name,
		visitors: sanitiseNumber(input.visitors),
		conversions: sanitiseNumber(input.conversions),
		conversionRate: input.conversionRate
	};
}

function sanitiseNumber(value: unknown): unknown {
	if (typeof value === "string") {
		const cleaned = value.replace(/[,\s]/g, ""); // Remove commas and spaces
		const parsed = parseFloat(cleaned);
		return isNaN(parsed) ? value : parsed;
	}
	return value;
}

function sanitiseConfidenceLevel(value: unknown): unknown {
	if (typeof value === "string" && value.includes("%")) {
		const parsed = parseFloat(value.replace("%", ""));
		return isNaN(parsed) ? value : parsed / 100;
	}
	if (typeof value === "number" && value > 1 && value <= 100) {
		return value / 100; // Convert percentage to decimal
	}
	return value;
}
