<script lang="ts">
	import { onMount } from "svelte";
	import {
		prefillFormFields,
		prepopulationLinkStore,
	} from "@/data/prepopulation-link/store";
	import { emailMarketingProviders } from "@/data/prepopulation-link/emailMarketingTokens";

	import { activateTokenSync } from "@/functions/prepopulation-link/activateTokenSync";

	onMount(() => {
		activateTokenSync(prepopulationLinkStore, prefillFormFields);
	});
</script>

<section>
	<!-- {#if $prepopulationLinkStore.selectedEmailProvider === ""}{:else}
		<p>
			Selected email provider: <span
				>{$prepopulationLinkStore.selectedEmailProvider}</span
			>
		</p>
	{/if} -->
	<p class="h4">Select your email marketing tool</p>

	<select bind:value={$prepopulationLinkStore.selectedEmailProvider}>
		<option value="">-- Select your tool --</option>

		{#each emailMarketingProviders as provider}
			<option value={provider}>
				{provider}
			</option>
		{/each}
	</select>
</section>
