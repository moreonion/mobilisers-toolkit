import { describe, expect, it } from "vitest";
import { estimateSampleSizePerVariant } from "../sample-size";

describe("estimateSampleSizePerVariant", () => {
	it("estimates the sample size for a small non-significant A/B gap", () => {
		const estimate = estimateSampleSizePerVariant({
			rateA: 0.061875,
			rateB: 0.06,
			confidenceLevel: 0.95
		});

		expect(estimate).toBe(255224);
	});

	it("uses the standard equal-allocation two-proportion approximation", () => {
		const estimate = estimateSampleSizePerVariant({
			rateA: 0.144,
			rateB: 0.12,
			confidenceLevel: 0.95
		});

		expect(estimate).toBe(3118);
	});

	it("returns null when there is no observed difference to estimate from", () => {
		const estimate = estimateSampleSizePerVariant({
			rateA: 0.06,
			rateB: 0.06,
			confidenceLevel: 0.95
		});

		expect(estimate).toBeNull();
	});

	it("requires more sample for higher confidence", () => {
		const lowerConfidence = estimateSampleSizePerVariant({
			rateA: 0.08,
			rateB: 0.07,
			confidenceLevel: 0.9
		});
		const higherConfidence = estimateSampleSizePerVariant({
			rateA: 0.08,
			rateB: 0.07,
			confidenceLevel: 0.99
		});

		expect(higherConfidence).toBeGreaterThan(lowerConfidence || 0);
	});
});
