<script lang="ts">
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
	import { isURL } from "@/functions/isURL";
	import {
		prepopulationLinkStore,
		customiseFields,
	} from "@/data/prepopulation-link/store";

	import PrefillLink from "@/components/prepopulation-link/PrefillLink.svelte";
	import FieldSelector from "@/components/prepopulation-link/FieldSelector.svelte";

	// For testing 👇
	// onMount(() => {
	// 	let formActionURL = "https://act.your-organisation.org/campaign-name";
	// 	$prepopulationLinkStore.actionPageURL = formActionURL;
	// });

	// Get any parameter called url from the URL and keep it in the store.
	let urlParameter: string | null = null;

	onMount(() => {
		urlParameter = getURLSearchParameter("url");
		if (urlParameter && isURL(urlParameter)) {
			$prepopulationLinkStore.actionPageURL = urlParameter;
		}
	});
</script>

<section>
	<form>
		<label
			for="actionPage"
			class="flex flex-col"
		>
			Enter your Impact Stack action URL <small
				>https://act.your-organisation.org/campaign-name</small
			>
		</label>
		<!-- svelte-ignore a11y-autofocus -->
		<input
			type="text"
			name="actionPage"
			id="actionPage"
			placeholder="Action page URL"
			bind:value={$prepopulationLinkStore.actionPageURL}
			autofocus
		/>
	</form>
</section>

{#if $prepopulationLinkStore.actionPageURL !== "" && isURL($prepopulationLinkStore.actionPageURL)}
	<div in:fade={{ delay: 100 }}>
		<PrefillLink />
	</div>
	{#if $customiseFields === false && $prepopulationLinkStore.selectedEmailProvider !== "Other"}
		<div class="mt-6 pt-2">
			<button
				class="button tiny"
				on:click={() => ($customiseFields = true)}>Customise fields</button
			>
		</div>
	{/if}
{/if}

{#if ($customiseFields === true || $prepopulationLinkStore.selectedEmailProvider === "Other") && $prepopulationLinkStore.actionPageURL !== "" && isURL($prepopulationLinkStore.actionPageURL)}
	<div in:fade={{ delay: 100 }}>
		<FieldSelector />
	</div>
	<PrefillLink />
{/if}
