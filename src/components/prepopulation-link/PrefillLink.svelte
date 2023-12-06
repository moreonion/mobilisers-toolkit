<script lang="ts">
	import {
		prepopulationLinkStore,
		prefillFormFields,
	} from "@/data/prepopulation-link/store";

	let prefillLinkParts = "";
	let prefillLinkPartsArray: string[] = [];

	let checked = [];

	$: {
		checked = $prefillFormFields.filter((field) => {
			return field.prefilled;
		});

		prefillLinkPartsArray = checked
			.filter((field) => field.formKey !== "" && field.token !== "")
			.map((field) => `${field.formKey}=${field.token}`);

		prefillLinkParts = prefillLinkPartsArray.join("&");
	}
</script>

<section>
	<p class="h5">
		Here's your prefill link
		{#if $prepopulationLinkStore.selectedEmailProvider !== "Other" && $prepopulationLinkStore.selectedEmailProvider !== ""}
			to drop into {$prepopulationLinkStore.selectedEmailProvider}
		{/if}
	</p>
	<div>
		<p style="word-break: break-all;">
			{`${$prepopulationLinkStore.actionPageURL}#p:${prefillLinkParts}`}
		</p>
	</div>
</section>
