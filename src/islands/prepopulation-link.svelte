<script lang="ts">
	import { onMount } from "svelte";
	import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
	import { isURL } from "@/functions/isURL";
	import { prepopulationLinkStore } from "@/data/prepopulation-link/store";
	import {
		emailMarketingProviders,
		emailMarketingTokens,
	} from "@/data/prepopulation-link/emailMarketingTokens";

	function updateAllTags() {
		// console.log("hi");
	}

	// We'll bind the current action URL on this page to this variable then keep it in the store if it's valid
	// let formActionURL = "";
	// For testing 👇
	let formActionURL = "https://act.your-organisation.org/campaign-name";

	$: formActionURLError = "";

	function handleActionURLFormSubmit() {
		if (isURL(formActionURL)) {
			$prepopulationLinkStore.actionPageURL = formActionURL;
		} else {
			formActionURLError = "Enter a valid URL";
		}
	}

	// Get any parameter called url from the URL and keep it in the store.
	// If no `url` parameter then clear any value from the store
	let urlParameter: string | null = null;

	onMount(() => {
		urlParameter = getURLSearchParameter("url");
		if (urlParameter && isURL(urlParameter)) {
			$prepopulationLinkStore.actionPageURL = urlParameter;
		}
	});
</script>

<section class="p-0">
	<form on:submit|preventDefault={handleActionURLFormSubmit}>
		<label
			for="actionPage"
			class="flex flex-col"
		>
			Enter your Impact Stack action URL <small
				>https://act.your-organisation.org/campaign-name</small
			>
		</label>
		<!-- svelte-ignore a11y-autofocus -->
		<!-- bind:value={$prepopulationLinkStore.actionPageURL} -->
		<input
			type="text"
			name="actionPage"
			id="actionPage"
			placeholder="Action page URL"
			on:keyup={updateAllTags}
			bind:value={formActionURL}
			autofocus
		/>

		{#if formActionURLError !== ""}
			<p>{formActionURLError}</p>
		{/if}

		<button
			class="button filled"
			type="submit">Next</button
		>
	</form>
</section>

{#if $prepopulationLinkStore.actionPageURL !== "" && isURL($prepopulationLinkStore.actionPageURL)}
	hi
{/if}
<!--
{#if $emailProvider !== "" && isURL($actionPageURL)}
	<section class="mt-12">
		<h2 class="text-xl mb-4">Select the fields you want to prefill</h2>
		<table class="table-fixed">
			<thead class="bg-slate-400 text-white">
				<tr class="text-left">
					<th class="table-cell max-w-[30px]">Prefill?</th>
					<th class="table-cell px-10 min-w-[200px]">Label</th>
					<th class="table-cell px-10 min-w-[200px]">Form Key</th>
					<th class="table-cell pr-10 text-left">Tag</th>
				</tr>
			</thead>
			<tbody>
				{#each $formFields as field, index}
					<tr class="">
						<td class="text-left">
							<input
								type="checkbox"
								bind:checked={field.prefilled}
							/>
						</td>
						<td class="px-10 text-left">
							{field.label}
						</td>
						<td class="px-10 text-left">
							{#if field.label === "Custom field"}
								<input
									type="text"
									id="customFormKeyInput"
									on:keyup={updateFormFieldsWithCustomField(field, index)}
								/>
							{:else}
								{field.formKey}
							{/if}
						</td>
						<td class="text-left">
							<input
								type="text"
								value={field.tag || ""}
								on:keyup={updateFormFieldsTag(field)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<section class="flex flex-col gap-6 justify-between mt-4">
			<AddNewFieldButton />
			<ScrapeButton />
		</section>
	</section>
{/if} -->
