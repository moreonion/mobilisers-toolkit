<script lang="ts">
  import { fade } from "svelte/transition";
  import {
    twoProportionTest,
    formatTwoProportionData,
    chiSquareTest,
    pairwiseComparisons,
  } from "@/functions/ab-testing/statistical-tests";
  import { bonferroniCorrection } from "@/functions/ab-testing/bonferroni";
  import { testVariationSchema } from "@/functions/ab-testing/validation";
  import type { TestVariation } from "@/types/ab-testing";
  import type {
    TwoProportionResult,
    MultiVariationResult,
    ValidationError,
  } from "@/types/statistical-results";

  // State management using Svelte 5 runes
  let controlData = $state({ name: "A", visitors: 0, conversions: 0 });
  let variationData = $state({ name: "B", visitors: 0, conversions: 0 });
  let additionalVariations = $state<TestVariation[]>([]);
  let confidenceLevel = $state(0.95);
  let results = $state<TwoProportionResult | MultiVariationResult | null>(null);
  let validationErrors = $state<ValidationError[]>([]);

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

  // Helper for checking if winners are tied
  const areWinnersTied = $derived(
    multiVariationResult?.winningVariations && multiVariationResult.winningVariations.length > 1
      ? multiVariationResult.winningVariations.every(w => 
          Math.abs(w.improvement - multiVariationResult.winningVariations![0].improvement) < 0.1
        )
      : false
  );

  const calculateResults = (): void => {
    validationErrors = [];

    try {
      // Convert string inputs to numbers for validation and calculation
      const normalizedControlData = {
        name: controlData.name,
        visitors: Number(controlData.visitors) || 0,
        conversions: Number(controlData.conversions) || 0,
      };

      const normalizedVariationData = {
        name: variationData.name,
        visitors: Number(variationData.visitors) || 0,
        conversions: Number(variationData.conversions) || 0,
      };

      const normalizedAdditionalVariations = additionalVariations.map(
        (variation) => ({
          name: variation.name,
          visitors: Number(variation.visitors) || 0,
          conversions: Number(variation.conversions) || 0,
        })
      );

      // Validate control data
      const controlValidation = testVariationSchema.safeParse(
        normalizedControlData
      );
      if (!controlValidation.success) {
        validationErrors.push(
          ...controlValidation.error.errors.map((err) => ({
            field: `control.${err.path.join(".")}`,
            message: err.message,
            code: err.code,
          }))
        );
      }

      // Validate variation data
      const variationValidation = testVariationSchema.safeParse(
        normalizedVariationData
      );
      if (!variationValidation.success) {
        validationErrors.push(
          ...variationValidation.error.errors.map((err) => ({
            field: `variation.${err.path.join(".")}`,
            message: err.message,
            code: err.code,
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
              code: err.code,
            }))
          );
        }
      });

      if (validationErrors.length > 0) {
        return;
      }

      if (isMultiVariation) {
        // Multi-variation test (3+ groups)
        const allVariations = [
          normalizedControlData,
          normalizedVariationData,
          ...normalizedAdditionalVariations,
        ];
        const overallTest = chiSquareTest(allVariations, confidenceLevel);
        const pairwise = pairwiseComparisons(allVariations, confidenceLevel);

        // Apply Bonferroni correction for multiple comparisons
        const correctedResults = bonferroniCorrection(
          pairwise.map((result) => result.pValue),
          1 - confidenceLevel
        );

        // Update significance based on corrected p-values
        const correctedPairwise = pairwise.map((result, index) => ({
          ...result,
          isSignificant: correctedResults[index].isSignificant,
          pValue: correctedResults[index].correctedPValue,
        }));

        // Find all winning variations (significantly better than control)
        const winners = correctedPairwise.filter(
          (result) =>
            result.isSignificant &&
            result.improvement.relative !== null &&
            result.improvement.relative > 0
        );

        // Determine the best winner(s) - those with highest improvement
        let bestWinners: TwoProportionResult[] = [];
        if (winners.length > 0) {
          const maxImprovement = Math.max(...winners.map(w => w.improvement.relative!));
          bestWinners = winners.filter(w => w.improvement.relative === maxImprovement);
        }

        results = {
          overallTest,
          pairwiseComparisons: correctedPairwise,
          bonferroniCorrected: true,
          bonferroniAlpha: correctedResults[0].correctedAlpha,
          winningVariations: bestWinners.map(winner => ({
            name: winner.variation.name,
            conversionRate: winner.variation.conversionRate,
            improvement: winner.improvement.relative!,
          })),
          // Keep single winner for backwards compatibility (use first best winner)
          winningVariation: bestWinners.length > 0
            ? {
                name: bestWinners[0].variation.name,
                conversionRate: bestWinners[0].variation.conversionRate,
                improvement: bestWinners[0].improvement.relative!,
              }
            : undefined,
        };
      } else {
        // Two-proportion test
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
    } catch (error) {
      validationErrors = [
        {
          field: "calculation",
          message:
            "There was an error calculating your results. Please check your data and try again.",
          code: "CALCULATION_ERROR",
        },
      ];
    }
  };

  const getNextVariationName = (): string => {
    // Get all existing names
    const existingNames = [
      controlData.name,
      variationData.name,
      ...additionalVariations.map((v) => v.name),
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
        conversions: 0,
      },
    ];
  };

  const removeVariation = (index: number): void => {
    additionalVariations = additionalVariations.filter((_, i) => i !== index);
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
    }
  };

  const resetForm = (): void => {
    results = null;
    controlData = { name: "A", visitors: 0, conversions: 0 };
    variationData = { name: "B", visitors: 0, conversions: 0 };
    additionalVariations = [];
    confidenceLevel = 0.95;
    validationErrors = [];
  };
