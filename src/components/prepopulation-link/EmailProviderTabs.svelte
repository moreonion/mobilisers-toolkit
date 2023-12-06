<script lang="ts">
	import { emailMarketingProviders } from "@/data/prepopulation-link/emailMarketingTokens";
	import { prepopulationLinkStore } from "@/data/prepopulation-link/store";
</script>

<section>
	{#each emailMarketingProviders as provider}
		<button
			class:active={$prepopulationLinkStore.selectedEmailProvider === provider}
			on:click={() =>
				($prepopulationLinkStore.selectedEmailProvider = provider)}
		>
			{provider}
		</button>
	{/each}
</section>

<style>
	section {
		display: flex;
		column-gap: 0.5rem;
	}

	button {
		border: 1px solid transparent;
		border-bottom: 0;
		border-top-left-radius: 0.25rem;
		border-top-right-radius: 0.25rem;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		display: block;
		padding: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	button:hover {
		border-color: #e9ecef #e9ecef #dee2e6;
	}

	button.active {
		color: #495057;
		background-color: #fff;
		border-color: #dee2e6 #dee2e6 #fff;
		font-weight: 700;
	}
</style>
