<script lang="ts">
	import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
	import { isURL } from "@/functions/isURL";
	import { fade } from "svelte/transition";

	import { getOutputLinkToTrack, utmFormData } from "@/data/tracking-link/store.svelte";

	// For testing 👇
	// $effect(() => {
	// 	let link = "https://act.your-organisation.org/campaign-name";
	// 	utmFormData.LinkToTrack = link;
	// });

	$effect(() => {
		const urlParameter = getURLSearchParameter("url");

		if (urlParameter !== null && isURL(urlParameter)) {
			utmFormData.LinkToTrack = urlParameter;
		}
	});
</script>

<section>
	<form id="trackingLinkForm">
		<label for="trackingLink" class="flex flex-col">
			Enter the link you want to add tracking to <small
				>https://act.your-organisation.org/campaign-name</small
			>
		</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			name="trackingLink"
			id="trackingLink"
			placeholder="Enter the link you want to add tracking to"
			bind:value={utmFormData.LinkToTrack}
			autofocus
		/>

		{#if utmFormData.LinkToTrack !== ""}
			<!-- {#if $utmFormData.LinkToTrack !== "" && isURL($utmFormData.LinkToTrack)} -->
			<section class="mt-6" in:fade={{ delay: 100 }}>
				<p class="h5 mb-0">Build your tracking link using the form below</p>
				<p>The link will automatically update as you fill in the form</p>

				<div id="trackingLinkWrapper">
					<p>{getOutputLinkToTrack()}</p>
				</div>
			</section>
		{/if}

		{#if utmFormData.LinkToTrack !== ""}
			<!-- {#if $utmFormData.LinkToTrack !== "" && isURL($utmFormData.LinkToTrack)} -->
			<div in:fade={{ delay: 100 }}>
				<label for="utmSource" class="flex flex-col">
					UTM Source
					<span>Identify a traffic source</span>
				</label>
				<input type="text" name="utmSource" id="utmSource" bind:value={utmFormData.UTMSource} />
				<label for="utmMedium" class="flex flex-col"
					>UTM Medium <span> Identify a medium such as email</span></label
				>
				<input type="text" name="utmMedium" id="utmMedium" bind:value={utmFormData.UTMMedium} />
				<label for="utmCampaign" class="flex flex-col"
					>UTM Campaign
					<span> Identify a specific product promotion or strategic campaign </span>
				</label>
				<input
					type="text"
					name="utmCampaign"
					id="utmCampaign"
					bind:value={utmFormData.UTMCampaign}
				/>
				<label for="utmContent" class="flex flex-col"
					>UTM Content
					<span>
						Used for A/B testing and content-targeted ads. Differentiate ads or links that point to
						the same URL.
					</span>
				</label>
				<input type="text" name="utmContent" id="utmContent" bind:value={utmFormData.UTMContent} />
				<label for="utmTerm" class="flex flex-col"
					>UTM Term
					<span> Note the keywords for an ad </span>
				</label>
				<input type="text" name="utmTerm" id="utmTerm" bind:value={utmFormData.UTMTerm} />

				<label for="utmId" class="flex flex-col"
					>UTM ID
					<span>
						Identify a specific ads campaign (not recorded by Impact Stack but might be helpful
						elsewhere)
					</span>
				</label>
				<input type="text" name="utmId" id="utmId" bind:value={utmFormData.UTMID} />
			</div>
		{/if}
	</form>
</section>

{#if utmFormData.LinkToTrack !== ""}
	<!-- {#if $utmFormData.LinkToTrack !== "" && isURL($utmFormData.LinkToTrack)} -->
	<section class="mt-6" in:fade={{ delay: 100 }}>
		<p class="h5 mb-0">Here's your tracking link</p>
		<p>Copy and paste it wherever you need it.</p>

		<div id="trackingLinkWrapper">
			<p>{getOutputLinkToTrack()}</p>
		</div>
	</section>
{/if}

<style>
	#trackingLinkForm label {
		line-height: 1.2;
	}

	#trackingLinkForm label span {
		font-weight: 400;
		font-size: 80%;
	}

	#trackingLinkForm input {
		margin-top: 8px;
	}

	#trackingLinkWrapper {
		display: flex;
		flex-direction: column;
		row-gap: 2.5rem;
		margin: 1rem 0.5rem;
		/* padding: 0.25rem 0.25rem; */
		padding: 1rem;
		box-shadow: 0 0 5px #e6e6e6;
	}
	#trackingLinkWrapper p {
		/* padding: 1rem; */
		word-break: break-word;
		line-height: 1.75;
		margin-bottom: 0;
	}
</style>
