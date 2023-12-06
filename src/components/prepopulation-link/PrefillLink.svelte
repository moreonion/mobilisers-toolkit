<script lang="ts">
	import {
		prepopulationLinkStore,
		prefillFormFields,
	} from "@/data/prepopulation-link/store";
	import Tags from "@/components/prepopulation-link/Tags.svelte";

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
		<Tags />

		<!-- prettier-ignore -->
		<p class="mb-0">
			{$prepopulationLinkStore.actionPageURL}#p:<wbr/>{#each prefillLinkParts as part, i}<span>{part}</span>{#if i < prefillLinkParts.length - 1}&<wbr/>{/if}{/each}
		</p>
	</div>
</section>

<style>
	#prefillLinkWrapper {
		padding: 1rem 0;
	}

	#prefillLinkWrapper p {
		padding: 1rem;
		word-break: break-words;
	}
	#prefillLinkWrapper p span {
		font-weight: 400;
		text-decoration: underline;
		text-underline-offset: 6px;
	}
</style>
