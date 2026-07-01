<script lang="ts">
	import { fade } from "svelte/transition";
	import {
		twoProportionTest,
		formatTwoProportionData,
		chiSquareTest,
		comprehensivePairwiseAnalysis
	} from "@/functions/ab-testing/statistical-tests";
	import { testVariationSchema } from "@/functions/ab-testing/validation";
	import { estimateSampleSizePerVariant } from "@/functions/ab-testing/sample-size";
	import DevModePresets from "@/components/ab-testing/DevModePresets.svelte";
	import type { TestPreset } from "@/functions/ab-testing/test-presets";
	import type { TestVariation } from "@/types/ab-testing";
	import type {
		TwoProportionResult,
		MultiVariationResult,
		ValidationError,
		ComprehensiveAnalysisResult
	} from "@/types/statistical-results";

	// State management using Svelte 5 runes
	let controlData = $state({ name: "A", visitors: 0, conversions: 0 });
	let variationData = $state({ name: "B", visitors: 0, conversions: 0 });
	let additionalVariations = $state<TestVariation[]>([]);
	let confidenceLevel = $state(0.95);
	let results = $state<TwoProportionResult | MultiVariationResult | null>(null);
	let comprehensiveResults = $state<ComprehensiveAnalysisResult | null>(null);
	let validationErrors = $state<ValidationError[]>([]);

	// Derived state for checking if we have multiple variations
	const isMultiVariation = $derived(additionalVariations.length > 0);
	const hasBasicInputs = $derived(
		Number(controlData.visitors) > 0 && Number(variationData.visitors) > 0
	);
	const hasEnteredData = $derived(
		controlData.name !== "A" ||
			Number(controlData.visitors) > 0 ||
			Number(controlData.conversions) > 0 ||
			variationData.name !== "B" ||
			Number(variationData.visitors) > 0 ||
			Number(variationData.conversions) > 0 ||
			additionalVariations.length > 0
	);

	// Properly typed derived variable for two-proportion results
	const twoProportionResult = $derived(
		results && !isMultiVariation && "improvement" in results
			? (results as TwoProportionResult)
			: null
	);

	const calculateResults = (): void => {
		validationErrors = [];

		try {
			// Convert string inputs to numbers for validation and calculation
			const normalizedControlData = {
				name: controlData.name,
				visitors: Number(controlData.visitors) || 0,
				conversions: Number(controlData.conversions) || 0
			};

			const normalizedVariationData = {
				name: variationData.name,
				visitors: Number(variationData.visitors) || 0,
				conversions: Number(variationData.conversions) || 0
			};

			const normalizedAdditionalVariations = additionalVariations.map((variation) => ({
				name: variation.name,
				visitors: Number(variation.visitors) || 0,
				conversions: Number(variation.conversions) || 0
			}));

			// Validate control data
			const controlValidation = testVariationSchema.safeParse(normalizedControlData);
			if (!controlValidation.success) {
				validationErrors.push(
					...controlValidation.error.issues.map((err) => ({
						field: `control.${err.path.join(".")}`,
						message: err.message,
						code: err.code
					}))
				);
			}

			// Validate variation data
			const variationValidation = testVariationSchema.safeParse(normalizedVariationData);
			if (!variationValidation.success) {
				validationErrors.push(
					...variationValidation.error.issues.map((err) => ({
						field: `variation.${err.path.join(".")}`,
						message: err.message,
						code: err.code
					}))
				);
			}

			// Validate additional variations if present
			normalizedAdditionalVariations.forEach((variation, index) => {
				const validation = testVariationSchema.safeParse(variation);
				if (!validation.success) {
					validationErrors.push(
						...validation.error.issues.map((err) => ({
							field: `variation${index + 2}.${err.path.join(".")}`,
							message: err.message,
							code: err.code
						}))
					);
				}
			});

			if (validationErrors.length > 0) {
				results = null;
				comprehensiveResults = null;
				return;
			}

			if (isMultiVariation) {
				// Multi-variation test (3+ groups) - use comprehensive analysis
				const allVariations = [
					normalizedControlData,
					normalizedVariationData,
					...normalizedAdditionalVariations
				];

				// Get comprehensive analysis with all pairwise comparisons
				comprehensiveResults = comprehensivePairwiseAnalysis(allVariations, confidenceLevel);

				// Also run the overall chi-square test for the technical details panel
				const overallTest = chiSquareTest(allVariations, confidenceLevel);

				results = {
					overallTest,
					bonferroniCorrected: true
				};
			} else {
				// Two-proportion test - clear comprehensive results
				comprehensiveResults = null;

				const testData = formatTwoProportionData(
					normalizedControlData,
					normalizedVariationData,
					confidenceLevel
				);
				results = twoProportionTest(
					testData,
					normalizedControlData.name,
					normalizedVariationData.name
				);
			}
		} catch {
			// Error handling without needing the error object
			results = null;
			comprehensiveResults = null;
			validationErrors = [
				{
					field: "calculation",
					message:
						"There was an error calculating your results. Please check your data and try again.",
					code: "CALCULATION_ERROR"
				}
			];
		}
	};

	const getNextVariationName = (): string => {
		// Get all existing names
		const existingNames = [
			controlData.name,
			variationData.name,
			...additionalVariations.map((v) => v.name)
		];

		// Find the next available letter starting from A
		for (let i = 0; i < 26; i++) {
			const letter = String.fromCharCode(65 + i); // 65 is 'A'
			if (!existingNames.includes(letter)) {
				return letter;
			}
		}

		// Fallback if somehow all 26 letters are used
		return `Variation ${additionalVariations.length + 3}`;
	};

	const addVariation = (): void => {
		additionalVariations = [
			...additionalVariations,
			{
				name: getNextVariationName(),
				visitors: 0,
				conversions: 0
			}
		];
	};

	const removeVariation = (index: number): void => {
		additionalVariations = additionalVariations.filter((_, i) => i !== index);
		// Clear results since data structure changed
		results = null;
		comprehensiveResults = null;
	};

	const removeControl = (): void => {
		if (additionalVariations.length > 0) {
			// Move variation B to control position
			controlData = { ...variationData };
			// Move first additional variation to variation B position
			variationData = { ...additionalVariations[0] };
			// Remove the first additional variation
			additionalVariations = additionalVariations.slice(1);
			// Clear results since data structure changed
			results = null;
			comprehensiveResults = null;
		}
	};

	const removeVariation1 = (): void => {
		if (additionalVariations.length > 0) {
			// Move first additional variation to variation B position
			variationData = { ...additionalVariations[0] };
			// Remove the first additional variation
			additionalVariations = additionalVariations.slice(1);
			// Clear results since data structure changed
			results = null;
			comprehensiveResults = null;
		}
	};

	const resetForm = (): void => {
		results = null;
		comprehensiveResults = null;
		controlData = { name: "A", visitors: 0, conversions: 0 };
		variationData = { name: "B", visitors: 0, conversions: 0 };
		additionalVariations = [];
		confidenceLevel = 0.95;
		validationErrors = [];
	};

	const handleConfidenceLevelChange = (event: Event): void => {
		const select = event.currentTarget as HTMLSelectElement;
		confidenceLevel = Number(select.value);

		if (results && hasBasicInputs) {
			calculateResults();
		}
	};

	const handleFormSubmit = (event: Event): void => {
		event.preventDefault();
		if (hasBasicInputs) {
			calculateResults();
		}
	};

	type ImpactComparison = {
		label: string;
		difference: number;
	};

	let impactAudienceSizeInput = $state("10000");
	const parsedImpactAudienceSize = $derived(Number(impactAudienceSizeInput.replace(/,/g, "")));
	const hasValidImpactAudienceSize = $derived(
		Number.isFinite(parsedImpactAudienceSize) && parsedImpactAudienceSize > 0
	);

	const wholeNumberFormatter = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0
	});

	const percentageFormatter = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 2
	});

	const formatCompactNumber = (value: number): string =>
		wholeNumberFormatter.format(Math.round(value));

	const formatConversionRatePercent = (rate: number): string =>
		`${percentageFormatter.format(rate * 100)}%`;

	const formatSampleSizeEstimate = (value: number): string => {
		let rounded: number;
		if (value >= 100000) {
			rounded = Math.round(value / 10000) * 10000;
		} else if (value >= 10000) {
			rounded = Math.round(value / 1000) * 1000;
		} else if (value >= 1000) {
			rounded = Math.round(value / 100) * 100;
		} else {
			rounded = Math.round(value / 10) * 10;
		}

		return wholeNumberFormatter.format(rounded);
	};

	const formatRateDecimal = (value: number): string =>
		Math.abs(value).toFixed(4).replace(/0+$/, "").replace(/\.$/, "");

	const formatPercentagePoints = (value: number): string => {
		const percentagePoints = Math.abs(value * 100);
		return percentagePoints >= 1 ? percentagePoints.toFixed(1) : percentagePoints.toFixed(2);
	};

	const formatImpactCalculation = (difference: number): string => {
		const conversionDirection = difference >= 0 ? "extra" : "fewer";
		const extraConversions = Math.abs(difference) * parsedImpactAudienceSize;

		return `${formatCompactNumber(parsedImpactAudienceSize)} × ${formatRateDecimal(difference)} = about ${formatCompactNumber(extraConversions)} ${conversionDirection} conversions.`;
	};

	const getMultiVariantImpactComparison = (
		analysis: ComprehensiveAnalysisResult | null
	): ImpactComparison | null => {
		const topVariant = analysis?.performanceGroups[0]?.variations[0];
		const nextBestLowerVariant = analysis?.performanceGroups
			.slice(1)
			.flatMap((tier) => tier.variations)
			.sort((a, b) => b.conversionRate - a.conversionRate)[0];

		if (!topVariant || !nextBestLowerVariant) {
			return null;
		}

		return {
			label: `${topVariant.name} versus ${nextBestLowerVariant.name}`,
			difference: topVariant.conversionRate - nextBestLowerVariant.conversionRate
		};
	};

	const multiVariantImpactComparison = $derived(
		getMultiVariantImpactComparison(comprehensiveResults)
	);

	type RatedVariation =
		ComprehensiveAnalysisResult["performanceGroups"][number]["variations"][number];
	type DataGuideItem = {
		label: string;
		text: string;
	};

	const getVariantGapGuide = (first: RatedVariation, second: RatedVariation): string | null => {
		const estimate = estimateSampleSizePerVariant({
			rateA: first.conversionRate,
			rateB: second.conversionRate,
			confidenceLevel
		});
		if (!estimate) return null;

		return `${first.name} and ${second.name} differ by ${formatPercentagePoints(first.conversionRate - second.conversionRate)} percentage points. Detecting whether a gap that size is significant takes about ${formatSampleSizeEstimate(estimate)} total people in each variant.`;
	};

	const getClosestTopVersusOtherPair = (
		analysis: ComprehensiveAnalysisResult
	): [RatedVariation, RatedVariation] | null => {
		const topVariants = analysis.performanceGroups[0]?.variations ?? [];
		const lowerVariants = analysis.performanceGroups.slice(1).flatMap((tier) => tier.variations);
		let closestPair: [RatedVariation, RatedVariation] | null = null;
		let closestDifference = Infinity;

		for (const topVariant of topVariants) {
			for (const lowerVariant of lowerVariants) {
				const difference = Math.abs(topVariant.conversionRate - lowerVariant.conversionRate);
				if (difference < closestDifference) {
					closestDifference = difference;
					closestPair = [topVariant, lowerVariant];
				}
			}
		}

		return closestPair;
	};

	const getMultiVariantDataGuides = (
		analysis: ComprehensiveAnalysisResult | null
	): DataGuideItem[] => {
		if (!analysis) return [];

		const guides: DataGuideItem[] = [];
		const insightTitles = analysis.insights.map((insight) => insight.title);
		const hasHighPerformers = insightTitles.some((title) => title.includes("High Performers"));
		const hasLimitedEvidence = insightTitles.includes("Limited Evidence");
		const hasNoClearWinner = insightTitles.includes("No clear winner");
		const sorted = analysis.performanceGroups
			.flatMap((tier) => tier.variations)
			.sort((a, b) => b.conversionRate - a.conversionRate);

		if (hasHighPerformers && sorted.length >= 2) {
			const guide = getVariantGapGuide(sorted[0], sorted[1]);
			if (guide) {
				guides.push({
					label: "Pick between the top variants",
					text: guide
				});
			}
		}

		if (hasLimitedEvidence) {
			const pair = getClosestTopVersusOtherPair(analysis);
			if (pair) {
				const guide = getVariantGapGuide(pair[0], pair[1]);
				if (guide) {
					guides.push({
						label: "Confirm the top group beats the others",
						text: guide
					});
				}
			}
		}

		if (hasNoClearWinner && guides.length === 0 && sorted.length >= 2) {
			const guide = getVariantGapGuide(sorted[0], sorted[sorted.length - 1]);
			if (guide) {
				guides.push({
					label: "Check the largest observed gap",
					text: guide
				});
			}
		}

		return guides;
	};

	const loadPreset = (preset: TestPreset): void => {
		// Clear existing results
		results = null;
		comprehensiveResults = null;
		validationErrors = [];

		// Load preset data
		controlData = { ...preset.controlVariation };

		if (preset.variations.length === 1) {
			// Two-variation test
			variationData = { ...preset.variations[0] };
			additionalVariations = [];
		} else {
			// Multi-variation test
			variationData = { ...preset.variations[0] };
			additionalVariations = preset.variations.slice(1).map((v) => ({ ...v }));
		}

		confidenceLevel = preset.confidenceLevel;
	};
