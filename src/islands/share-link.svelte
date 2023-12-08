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
		WhatsAppInputText,
		TwitterInputHashtags,
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
		<p>Copy and paste them wherever you need them.</p>

		<div id="shareLinksWrapper">
			{#each $allShareLinks as { platform, shareLink }}
				<div
					class="shareLinkSection"
					id={platform.toLowerCase().replaceAll(" ", "-")}
				>
					<p class="mb-0"><strong>{platform}</strong></p>
					<p class="mb-0">{shareLink}</p>

					{#if platform === "Twitter"}
						<div class="mt-6">
							<label>
								<small
									>Enter template text (optional) (link already added)</small
								>
								<textarea
									id="twitterTextarea"
									maxlength="280"
									rows="3"
									bind:value={$TwitterParameters.text}
									placeholder="Enter more template text"
								></textarea>
							</label>
							<small>{$TwitterParameters.text.length} characters</small>
							<div class="hashtagTags mt-6">
								<label for="svelte-tags-input">
									<small
										>Type any hashtags (optional) – Enter to add a hashtag</small
									>
								</label>
								<Tags
									bind:tags={$TwitterInputHashtags}
									placeholder={"Enter any hashtags for your Twitter share..."}
									onlyUnique={true}
								/>
							</div>
						</div>
					{/if}

					{#if platform === "WhatsApp"}
						<label class="mt-6">
							<small>Add template text (link already added)</small>
							<textarea
								rows="3"
								bind:value={$WhatsAppInputText}
								placeholder="Enter template text for WhatsApp"
							></textarea>
						</label>
					{/if}

					{#if platform === "Email"}
						<div class="mt-6">
							<label>
								<small>Subject</small>
								<input
									type="text"
									bind:value={$EmailParameters.subject}
									placeholder="Add a subject line (optional)"
								/>
							</label>
							<label>
								<small>Body (link already added)</small>
								<textarea
									bind:value={$EmailParameters.body}
									placeholder="Add body text (optional)"
								></textarea>
							</label>
						</div>
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
		row-gap: 2.5rem;
		margin-top: 0.5rem;
		padding: 0.25rem 0.25rem;
	}

	.shareLinkSection {
		padding: 1rem;
		box-shadow: 0 0 5px #e6e6e6;
	}

	#shareLinksWrapper p {
		word-break: break-words;
	}
	#twitterTextarea {
		margin-bottom: 0;
	}
</style>
