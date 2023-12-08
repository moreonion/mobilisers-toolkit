<script lang="ts">
	import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
	import { isURL } from "@/functions/isURL";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";

	import {
		LinkToShare,
		allShareLinks,
		TwitterParameters,
		EmailParameters,
		InputHashtags,
	} from "@/data/share-link/store";

	import Tags from "svelte-tags-input";

	// For testing 👇
	// onMount(() => {
	// 	let link = "https://act.your-organisation.org/campaign-name";
	// 	$LinkToShare = link;
	// });

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
			placeholder="Enter the link you want people to share"
			bind:value={$LinkToShare}
			autofocus
		/>
	</form>
</section>

{#if $LinkToShare !== "" && isURL($LinkToShare)}
	<section
		class="mt-6"
		in:fade={{ delay: 100 }}
	>
		<p class="h5 mb-0">Here are the share links</p>

		<div id="shareLinksWrapper">
			{#each $allShareLinks as { platform, shareLink }}
				<div>
					<p class="mb-0"><strong>{platform}</strong></p>
					<p>{shareLink}</p>

					{#if platform === "Twitter"}
						<label>
							<small
								>Template text: {$TwitterParameters.text.length} characters</small
							>
							<textarea
								maxlength="280"
								rows="3"
								bind:value={$TwitterParameters.text}
							></textarea>
						</label>
						<div class="hashtagTags">
							<label for="svelte-tags-input">
								<small>Type any hashtags (Enter to add a hashtag)</small>
							</label>
							<Tags
								bind:tags={$InputHashtags}
								placeholder={"Enter any hashtags for your Twitter share..."}
								onlyUnique={true}
							/>
						</div>
					{/if}

					{#if platform === "Email"}
						<label>
							<small>Subject</small>
							<input
								type="text"
								bind:value={$EmailParameters.subject}
							/>
						</label>
						<label>
							<small>Body (Link already added)</small>
							<textarea bind:value={$EmailParameters.body}></textarea>
						</label>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.hashtagTags :global(div.svelte-tags-input-layout) {
		border: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
	}
	.hashtagTags :global(div.svelte-tags-input-layout:hover) {
		border: none;
	}
	.hashtagTags :global(div.svelte-tags-input-layout:focus-within) {
		outline: none;
	}
	.hashtagTags :global(input.svelte-tags-input) {
		flex: 1 0 100%;
		height: auto;
		font-size: 100%;
		font-family: ingra, sans-serif;
		border-radius: 0;
		border: 2px solid #2f2f2f;
		margin-bottom: 0.75rem;
		padding: 0.625rem;
	}

	.hashtagTags :global(input.svelte-tags-input::placeholder) {
		font-weight: 700;
	}

	.hashtagTags :global(input.svelte-tags-input:focus) {
		border: 2px solid #90c92a;
		-webkit-box-shadow: 0 0 2px #b8e16e;
		box-shadow: 0 0 2px #b8e16e;
	}
	.hashtagTags :global(div.svelte-tags-input-layout label) {
		font-size: 80%;
		font-weight: 700;
		font-family: inherit;
	}

	.hashtagTags :global(button.svelte-tags-input-tag) {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background-color: #90c92a;
		font-family: inherit;
		font-size: 80%;
		font-weight: 700;
	}

	.hashtagTags
		:global(button.svelte-tags-input-tag span.svelte-tags-input-tag-remove) {
		margin: 0;
		padding-left: 1rem;
		font-size: 22px;
	}

	#shareLinksWrapper {
		display: flex;
		flex-direction: column;
		row-gap: 2rem;
		margin-top: 0.5rem;
		border: 1px solid #495057;
		border-radius: 5px;
		padding: 0.25rem 0.25rem;
	}

	#shareLinksWrapper p {
		word-break: break-words;
	}
</style>
