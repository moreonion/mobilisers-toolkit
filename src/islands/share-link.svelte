<script lang="ts">
	import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
	import { isURL } from "@/functions/isURL";
	import { onMount } from "svelte";
	import { LinkToShare, allShareLinks } from "@/data/share-link/store";

	// For testing 👇
	onMount(() => {
		let link = "https://act.your-organisation.org/campaign-name";
		$LinkToShare = link;
	});

	// Get any parameter called url from the URL and keep it in the store.
	// If no `url` parameter then clear any value from the store
	let urlParameter: string | null = null;

	onMount(() => {
		urlParameter = getURLSearchParameter("url");
		if (urlParameter && isURL(urlParameter)) {
			$LinkToShare = urlParameter;
		}
	});
</script>

<section>
	<form>
		<label
			for="actionPage"
			class="flex flex-col"
		>
			Enter the link you want to be shareable <small
				>https://act.your-organisation.org/campaign-name</small
			>
		</label>
		<!-- svelte-ignore a11y-autofocus -->
		<input
			type="text"
			name="actionPage"
			id="actionPage"
			placeholder="Link to share"
			bind:value={$LinkToShare}
			autofocus
		/>
	</form>
</section>

{#if $LinkToShare !== "" && isURL($LinkToShare)}
	<section class="mt-6">
		<p class="h5 mb-0">Here are the share links</p>

		<div id="prefillLinkWrapper">
			<!-- <EmailProviderTabs /> -->

			{#each Object.entries($allShareLinks) as [SharePlatform, ShareLink]}
				<p><strong>{SharePlatform}</strong></p>
				<p>{ShareLink}</p>
			{/each}
		</div>
	</section>
{/if}

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
