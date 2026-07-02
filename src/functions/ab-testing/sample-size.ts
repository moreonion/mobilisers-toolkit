export type SampleSizeEstimateInput = {
	rateA: number;
	rateB: number;
	confidenceLevel: number;
	power?: number;
};

const zScoreForConfidence = (level: number): number => {
	if (level >= 0.99) return 2.576;
	if (level >= 0.95) return 1.96;
	return 1.645;
};

const zScoreForPower = (power: number): number => {
	if (power >= 0.9) return 1.282;
	if (power >= 0.85) return 1.036;
	return 0.84;
};

export const estimateSampleSizePerVariant = ({
	rateA,
	rateB,
	confidenceLevel,
	power = 0.8
}: SampleSizeEstimateInput): number | null => {
	const difference = Math.abs(rateA - rateB);
	if (difference === 0) return null;

	const averageRate = (rateA + rateB) / 2;
	const zAlpha = zScoreForConfidence(confidenceLevel);
	const zPower = zScoreForPower(power);
	const pooledTerm = zAlpha * Math.sqrt(2 * averageRate * (1 - averageRate));
	const separateTerm = zPower * Math.sqrt(rateA * (1 - rateA) + rateB * (1 - rateB));

	return Math.ceil(((pooledTerm + separateTerm) / difference) ** 2);
};
