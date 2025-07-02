<script lang="ts">
	import { fade } from "svelte/transition";
	import {
		twoProportionTest,
		formatTwoProportionData,
		chiSquareTest,
		pairwiseComparisons,
		comprehensivePairwiseAnalysis
	} from "@/functions/ab-testing/statistical-tests";
	import { bonferroniCorrection } from "@/functions/ab-testing/bonferroni";
	import { testVariationSchema } from "@/functions/ab-testing/validation";
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
	let hasChanges = $state(false);

	// Derived state for checking if we have multiple variations
	const isMultiVariation = $derived(additionalVariations.length > 0);
	const hasBasicInputs = $derived(
		Number(controlData.visitors) > 0 && Number(variationData.visitors) > 0
	);

	// Properly typed derived variable for two-proportion results
	const twoProportionResult = $derived(
		results && !isMultiVariation && "improvement" in results
			? (results as TwoProportionResult)
			: null
	);

	// Properly typed derived variable for multi-variation results
	const multiVariationResult = $derived(
		results && isMultiVariation && "overallTest" in results
			? (results as MultiVariationResult)
			: null
	);

	// Helper for checking if winners are tied (within 1% relative improvement)
	// Note: Currently unused but may be needed for future UI enhancements
	// const areWinnersTied = $derived(
	// 	multiVariationResult?.winningVariations && multiVariationResult.winningVariations.length > 1
	// 		? multiVariationResult.winningVariations.every(
	// 				(w) =>
	// 					Math.abs(w.improvement - multiVariationResult.winningVariations![0].improvement) < 1.0
	// 			)
	// 		: false
	// );

	// Capture initial state on mount
	let initialState: {
		controlData: { name: string; visitors: number; conversions: number };
		variationData: { name: string; visitors: number; conversions: number };
		additionalVariations: TestVariation[];
		confidenceLevel: number;
	} | null = null;
	$effect(() => {
		if (!initialState) {
			initialState = {
				controlData: { ...controlData },
				variationData: { ...variationData },
				additionalVariations: [...additionalVariations],
				confidenceLevel
			};
		}
	});

	// Automatically detect changes using reactive statement
	$effect(() => {
		if (initialState) {
			hasChanges =
				controlData.name !== initialState.controlData.name ||
				controlData.visitors !== initialState.controlData.visitors ||
				controlData.conversions !== initialState.controlData.conversions ||
				variationData.name !== initialState.variationData.name ||
				variationData.visitors !== initialState.variationData.visitors ||
				variationData.conversions !== initialState.variationData.conversions ||
				additionalVariations.length !== initialState.additionalVariations.length ||
				confidenceLevel !== initialState.confidenceLevel;
		}
	});

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
					...controlValidation.error.errors.map((err) => ({
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
					...variationValidation.error.errors.map((err) => ({
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
						...validation.error.errors.map((err) => ({
							field: `variation${index + 2}.${err.path.join(".")}`,
							message: err.message,
							code: err.code
						}))
					);
				}
			});

			if (validationErrors.length > 0) {
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

				// Also run traditional chi-square test for backwards compatibility
				const overallTest = chiSquareTest(allVariations, confidenceLevel);
				const pairwise = pairwiseComparisons(allVariations, confidenceLevel);

				// Apply Bonferroni correction for backward compatibility
				const correctedResults = bonferroniCorrection(
					pairwise.map((result) => result.pValue),
					1 - confidenceLevel
				);

				// Update significance based on corrected p-values
				const correctedPairwise = pairwise.map((result, index) => ({
					...result,
					isSignificant: correctedResults[index].isSignificant,
					pValue: correctedResults[index].correctedPValue
				}));

				// For backwards compatibility, keep the traditional result structure
				results = {
					overallTest,
					pairwiseComparisons: correctedPairwise,
					bonferroniCorrected: true,
					bonferroniAlpha: correctedResults[0].correctedAlpha,
					showWithCaveat: false,
					winningVariations: [],
					winningVariation: undefined
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
		hasChanges = false;
	};

	const handleFormSubmit = (event: Event): void => {
		event.preventDefault();
		if (hasBasicInputs) {
			calculateResults();
		}
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
			? ((Number(conversions) / Number(visitors)) * 100).toFixed(2) + "%"
			: "0.00%"}
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
			<input
				type="text"
				bind:value={variantData.name}
				class="variant-input"
				aria-label="Variant name"
			/>
		</td>
		<td>
			<input
				type="text"
				bind:value={variantData.visitors}
				min="1"
				class="number-input"
				aria-label="Number of visitors"
				placeholder={visitorPlaceholder}
			/>
		</td>
		<td>
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
			{@render conversionRateDisplay(variantData.visitors, variantData.conversions)}
		</td>
		<td>
			{#if showRemoveButton && onRemove}
				<button
					type="button"
					class="button tiny alert hollow"
					onclick={onRemove}
					aria-label="Remove variant {variantData.name}"
				>
					❌
				</button>
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

<section>
	<div class="ab-testing-wrapper">
		<!-- Data Input Form -->
		<form onsubmit={handleFormSubmit}>
			<!-- Data Input Table using Foundation classes -->
			<div class="table-scroll">
				<table class="hover stack" aria-label="A/B test data input">
					<thead>
						<tr>
							<th>Variant</th>
							<th>Visitors</th>
							<th>Conversions</th>
							<th>Conversion Rate</th>
							<th></th>
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
								multiVariationResult?.winningVariations?.some(
									(w) => w.name === variationData.name
								) ||
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
								multiVariationResult?.winningVariations?.some((w) => w.name === variation.name) ||
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
					<div class="callout success">
						{#if comprehensiveResults.performanceGroups.length > 0}
							<div>
								{#each comprehensiveResults.performanceGroups as tier (tier.tier)}
									<div class="tier-group tier-{tier.tier}">
										<strong>{tier.label}</strong>
										<div class="tier-variants">
											{#each tier.variations as variation, i (variation.name)}
												<span class="variant-badge">
													{variation.name}: {(variation.conversionRate * 100).toFixed(2)}%
												</span>
												{#if i < tier.variations.length - 1},
												{/if}
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Business Insights -->
						{#if comprehensiveResults.insights.length > 0}
							<div class="business-insights">
								{#each comprehensiveResults.insights as insight, index (index)}
									<div
										class="insight callout {insight.type === 'success'
											? ''
											: insight.type === 'warning'
												? 'warning'
												: 'secondary'}"
									>
										<h6>{insight.title}</h6>
										<!-- eslint-disable-next-line svelte/no-at-html-tags -- Safe: insight.message is generated by generateBusinessInsights() with trusted content -->
										<p>{@html insight.message}</p>
										{#if insight.actionable}
											<p>
												<small
													><strong>Recommendation:</strong>
													{insight.actionable}</small
												>
											</p>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else if "overallTest" in results}
					<!-- Fallback Traditional Multi-variation Results -->
					<div class="callout {results.overallTest.isSignificant ? 'success' : 'secondary'}">
						<h4>
							{results.overallTest.isSignificant ? "✅ Significant result!" : "❌ Not significant"}
						</h4>
						{#if results.overallTest.isSignificant}
							<p>
								Your test found meaningful differences between your variants - at least one version
								is genuinely performing differently than the others.
							</p>
						{:else}
							<p>
								The differences you're seeing could just be random chance. When testing multiple
								variants together, we need stronger evidence to be confident in the results.
							</p>
							{#if multiVariationResult?.pairwiseComparisons.some((r: TwoProportionResult) => r.isSignificant)}
								<p>
									<small
										><strong>Note:</strong> While some individual comparisons might appear
										significant, the overall pattern isn't strong enough to declare clear winners
										when accounting for multiple testing. <!-- TODO: Link to resource explaining multiple comparison problem --></small
									>
								</p>
							{/if}
						{/if}
					</div>
				{:else}
					<!-- Two-proportion Results -->
					<div class="callout {results.isSignificant ? 'success' : 'secondary'}">
						<h4>
							{results.isSignificant ? "✅ Significant result!" : "❌ Not significant"}
						</h4>
						{#if results.isSignificant}
							<p>
								Variant {results.variation.name}'s conversion rate ({(
									results.variation.conversionRate * 100
								).toFixed(2)}%) was
								{#if results.improvement.relative !== null}
									<strong
										>{Math.abs(results.improvement.relative).toFixed(1)}% {results.improvement
											.relative > 0
											? "higher"
											: "lower"}</strong
									>
									than variant {results.control.name}'s conversion rate ({(
										results.control.conversionRate * 100
									).toFixed(2)}%). You can be {confidenceLevel * 100}% confident that variant {results
										.variation.name} will perform
									{results.improvement.relative > 0 ? "better" : "worse"} than variant
									{results.control.name}.
								{:else}
									significantly different from variant {results.control.name}'s conversion rate ({(
										results.control.conversionRate * 100
									).toFixed(2)}%). You can be {confidenceLevel * 100}% confident that variant {results
										.variation.name} will perform differently than variant {results.control.name}.
								{/if}
							</p>
						{:else}
							<p>
								The difference between variant <em>{results.variation.name}</em>
								({(results.variation.conversionRate * 100).toFixed(2)}%) and variant
								<em>{results.control.name}</em>
								({(results.control.conversionRate * 100).toFixed(2)}%) is not statistically
								significant.
							</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- How confident are we? -->
		{#if results}
			<details class="confidence-section">
				<summary>How much can you rely on these results?</summary>
				<div class="callout secondary">
					{#if "overallTest" in results}
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
												(c.control.name === lowerVariant.name &&
													c.variation.name === topVariant.name)
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
							<strong>Reliability</strong>
							{#if results.overallTest.isSignificant && hasStrongEvidence}
								Very confident. There's strong evidence of real differences between your variants,
								and we can reliably identify which ones are better.
							{:else if results.overallTest.isSignificant}
								Mixed confidence. We're confident that differences exist between your variants (p = {results
									.overallTest.pValue < 0.001
									? "<0.001"
									: results.overallTest.pValue.toFixed(4)}), but less confident about which specific
								variants are better.
							{:else}
								Uncertain. Any differences you see could be due to random chance when testing
								multiple variants together.
							{/if}
						</p>
						<p>
							<strong>Can you trust this result?</strong>
							{#if results.overallTest.isSignificant && hasStrongEvidence}
								Yes, you can confidently act on these results. Both overall differences and specific
								rankings are statistically reliable.
							{:else if results.overallTest.isSignificant}
								Proceed with caution. There are real differences between variants, but the specific
								rankings shown are less certain. Consider the groupings as rough guidance rather
								than definitive rankings.
							{:else}
								We'd recommend getting more data or simplifying to fewer variants before making
								decisions.
							{/if}
						</p>
					{:else}
						<p>
							<strong>Reliability</strong>
							{#if results.isSignificant}
								Very confident. There's only a {((1 - confidenceLevel) * 100).toFixed(0)}% chance
								this difference is due to random luck.
							{:else}
								Inconclusive — we can't determine if there's a meaningful difference with the
								current data.
							{/if}
						</p>
						<p>
							<strong>Can you trust this result?</strong>
							{#if results.isSignificant}
								Yes, you can act on this result. The change of {results.improvement.relative !==
								null
									? Math.abs(results.improvement.relative).toFixed(1) + "%"
									: "observed"} is statistically reliable.
							{:else}
								The data suggests these variants perform similarly. You can stick with the original
								or choose based on other factors (ease of implementation, brand alignment, etc.). If
								detecting small differences is critical, consider running a larger test.
							{/if}
						</p>
					{/if}

					<!-- Technical Details for Experts -->
					<details class="technical-details">
						<summary>Technical details</summary>
						<div class="technical-details-content">
							{#if "overallTest" in results}
								{@render statisticalMetric(
									"Chi-square statistic",
									results.overallTest.testStatistic.toFixed(2),
									`Measures how different your results are from what we'd expect if all variants performed equally. Values above 6 typically indicate strong evidence of real differences.`
								)}
								{@render statisticalMetric(
									"Degrees of freedom",
									(results.overallTest.degreesOfFreedom || 0).toString(),
									`Number of independent comparisons. With ${additionalVariations.length + 2} variants, we have ${results.overallTest.degreesOfFreedom || 0} degrees of freedom.`
								)}
								{@render statisticalMetric(
									"P-value",
									results.overallTest.pValue.toFixed(4),
									`Probability these differences are just random luck. ${results.overallTest.pValue < 0.001 ? "Very strong evidence of real differences" : results.overallTest.pValue < 0.01 ? "Strong evidence of real differences" : results.overallTest.pValue < 0.05 ? "Moderate evidence (meets typical 5% threshold)" : "Weak evidence - differences may be random"}.`
								)}
								{#if results.bonferroniCorrected}
									{@render statisticalMetric(
										"Multiple comparison adjustment",
										"Applied",
										"We used stricter criteria because multiple variants were tested together to avoid false discoveries"
									)}
								{/if}
							{:else}
								{@render statisticalMetric(
									"Relative improvement",
									results.improvement.relative !== null
										? (results.improvement.relative > 0 ? "+" : "") +
												results.improvement.relative.toFixed(1) +
												"%"
										: "N/A",
									"Percentage change in conversion rate from control to variation — how much better or worse your variation performed. Positive values indicate improvement, negative values indicate decline."
								)}
								{@render statisticalMetric(
									"P-value",
									results.pValue.toFixed(4),
									`Probability of observing this difference if there's no true effect. Think of it like a "doubt score" where lower numbers mean less doubt. Values below ${(1 - confidenceLevel).toFixed(2)} indicate statistical significance.`
								)}
								{@render statisticalMetric(
									"Confidence interval",
									`${results.improvement.confidenceInterval.lower.toFixed(1)}% to ${results.improvement.confidenceInterval.upper.toFixed(1)}%`,
									`${confidenceLevel * 100}% confidence interval for the true relative improvement — if you ran this test 100 times under identical conditions, the real impact would fall in this range ${confidenceLevel * 100} times. If this range doesn't cross 0% (like -0.3% to -0.1%), there's a meaningful effect. If it crosses 0% (like -0.5% to +0.2%), the effect might be zero.`
								)}
								{@render statisticalMetric(
									"Z-score",
									results.testStatistic.toFixed(2),
									"Measures how many standard deviations the observed difference is from zero. Higher numbers mean stronger evidence the difference is real (not just luck). At 95% confidence, values beyond ±1.96 correspond to p-values below 0.05 (the 5% significance threshold)."
								)}
							{/if}
						</div>
					</details>
				</div>
			</details>
		{/if}

		<!-- Advanced Settings -->
		<details class="advanced-settings">
			<summary>Advanced settings</summary>
			<div class="advanced-content">
				<label for="confidenceLevel">
					Confidence Level
					<select id="confidenceLevel" bind:value={confidenceLevel}>
						<option value={0.9}>90%</option>
						<option value={0.95}>95%</option>
						<option value={0.99}>99%</option>
					</select>
				</label>

				{#if hasChanges}
					<button type="button" class="button alert small" onclick={resetForm}>
						Reset all data
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
		overflow: hidden;
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

	.data-row td {
		padding: 1rem;
		vertical-align: middle;
	}

	.winner-row {
		background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
		border-left: 4px solid #28a745;
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

	.winner-row .conversion-rate {
		color: #28a745;
		font-size: 1.1em;
	}

	#confidenceLevel {
		width: fit-content;
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

	.winner-callout {
		background: #28a745;
		color: white;
		padding: 1rem;
		border-radius: 4px;
		margin-top: 1rem;
		text-align: center;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.stat-box {
		text-align: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6c757d;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.stat-value.positive {
		color: #28a745;
	}

	.stat-value.negative {
		color: #dc3545;
	}

	.tier-group {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 4px;
		border-left: 4px solid #ccc;
	}

	.tier-group.tier-1 {
		background: #d4edda;
		border-left-color: #28a745;
	}

	.tier-group.tier-2 {
		background: #fff3cd;
		border-left-color: #ffc107;
	}

	.tier-group.tier-3 {
		background: #f8d7da;
		border-left-color: #dc3545;
	}

	.tier-variants {
		margin-top: 0.5rem;
	}

	.variant-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 3px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Business Insights */
	.business-insights {
		margin-top: 1.5rem;
	}

	.business-insights .insight {
		margin-bottom: 1rem;
		padding: 1rem;
	}

	.business-insights .insight h6 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.business-insights .insight p {
		margin-bottom: 0.5rem;
	}

	.business-insights .insight p:last-child {
		margin-bottom: 0;
	}

	/* Fix contrast issues for small text in warning/alert contexts */
	.business-insights .insight.warning small,
	.callout.warning small {
		color: rgba(0, 0, 0, 0.7);
	}

	/* Confidence section styling */
	.confidence-section {
		margin-top: 1.5rem;
	}

	.confidence-section > summary {
		cursor: pointer;
		color: #6c757d;
		font-weight: 500;
	}

	.confidence-section .callout {
		margin-top: 0.5rem;
	}

	.callout p {
		font-weight: 400;
	}

	.technical-details {
		margin-top: 1.5rem;
		border-top: 1px solid #e9ecef;
		padding-top: 1rem;
	}

	.technical-details > summary {
		cursor: pointer;
		font-size: 0.875rem;
		color: white;
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
	@media screen and (max-width: 40em) {
		/* Make table responsive by allowing horizontal scroll */
		.table-scroll {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}

		/* Ensure table headers are visible and properly sized */
		thead th {
			padding: 0.75rem 0.5rem;
			font-size: 0.875rem;
			white-space: nowrap;
			min-width: 80px;
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

		/* Adjust stats grid for mobile */
		.stats-grid {
			grid-template-columns: 1fr 1fr;
			gap: 0.5rem;
		}

		.stat-box {
			padding: 0.75rem;
		}

		.stat-value {
			font-size: 1.25rem;
		}

		/* Better callout spacing on mobile */
		.callout {
			padding: 1rem;
			margin-bottom: 1rem;
		}

		.winner-callout {
			padding: 0.75rem;
			font-size: 0.875rem;
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