</script>

<section>
  <div class="ab-testing-wrapper">
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
          <tr class="data-row">
            <td>
              <input
                type="text"
                bind:value={controlData.name}
                class="variant-input"
                aria-label="Variant name"
              />
            </td>
            <td>
              <input
                type="text"
                bind:value={controlData.visitors}
                min="1"
                class="number-input"
                aria-label="Number of visitors"
                placeholder="e.g. 50000"
              />
            </td>
            <td>
              <input
                type="text"
                bind:value={controlData.conversions}
                min="0"
                max={controlData.visitors}
                class="number-input"
                aria-label="Number of conversions"
                placeholder="e.g. 500"
              />
            </td>
            <td class="conversion-rate-cell">
              <span class="conversion-rate">
                {Number(controlData.visitors) > 0
                  ? (
                      (Number(controlData.conversions) /
                        Number(controlData.visitors)) *
                      100
                    ).toFixed(2) + "%"
                  : "0.00%"}
              </span>
            </td>
            <td>
              {#if additionalVariations.length > 0}
                <button
                  type="button"
                  class="button tiny alert hollow"
                  onclick={removeControl}
                  aria-label="Remove variant {controlData.name}"
                >
                  ❌
                </button>
              {/if}
            </td>
          </tr>

          <!-- Variation Row -->
          <tr
            class="data-row"
            class:winner-row={twoProportionResult &&
              twoProportionResult.isSignificant &&
              twoProportionResult.improvement.relative !== null &&
              twoProportionResult.improvement.relative > 0 ||
              (multiVariationResult?.winningVariations?.some(w => w.name === variationData.name))}
          >
            <td>
              <input
                type="text"
                bind:value={variationData.name}
                class="variant-input"
                aria-label="Variant name"
              />
            </td>
            <td>
              <input
                type="text"
                bind:value={variationData.visitors}
                min="1"
                class="number-input"
                aria-label="Number of visitors"
                placeholder="e.g. 50000"
              />
            </td>
            <td>
              <input
                type="text"
                bind:value={variationData.conversions}
                min="0"
                max={variationData.visitors}
                class="number-input"
                aria-label="Number of conversions"
                placeholder="e.g. 570"
              />
            </td>
            <td class="conversion-rate-cell">
              <span class="conversion-rate">
                {Number(variationData.visitors) > 0
                  ? (
                      (Number(variationData.conversions) /
                        Number(variationData.visitors)) *
                      100
                    ).toFixed(2) + "%"
                  : "0.00%"}
              </span>
            </td>
            <td>
              {#if additionalVariations.length > 0}
                <button
                  type="button"
                  class="button tiny alert hollow"
                  onclick={removeVariation1}
                  aria-label="Remove variant {variationData.name}"
                >
                  ❌
                </button>
              {/if}
            </td>
          </tr>

          <!-- Additional Variations -->
          {#each additionalVariations as variation, index}
            <tr
              class="data-row"
              class:winner-row={multiVariationResult?.winningVariations?.some(w => w.name === variation.name)}
            >
              <td>
                <input
                  type="text"
                  bind:value={variation.name}
                  class="variant-input"
                  aria-label="Variant name"
                />
              </td>
              <td>
                <input
                  type="text"
                  bind:value={variation.visitors}
                  min="1"
                  class="number-input"
                  aria-label="Number of visitors"
                  placeholder="e.g. 50000"
                />
              </td>
              <td>
                <input
                  type="text"
                  bind:value={variation.conversions}
                  min="0"
                  max={variation.visitors}
                  class="number-input"
                  aria-label="Number of conversions"
                  placeholder="e.g. 550"
                />
              </td>
              <td class="conversion-rate-cell">
                <span class="conversion-rate">
                  {Number(variation.visitors) > 0
                    ? (
                        (Number(variation.conversions) /
                          Number(variation.visitors)) *
                        100
                      ).toFixed(2) + "%"
                    : "0.00%"}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  class="button tiny alert hollow"
                  onclick={() => removeVariation(index)}
                  aria-label="Remove variant {variation.name}"
                >
                  ❌
                </button>
              </td>
            </tr>
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
        <button type="button" class="button" onclick={calculateResults}>
          Calculate
        </button>
      {/if}
    </div>

    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div class="callout alert" role="alert">
        <ul>
          {#each validationErrors as error}
            <li>{error.message}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Results Display -->
    {#if results}
      <div
        class="results-wrapper"
        in:fade={{ delay: 100 }}
        role="region"
        aria-label="Test results"
      >
        {#if "overallTest" in results}
          <!-- Multi-variation Results -->
          <div
            class="callout {results.overallTest.isSignificant
              ? 'success'
              : 'secondary'}"
          >
            <h4>
              {results.overallTest.isSignificant
                ? "✅ Significant result!"
                : "❌ Not significant"}
            </h4>
            {#if results.overallTest.isSignificant}
              <p>
                Your test found meaningful differences between your variants - at least one version is genuinely performing differently than the others.
              </p>
            {:else}
              <p>The differences you're seeing could just be random chance. None of your variants are performing significantly better or worse than the others.</p>
            {/if}

            {#if multiVariationResult?.winningVariations && multiVariationResult.winningVariations.length > 0}
              <div class="winner-callout">
                {#if multiVariationResult.winningVariations.length === 1}
                  <strong>🏆 Clear Winner: Variant {multiVariationResult.winningVariations[0].name}</strong><br />
                  {(multiVariationResult.winningVariations[0].conversionRate * 100).toFixed(2)}%
                  conversion rate (+{multiVariationResult.winningVariations[0].improvement.toFixed(1)}% improvement)
                {:else}
                  {#if areWinnersTied}
                    <strong>🤝 Statistical Tie: {multiVariationResult.winningVariations.length} equally strong performers</strong><br />
                    <small style="color: rgba(255,255,255,0.9);">These variants have virtually identical performance - you can confidently choose any of them:</small><br />
                  {:else}
                    <strong>🥇 Multiple Winners: {multiVariationResult.winningVariations.length} top performers</strong><br />
                    <small style="color: rgba(255,255,255,0.9);">All of these variants significantly outperform your control:</small><br />
                  {/if}
                  {#each multiVariationResult.winningVariations as winner, i}
                    Variant {winner.name}: {(winner.conversionRate * 100).toFixed(2)}% 
                    (+{winner.improvement.toFixed(1)}% improvement)
                    {#if i < multiVariationResult.winningVariations.length - 1}<br />{/if}
                  {/each}
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Two-proportion Results -->
          <div
            class="callout {results.isSignificant ? 'success' : 'secondary'}"
          >
            <h4>
              {results.isSignificant
                ? "✅ Significant result!"
                : "❌ Not significant"}
            </h4>
            {#if results.isSignificant}
              <p>
                Variant {results.variation.name}'s conversion rate ({(
                  results.variation.conversionRate * 100
                ).toFixed(2)}%) was
                {#if results.improvement.relative !== null}
                  <strong
                    >{Math.abs(results.improvement.relative).toFixed(1)}% {results
                      .improvement.relative > 0
                      ? "higher"
                      : "lower"}</strong
                  >
                  than variant {results.control.name}'s conversion rate ({(
                    results.control.conversionRate * 100
                  ).toFixed(2)}%). You can be {confidenceLevel * 100}% confident
                  that variant {results.variation.name} will perform
                  {results.improvement.relative > 0 ? "better" : "worse"} than variant
                  {results.control.name}.
                {:else}
                  significantly different from variant {results.control.name}'s
                  conversion rate ({(
                    results.control.conversionRate * 100
                  ).toFixed(2)}%). You can be {confidenceLevel * 100}% confident
                  that variant {results.variation.name} will perform differently
                  than variant {results.control.name}.
                {/if}
              </p>
            {:else}
              <p>
                The difference between variant {results.variation.name} ({(
                  results.variation.conversionRate * 100
                ).toFixed(2)}%) and variant {results.control.name} ({(
                  results.control.conversionRate * 100
                ).toFixed(2)}%) is not statistically significant.
              </p>
            {/if}

            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-label">Improvement</div>
                <div
                  class="stat-value {results.improvement.relative !== null &&
                  results.improvement.relative > 0
                    ? 'positive'
                    : results.improvement.relative !== null
                      ? 'negative'
                      : ''}"
                >
                  {#if results.improvement.relative !== null}
                    {results.improvement.relative > 0
                      ? "+"
                      : ""}{results.improvement.relative.toFixed(1)}%
                  {:else}
                    N/A
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
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

        {#if results}
          <div class="callout secondary">
            <h5>Statistical Details</h5>
            {#if "overallTest" in results}
              <p>
                <strong>Test strength:</strong>
                {results.overallTest.testStatistic.toFixed(2)}
                <small style="display: block; color: #6c757d;">Higher numbers mean stronger evidence of real differences</small>
              </p>
              <p>
                <strong>Data points analysed:</strong>
                {results.overallTest.degreesOfFreedom}
                <small style="display: block; color: #6c757d;">More data points generally mean more reliable results</small>
              </p>
              <p>
                <strong>Overall confidence score:</strong>
                {results.overallTest.pValue.toFixed(4)}
                <small style="display: block; color: #6c757d;">Lower numbers mean we're more confident in the results</small>
              </p>
              {#if results.bonferroniCorrected}
                <p>
                  <strong>Multiple comparison adjustment:</strong> Applied
                  <small style="display: block; color: #6c757d;">We used stricter criteria because multiple variants were tested together</small>
                </p>
              {/if}
            {:else}
              <p>
                <strong>Confidence score:</strong>
                {results.pValue.toFixed(4)}
                <small style="display: block; color: #6c757d; margin-top: 0.25rem;">
                  Lower numbers indicate stronger evidence. Values below {(1 - confidenceLevel).toFixed(2)} are considered reliable.
                </small>
              </p>
              <p>
                <strong>Expected improvement range:</strong>
                {results.improvement.confidenceInterval.lower.toFixed(1)}% to {results.improvement.confidenceInterval.upper.toFixed(
                  1
                )}%
                <small style="display: block; color: #6c757d;">We're {confidenceLevel * 100}% confident the true improvement falls within this range</small>
              </p>
              
              <details style="margin-top: 1rem;">
                <summary style="cursor: pointer; color: #6c757d; font-size: 0.875rem;">Show additional technical details</summary>
                <p style="margin-top: 0.5rem;">
                  <strong>Test statistic:</strong>
                  {results.testStatistic.toFixed(2)}
                  <small style="display: block; color: #6c757d;">Statistical measure of difference strength</small>
                </p>
              </details>
            {/if}
          </div>
        {/if}

        <button type="button" class="button alert small" onclick={resetForm}>
          Reset all data
        </button>
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
    width: 100%;
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
