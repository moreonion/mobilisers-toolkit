<script lang="ts">
	import {
		prepopulationLinkStore,
		prefillFormFields,
	} from "@/data/prepopulation-link/store";
	import Tabs from "@/components/prepopulation-link/EmailProviderTabs.svelte";

	let prefillLinkParts: string[] = [];

	let checked = [];

	$: {
		checked = $prefillFormFields.filter((field) => {
			return field.prefilled;
		});

		prefillLinkParts = checked
			.filter((field) => field.formKey !== "" && field.token !== "")
			.map((field) => `${field.formKey}=${field.token}`);
	}
</script>

<section class="mt-6">
	<p class="h5 mb-0">Here's your prefill link</p>
	<div id="prefillLinkWrapper">
		<Tabs />

		<!-- prettier-ignore -->
		<p class="mb-0">
			{$prepopulationLinkStore.actionPageURL}#p:<wbr/>{#each prefillLinkParts as part, index}<span>{part}</span>{#if index < prefillLinkParts.length - 1}&<wbr/>{/if}{/each}
		</p>
	</div>
</section>

<style>
	#prefillLinkWrapper {
		margin-top: 0.5rem;
		border: 1px solid #495057;
		border-radius: 5px;
		padding: 0.25rem 0.25rem;
	}

	#prefillLinkWrapper p {
		padding: 1rem;
		word-break: break-words;
		line-height: 1.75;
	}
	#prefillLinkWrapper p span {
		font-weight: 400;
		text-decoration: underline;
		text-underline-offset: 8px;
		text-decoration-thickness: 2px;
	}
</style>
