<script lang="ts">
	import { isDevMode } from "@/utils/dev-mode";
	import {
		twoVariationPresets,
		multiVariationPresets,
		type TestPreset
	} from "@/functions/ab-testing/test-presets";

	interface Props {
		onPresetLoad: (preset: TestPreset) => void;
	}

	let { onPresetLoad }: Props = $props();

	const showDevControls = $derived(isDevMode());
</script>

{#if showDevControls}
	<div
		class="dev-presets callout secondary"
		role="region"
		aria-label="Development mode test presets"
	>
		<details class="preset-section">
			<summary class="preset-summary">🔧 Development Mode: Load Test Data</summary>

			<div class="preset-content">
				<p>
					<small>Quick test scenarios to fill the form with realistic data</small>
				</p>

				<!-- Two-Variation Presets -->
				<div class="preset-group">
					<h6>Two-Variation Tests (A/B)</h6>
					<div class="preset-buttons">
						{#each twoVariationPresets as preset (preset.name)}
							<button
								type="button"
								class="button tiny secondary"
								onclick={() => onPresetLoad(preset)}
								title={preset.description}
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Multi-Variation Presets -->
				<div class="preset-group">
					<h6>Multi-Variation Tests (A/B/C+)</h6>
					<div class="preset-buttons">
						{#each multiVariationPresets as preset (preset.name)}
							<button
								type="button"
								class="button tiny secondary"
								onclick={() => onPresetLoad(preset)}
								title={preset.description}
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</details>
	</div>
{/if}

<style>
	/* Dev mode preset controls */
	.dev-presets {
		margin-bottom: 1.5rem;
		border: 2px dashed #ffc107;
		background: #fff3cd;
	}

	.preset-section {
		margin: 0;
	}

	.preset-summary {
		cursor: pointer;
		font-weight: 600;
		color: #856404;
		margin: 0;
		padding: 0.5rem 0;
	}

	.preset-content {
		padding: 1rem 0 0.5rem 0;
	}

	.preset-group {
		margin-bottom: 1.5rem;
	}

	.preset-group:last-child {
		margin-bottom: 0;
	}

	.preset-group h6 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #495057;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.preset-content small {
		color: #000;
	}

	.preset-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.preset-buttons .button.tiny {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		margin: 0;
		white-space: nowrap;
		border: 1px solid #6c757d;
		background: white;
		color: #495057;
		transition: all 0.2s ease;
	}

	.preset-buttons .button.tiny:hover {
		background: #f8f9fa;
		border-color: #495057;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.preset-buttons .button.tiny:active {
		transform: translateY(0);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Responsive adjustments */
	@media screen and (max-width: 40em) {
		.preset-buttons {
			gap: 0.25rem;
		}

		.preset-buttons .button.tiny {
			font-size: 0.7rem;
			padding: 0.25rem 0.5rem;
		}

		.preset-group {
			margin-bottom: 1rem;
		}

		.preset-content {
			padding: 0.75rem 0 0.25rem 0;
		}
	}
</style>
