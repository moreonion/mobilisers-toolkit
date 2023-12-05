<script lang="ts">
	import { onMount } from "svelte";
	import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
	import { isURL } from "@/functions/isURL";
	import { prepopulationLinkStore } from "@/data/prepopulation-link/store";

	import PrefillLink from "@/components/prepopulation-link/PrefillLink.svelte";
	import FieldSelector from "@/components/prepopulation-link/FieldSelector.svelte";

	function updateAllTags() {
		// console.log("hi");
	}

	// We'll bind the current action URL on this page to this variable then keep it in the store if it's valid
	// let formActionURL = "";
	// For testing 👇
	let formActionURL = "https://act.your-organisation.org/campaign-name";

	$: formActionURLError = "";

	let customiseFields = true;

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

<section>
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
	<PrefillLink />
{/if}

{#if customiseFields === true && $prepopulationLinkStore.actionPageURL !== "" && isURL($prepopulationLinkStore.actionPageURL)}
	<FieldSelector />
{/if}