</script>

{#snippet conversionRateDisplay(visitors: number | string, conversions: number | string)}
	<span class="conversion-rate">
		{Number(visitors) > 0
			? formatConversionRatePercent(Number(conversions) / Number(visitors))
			: "0%"}
	</span>
{/snippet}

{#snippet variantRow(
	variantData: TestVariation,
	isWinner: boolean = false,
	showRemoveButton: boolean = false,
	onRemove: (() => void) | null = null,
	visitorPlaceholder: string = "e.g. 50000",
	conversionPlaceholder: string = "e.g. 500"
)}
	<tr class="data-row" class:winner-row={isWinner}>
		<td>
			<span class="mobile-cell-label" aria-hidden="true">Variant</span>
			<input
				type="text"
				bind:value={variantData.name}
				class="variant-input"
				aria-label="Variant name"
			/>
		</td>
		<td>
			<span class="mobile-cell-label" aria-hidden="true">Sample size</span>
			<input
				type="text"
				bind:value={variantData.visitors}
				min="1"
				class="number-input"
				aria-label="Sample size"
				placeholder={visitorPlaceholder}
			/>
		</td>
		<td>
			<span class="mobile-cell-label" aria-hidden="true">Conversions</span>
			<input
				type="text"
				bind:value={variantData.conversions}
				min="0"
				max={variantData.visitors}
				class="number-input"
				aria-label="Number of conversions"
				placeholder={conversionPlaceholder}
			/>
		</td>
		<td class="conversion-rate-cell">
			<span class="mobile-cell-label" aria-hidden="true">Conversion rate</span>
			{@render conversionRateDisplay(variantData.visitors, variantData.conversions)}
		</td>
		<td class="variant-action-cell">
			{#if showRemoveButton && onRemove}
				<button
					type="button"
					class="button tiny alert hollow remove-variant-button"
					onclick={onRemove}
					aria-label="Remove variant {variantData.name}"
				>
					❌
				</button>
			{:else}
				<span class="remove-variant-placeholder" aria-hidden="true">❌</span>
			{/if}
		</td>
	</tr>
{/snippet}

{#snippet statisticalMetric(label: string, value: string, explanation: string)}
	<p>
		<strong>{label}</strong>
		{value}
		<br />
		<small>{explanation}</small>
	</p>
{/snippet}

{#snippet impactCalculator(difference: number, comparisonLabel: string | null = null)}
	<div class="impact-calculator">
		<h5>Estimate the practical impact before changing anything</h5>
		<p>
			Before making a change, weigh the extra conversions against the cost, effort, and risk of
			making a change. Sometimes, the change is very quick to make. Sometimes it's not. Are the
			extra conversions worth it?
		</p>
		<p>
			To estimate the number of extra conversions, multiply the percentage-point difference between
			your variants by your normal audience size.
		</p>
		{#if comparisonLabel}
			<p class="impact-comparison">{comparisonLabel}</p>
		{/if}
		<dl class="impact-details">
			<div>
				<dt>Difference:</dt>
				<dd>{formatPercentagePoints(difference)} percentage points</dd>
			</div>
		</dl>
		<label>
			Normal audience size
			<input
				type="text"
				inputmode="numeric"
				bind:value={impactAudienceSizeInput}
				class="number-input impact-audience-input"
				aria-label="Normal audience size"
			/>
		</label>
		<p class="impact-calculation">
			{#if hasValidImpactAudienceSize}
				{formatImpactCalculation(difference)}
			{:else}
				Enter a positive audience size to estimate conversions.
			{/if}
		</p>
	</div>
{/snippet}

{#snippet reliabilityDetails(resultData: TwoProportionResult | MultiVariationResult)}
	<details class="confidence-section">
		<summary>How strong is the evidence?</summary>
		<div class="confidence-content">
			{#if "overallTest" in resultData}
				{@const hasStrongEvidence =
					comprehensiveResults &&
					(() => {
						if (comprehensiveResults.performanceGroups.length <= 1) {
							return (
								comprehensiveResults.allComparisons.filter((c) => c.isSignificant).length /
									comprehensiveResults.allComparisons.length >=
								0.5
							);
						}
						const topTier = comprehensiveResults.performanceGroups[0];
						const lowerTierVariants = comprehensiveResults.performanceGroups
							.slice(1)
							.flatMap((tier) => tier.variations);
						let significantCrossings = 0;
						let totalCrossings = 0;
						for (const topVariant of topTier.variations) {
							for (const lowerVariant of lowerTierVariants) {
								const comparison = comprehensiveResults.allComparisons.find(
									(c) =>
										(c.control.name === topVariant.name &&
											c.variation.name === lowerVariant.name) ||
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
						return totalCrossings > 0 ? significantCrossings / totalCrossings >= 0.5 : false;
					})()}
				<p>
					<strong>Evidence</strong>
					{#if resultData.overallTest.isSignificant && hasStrongEvidence}
						Strong evidence. The differences are large enough, and the sample is big enough, to show
						that some variants performed better than others.
					{:else if resultData.overallTest.isSignificant}
						Some variants may be performing differently, but this test cannot clearly show which
						variant is best.
					{:else}
						Not enough evidence. With this sample size, the differences between variants could be
						normal random variation.
					{/if}
				</p>
				<p>
					<strong>How to use this</strong>
					{#if resultData.overallTest.isSignificant && hasStrongEvidence}
						Start with the variants in the top group, then estimate the practical impact.
					{:else if resultData.overallTest.isSignificant}
						Do not pick a winner from the ranking alone. If you need a clear winner, collect more
						data or run a simpler test with the strongest variants.
					{:else}
						Treat this as no clear winner. Do not pick a variant on these numbers alone; choose
						based on cost, risk, fit, or collect more data if a small difference would change your
						decision.
					{/if}
				</p>
				{#if resultData.overallTest.isSignificant && hasStrongEvidence && multiVariantImpactComparison}
					{@render impactCalculator(
						multiVariantImpactComparison.difference,
						multiVariantImpactComparison.label
					)}
				{/if}
			{:else}
				<p>
					<strong>Evidence</strong>
					{#if resultData.isSignificant}
						Strong evidence. The difference is larger than we'd expect from random variation alone
						at this sample size.
					{:else}
						This test did not find a clear winner. With this sample size, the difference in
						conversion rates could be real or could be due to chance.
					{/if}
				</p>
				<p>
					<strong>How to use this</strong>
					{#if resultData.isSignificant}
						You can treat this as evidence that one variant performed better in this test.
					{:else}
						Do not pick a winner from these numbers alone. If even a small difference would matter,
						collect more data. If not, choose the option that is cheaper, safer, or easier to run.
					{/if}
				</p>
				{#if resultData.isSignificant}
					{@render impactCalculator(Math.abs(resultData.improvement.absolute))}
				{:else if estimateSampleSizePerVariant( { rateA: resultData.variation.conversionRate, rateB: resultData.control.conversionRate, confidenceLevel } )}
					<p>
						<strong>Sample size needed</strong>
						The gap is {formatPercentagePoints(resultData.improvement.absolute)} percentage points.
						Detecting whether a gap that size is significant takes about {formatSampleSizeEstimate(
							estimateSampleSizePerVariant({
								rateA: resultData.variation.conversionRate,
								rateB: resultData.control.conversionRate,
								confidenceLevel
							}) || 0
						)} total people in each variant.
					</p>
				{/if}
			{/if}

			<!-- Technical Details for Experts -->
			<details class="technical-details">
				<summary>Technical details</summary>
				<div class="technical-details-content">
					{#if "overallTest" in resultData}
						{@render statisticalMetric(
							"Chi-square statistic",
							resultData.overallTest.testStatistic.toFixed(2),
							`Compares actual conversions with expected conversions if variants performed about the same. Judge it with the p-value below.`
						)}
						{@render statisticalMetric(
							"Degrees of freedom",
							(resultData.overallTest.degreesOfFreedom || 0).toString(),
							`The amount of independent information in this chi-square test. Here it is variants minus 1: ${additionalVariations.length + 2} variants gives ${resultData.overallTest.degreesOfFreedom || 0}. This affects how large the chi-square statistic must be before the p-value becomes small.`
						)}
						{@render statisticalMetric(
							"P-value",
							resultData.overallTest.pValue.toFixed(4),
							`If the variants performed equally, this is the chance of seeing a chi-square statistic this large or larger from random variation alone. ${resultData.overallTest.pValue < 0.001 ? "Very strong evidence that at least one variant differs" : resultData.overallTest.pValue < 0.01 ? "Strong evidence that at least one variant differs" : resultData.overallTest.pValue < 0.05 ? "Moderate evidence that at least one variant differs" : "Weak evidence; the observed differences may be random variation"}.`
						)}
						{#if resultData.bonferroniCorrected}
							{@render statisticalMetric(
								"Multiple comparison adjustment",
								"Applied",
								"Pairwise comparisons use a stricter threshold because testing many pairs increases the chance that one looks significant by luck."
							)}
						{/if}
					{:else}
						{@render statisticalMetric(
							"Relative improvement",
							resultData.improvement.relative !== null
								? (resultData.improvement.relative > 0 ? "+" : "") +
										resultData.improvement.relative.toFixed(1) +
										"%"
								: "N/A",
							"Change in the variation's conversion rate relative to the control: (variation − control) ÷ control. For practical impact, use the percentage-point difference: 2 points across 10,000 people is about 200 extra conversions. It is N/A when the control conversion rate is 0."
						)}
						{@render statisticalMetric(
							"P-value",
							resultData.pValue.toFixed(4),
							`If the variants performed equally, this is the chance of seeing a difference this large or larger in either direction from random variation alone. Values below ${(1 - confidenceLevel).toFixed(2)} meet the selected significance threshold.`
						)}
						{@render statisticalMetric(
							"Confidence interval",
							`${resultData.improvement.confidenceInterval.lower.toFixed(1)}% to ${resultData.improvement.confidenceInterval.upper.toFixed(1)}%`,
							`Estimated range for the true change. A ${confidenceLevel * 100}% confidence interval means this method would capture the true effect in about ${confidenceLevel * 100}% of repeated tests. If the range includes 0%, the true effect could be no change.`
						)}
						{@render statisticalMetric(
							"Z-score",
							resultData.testStatistic.toFixed(2),
							"How many standard errors the observed difference is from 0. Larger absolute values are stronger evidence against equal conversion rates; at 95% confidence, values beyond ±1.96 usually correspond to p < 0.05."
						)}
					{/if}
				</div>
			</details>
		</div>
	</details>
{/snippet}

<section>
	<div class="ab-testing-wrapper">
		<!-- Data Input Form -->
		<form onsubmit={handleFormSubmit}>
			<!-- Data Input Table using Foundation classes -->
			<div class="table-scroll">
				<table class="hover stack" aria-label="A/B test data input">
					<thead>
						<tr>
							<th>
								Variant
								<small>Your label for each version</small>
							</th>
							<th>
								Sample size
								<small>People or recipients in this group</small>
							</th>
							<th>
								Conversions
								<small>People who completed the goal</small>
							</th>
							<th>Conversion rate</th>
							<th class="variant-action-column">
								<span class="show-for-sr">Remove variant</span>
							</th>
						</tr>
					</thead>
					<tbody>
						<!-- Control Row -->
						{@render variantRow(
							controlData,
							false,
							additionalVariations.length > 0,
							removeControl,
							"e.g. 50000",
							"e.g. 500"
						)}

						<!-- Variation Row -->
						{@render variantRow(
							variationData,
							(twoProportionResult &&
								twoProportionResult.isSignificant &&
								twoProportionResult.improvement.relative !== null &&
								twoProportionResult.improvement.relative > 0) ||
								false,
							additionalVariations.length > 0,
							removeVariation1,
							"e.g. 50000",
							"e.g. 570"
						)}

						<!-- Additional Variations -->
						{#each additionalVariations as variation, index (variation.name)}
							{@render variantRow(
								variation,
								false,
								true,
								() => removeVariation(index),
								"e.g. 50000",
								"e.g. 550"
							)}
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Action Buttons using Foundation classes -->
			<div class="button-group">
				<button type="button" class="button secondary" onclick={addVariation}>
					Add a variant +
				</button>

				{#if hasBasicInputs}
					<button type="submit" class="button"> Calculate </button>
				{/if}
			</div>
		</form>

		<!-- Dev Mode Test Presets -->
		<DevModePresets onPresetLoad={loadPreset} />

		<!-- Validation Errors -->
		{#if validationErrors.length > 0}
			<div class="callout alert" role="alert">
				<ul>
					{#each validationErrors as error, index (index)}
						<li>{error.message}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Results Display -->
		{#if results}
			<div class="results-wrapper" in:fade={{ delay: 100 }} role="region" aria-label="Test results">
				{#if comprehensiveResults}
					<!-- Comprehensive Multi-variation Results -->
					<div class="callout result-callout result-positive">
						{#if comprehensiveResults.performanceGroups.length > 0}
							<div class="performance-groups" aria-label="Variant performance groups">
								{#each comprehensiveResults.performanceGroups as tier (tier.tier)}
									<section class="tier-group" aria-labelledby="tier-{tier.tier}-label">
										<h5 id="tier-{tier.tier}-label">{tier.label}</h5>
										<ul class="tier-variants">
											{#each tier.variations as variation (variation.name)}
												<li>
													<span>{variation.name}</span>
													<strong>{formatConversionRatePercent(variation.conversionRate)}</strong>
												</li>
											{/each}
										</ul>
									</section>
								{/each}
							</div>
						{/if}

						<!-- Business Insights -->
						{#if comprehensiveResults.insights.length > 0}
							{@const dataGuides = getMultiVariantDataGuides(comprehensiveResults)}
							<div class="business-insights">
								{#each comprehensiveResults.insights as insight, index (index)}
									<section class="insight" aria-labelledby="insight-{index}">
										<h5 id="insight-{index}">{insight.title}</h5>
										<!-- eslint-disable-next-line svelte/no-at-html-tags -- Safe: insight.message is generated by generateBusinessInsights() with trusted content -->
										<p>{@html insight.message}</p>
										{#if insight.actionable}
											<p class="insight-action"><strong>Next step:</strong> {insight.actionable}</p>
										{/if}
									</section>
								{/each}
								{#if dataGuides.length > 0}
									<section class="insight-data-guide" aria-labelledby="multi-variant-data-guide">
										<h5 id="multi-variant-data-guide">Sample size needed</h5>
										{#if dataGuides.length > 1}
											<p>Use the estimate that matches your next decision:</p>
										{/if}
										<ul>
											{#each dataGuides as guide (guide.label)}
												<li>{dataGuides.length > 1 ? `${guide.label}: ` : ""}{guide.text}</li>
											{/each}
										</ul>
									</section>
								{/if}
							</div>
						{/if}

						{@render reliabilityDetails(results)}
					</div>
				{:else if "overallTest" in results}
					<!-- Multi-variation results are displayed through comprehensiveResults. -->
				{:else}
					<!-- Two-proportion Results -->
					<div
						class="callout result-callout {results.isSignificant
							? 'result-positive'
							: 'result-negative'}"
					>
						<h4>
							{results.isSignificant ? "✅ Significant result!" : "❌ Not significant"}
						</h4>
						{#if results.isSignificant}
							{#if results.improvement.relative !== null}
								{@const variationWon = results.improvement.relative > 0}
								<p>
									<strong>
										Variant <em>{variationWon ? results.variation.name : results.control.name}</em>
										performed better.
									</strong>
									<em>{variationWon ? results.variation.name : results.control.name}</em> converted
									at {(
										(variationWon
											? results.variation.conversionRate
											: results.control.conversionRate) * 100
									).toFixed(2)}%, compared with {(
										(variationWon
											? results.control.conversionRate
											: results.variation.conversionRate) * 100
									).toFixed(2)}% for
									<em>{variationWon ? results.control.name : results.variation.name}</em>
									— a {Math.abs(results.improvement.relative).toFixed(1)}% relative increase. This
									is statistically significant at {confidenceLevel * 100}% confidence.
								</p>
							{:else}
								<p>
									<strong>Variant <em>{results.variation.name}</em> performed differently.</strong>
									Its conversion rate was {(results.variation.conversionRate * 100).toFixed(2)}%,
									compared with {(results.control.conversionRate * 100).toFixed(2)}% for
									<em>{results.control.name}</em>. This is statistically significant at {confidenceLevel *
										100}% confidence.
								</p>
							{/if}
						{:else}
							<p>
								The difference between variant <em>{results.variation.name}</em>
								({(results.variation.conversionRate * 100).toFixed(2)}%) and variant
								<em>{results.control.name}</em>
								({(results.control.conversionRate * 100).toFixed(2)}%) is not statistically
								significant.
							</p>
						{/if}

						{@render reliabilityDetails(results)}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Settings -->
		<details class="advanced-settings">
			<summary>Advanced settings</summary>
			<div class="advanced-content">
				<label for="confidenceLevel">
					Confidence level
					<select
						id="confidenceLevel"
						value={confidenceLevel}
						onchange={handleConfidenceLevelChange}
					>
						<option value={0.9}>90%</option>
						<option value={0.95}>95%</option>
						<option value={0.99}>99%</option>
					</select>
					<small>Sets how strong the evidence must be before we call a result significant.</small>
				</label>

				{#if hasEnteredData}
					<button type="button" class="button alert small" onclick={resetForm}>
						Clear all data
					</button>
				{/if}
			</div>
		</details>
	</div>
</section>

<style>
	.ab-testing-wrapper {
		max-width: 60rem;
	}
	/* Table styling to complement Foundation */
	.table-scroll {
		margin-bottom: 1.5rem;
		background: white;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch;
	}

	table {
		margin-bottom: 0;
	}

	thead th {
		background-color: #f8f9fa;
		font-weight: 600;
		padding: 1rem;
		border-bottom: 2px solid #e9ecef;
	}

	thead th small {
		display: block;
		margin-top: 0.25rem;
	}

	.data-row td {
		padding: 1rem;
		vertical-align: middle;
	}

	.winner-row {
		background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
		box-shadow: inset 4px 0 0 #28a745;
	}

	.variant-input,
	.number-input {
		margin-bottom: 0;
		width: fit-content;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.number-input {
		text-align: right;
		font-family: monospace;
	}

	.conversion-rate-cell {
		font-weight: 600;
		text-align: center;
	}

	.mobile-cell-label {
		display: none;
	}

	.variant-action-column,
	.variant-action-cell {
		box-sizing: border-box;
		width: 4rem;
		min-width: 4rem;
		text-align: center;
	}

	.remove-variant-button,
	.remove-variant-placeholder {
		align-items: center;
		box-sizing: border-box;
		display: inline-flex;
		height: 2rem;
		justify-content: center;
		line-height: 1;
		margin: 0;
		padding: 0;
		width: 2rem;
	}

	.remove-variant-placeholder {
		visibility: hidden;
	}

	.winner-row .conversion-rate {
		color: #28a745;
	}

	#confidenceLevel {
		width: fit-content;
	}

	.impact-calculator {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 4px;
		color: #343433;
		margin: 0.75rem 0 1rem;
		padding: 0.75rem;
	}

	.impact-calculator h5 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
	}

	.impact-calculator p {
		margin-bottom: 0.5rem;
	}

	.impact-details {
		margin: 0 0 0.5rem;
	}

	.impact-details div {
		align-items: baseline;
		display: flex;
		gap: 0.5rem;
	}

	.impact-details dt {
		font-weight: 600;
	}

	.impact-details dd {
		font-variant-numeric: tabular-nums;
		margin: 0;
	}

	.impact-comparison,
	.impact-calculation {
		font-weight: 600;
	}

	.impact-audience-input {
		background: #fff;
		color: #343433;
		margin-top: 0.25rem;
	}

	/* Button styling */
	.button-group {
		margin-bottom: 2rem;
	}

	.button-group .button {
		margin-right: 1rem;
		margin-bottom: 0;
	}

	/* Results styling using Foundation callouts */
	.results-wrapper {
		margin-bottom: 2rem;
	}

	.result-callout {
		background: #fff;
		border: 1px solid #e9ecef;
		border-left-width: 4px;
		color: #343433;
		max-width: 40rem;
	}

	.result-positive {
		border-left-color: #28a745;
	}

	.result-negative {
		border-left-color: #dc3545;
	}

	.performance-groups {
		display: grid;
		gap: 0.75rem;
		max-width: 28rem;
	}

	.tier-group {
		border: 1px solid #e9ecef;
		border-radius: 6px;
		margin: 0;
		padding: 0.75rem;
	}

	.tier-group h5,
	.business-insights .insight h5,
	.insight-data-guide h5 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
	}

	.tier-group h5 {
		color: #343433;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.tier-variants {
		list-style: none;
		margin: 0;
	}

	.tier-variants li {
		align-items: baseline;
		border-top: 1px solid #e9ecef;
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.tier-variants span {
		font-weight: 500;
		line-height: 1.3;
	}

	.tier-variants li:first-child {
		border-top: 0;
	}

	.tier-variants strong {
		color: #6c757d;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Business Insights */
	.business-insights {
		display: grid;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.business-insights .insight {
		border: 1px solid #e9ecef;
		border-radius: 4px;
		padding: 0.75rem;
	}

	.business-insights .insight p {
		margin-bottom: 0.5rem;
	}

	.business-insights .insight p:last-child {
		margin-bottom: 0;
	}

	.insight-action {
		font-size: 0.875rem;
	}

	.insight-data-guide {
		background: #f8f9fa;
		border-radius: 3px;
		font-size: 0.875rem;
		padding: 0.625rem 0.75rem;
	}

	.insight-data-guide p {
		margin-bottom: 0.5rem;
	}

	.insight-data-guide ul {
		margin-bottom: 0;
		margin-left: 1.1rem;
	}

	.insight-data-guide li {
		font-weight: 400;
	}

	.insight-data-guide li + li {
		margin-top: 0.5rem;
	}

	/* Confidence section styling */
	.confidence-section {
		margin-top: 1.5rem;
	}

	.confidence-section > summary {
		border-bottom: 0;
		color: #343433;
		cursor: pointer;
		font-weight: 600;
		padding-bottom: 0;
		text-decoration: none;
	}

	.confidence-content {
		margin-top: 0.5rem;
	}

	.callout p {
		font-weight: 400;
	}

	.technical-details {
		margin-top: 1rem;
	}

	.technical-details > summary {
		border-bottom: 0;
		color: #6c757d;
		cursor: pointer;
		font-size: 0.875rem;
		padding-bottom: 0;
		text-decoration: none;
	}

	.technical-details-content {
		margin-top: 1rem;
	}

	/* Advanced settings */
	.advanced-settings {
		margin-top: 2rem;
		border-top: 1px solid #e9ecef;
		padding-top: 1rem;
	}

	.advanced-settings summary {
		cursor: pointer;
		padding: 0.5rem 0;
		font-weight: 500;
		color: #6c757d;
	}

	.advanced-content {
		padding: 1rem 0;
	}

	.advanced-content label {
		margin-bottom: 1rem;
	}

	.advanced-content select {
		margin-top: 0.25rem;
	}

	/* Responsive adjustments */
	@media screen and (min-width: 40.001em) and (max-width: 63.99875em) {
		table.stack {
			table-layout: fixed;
			width: 100%;
		}

		table.stack thead {
			display: table-header-group;
		}

		table.stack tr {
			display: table-row;
		}

		table.stack th,
		table.stack td {
			display: table-cell;
		}

		table.stack th {
			font-size: 0.875rem;
			line-height: 1.25;
			padding: 0.75rem 0.625rem;
			white-space: normal;
		}

		table.stack th small {
			font-size: 0.75rem;
			line-height: 1.25;
		}

		table.stack td {
			border-top: inherit;
			padding: 0.75rem 0.625rem;
		}

		table.stack th:nth-child(1),
		table.stack td:nth-child(1) {
			width: 27%;
		}

		table.stack th:nth-child(2),
		table.stack td:nth-child(2),
		table.stack th:nth-child(3),
		table.stack td:nth-child(3) {
			width: 22%;
		}

		table.stack th:nth-child(4),
		table.stack td:nth-child(4) {
			width: 17%;
		}

		table.stack th:nth-child(5),
		table.stack td:nth-child(5) {
			padding-left: 0.5rem;
			padding-right: 0.5rem;
			width: 12%;
		}

		table.stack .variant-input,
		table.stack .number-input {
			box-sizing: border-box;
			max-width: none;
			min-width: 0;
			width: 100%;
		}
	}

	@media screen and (max-width: 40em) {
		.mobile-cell-label {
			color: #343433;
			display: block;
			font-size: 0.8125rem;
			font-weight: 700;
			line-height: 1.3;
			margin-bottom: 0.35rem;
		}

		.conversion-rate-cell,
		.variant-action-cell {
			text-align: left;
		}

		/* Adjust table cell padding for mobile */
		.data-row td {
			padding: 0.75rem 0.5rem;
			vertical-align: middle;
		}

		/* Make inputs more mobile-friendly */
		.variant-input,
		.number-input {
			padding: 0.75rem 0.5rem;
			font-size: 16px; /* Prevents zoom on iOS */
			min-width: 80px;
			max-width: 120px;
		}

		/* Better conversion rate display on mobile */
		.conversion-rate-cell {
			font-size: 0.875rem;
			min-width: 90px;
		}

		/* Stack buttons vertically on mobile */
		.button-group {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		.button-group .button {
			width: 100%;
			margin-right: 0;
			margin-bottom: 0;
		}

		/* Better callout spacing on mobile */
		.callout {
			padding: 1rem;
			margin-bottom: 1rem;
		}

		/* Advanced settings improvements */
		.advanced-content {
			padding: 0.75rem 0;
		}

		.advanced-content label {
			font-size: 0.875rem;
		}

		/* Ensure select dropdowns are properly sized */
		#confidenceLevel {
			width: 100%;
			max-width: 200px;
		}
	}
</style>
