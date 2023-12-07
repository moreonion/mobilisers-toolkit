<script lang="ts">
	import { emailMarketingProviders } from "@/data/prepopulation-link/emailMarketingTokens";
	import { prepopulationLinkStore } from "@/data/prepopulation-link/store";
</script>

<section id="tabsWrapper">
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
	#tabsWrapper {
		display: flex;
		flex-direction: column;
		column-gap: 0.5rem;
	}

	@media (min-width: 640px) {
		#tabsWrapper {
			flex-direction: row;
		}

		button {
			text-align: center;
		}
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
		text-align: left;
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
