<script lang="ts">
	import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
	import { isURL } from "@/functions/isURL";
	import { fade } from "svelte/transition";

	import ShareLinkList from "@/components/share-link/ShareLinkList.svelte";
	import { getAllShareLinks, shareLinkState } from "@/data/share-link/store.svelte";

	type ButtonMarkupConfig = {
		liClass: string;
		iconClass: string;
		dataShare: string;
		title: string;
		label: string;
		extraAClass?: string;
	};

	// Maps share-link store platforms to the Foundation-style button markup
	// used by Impact Stack thank-you pages.
	const BUTTON_MARKUP: Record<string, ButtonMarkupConfig> = {
		Facebook: {
			liClass: "facebook",
			iconClass: "facebook-icon",
			dataShare: "facebook",
			title: "Share this via Facebook!",
			label: "Facebook"
		},
		"Twitter / X": {
			liClass: "twitter",
			iconClass: "x-icon",
			dataShare: "twitter",
			title: "Share this via X!",
			label: "X"
		},
		WhatsApp: {
			liClass: "whatsapp",
			iconClass: "whatsapp-icon",
			dataShare: "whatsapp",
			title: "Share this via WhatsApp!",
			label: "WhatsApp"
		},
		"Facebook Messenger": {
			liClass: "fbmsg show-for-small-only",
			iconClass: "facebook-messenger-icon",
			dataShare: "facebook-messenger",
			title: "Share this via Messenger!",
			label: "Facebook Messenger",
			extraAClass: "mobile"
		},
		Email: {
			liClass: "email",
			iconClass: "email-icon",
			dataShare: "email",
			title: "Share this via Email!",
			label: "Email"
		},
		"Blue Sky": {
			liClass: "bluesky",
			iconClass: "bluesky-icon",
			dataShare: "bluesky",
			title: "Share this via Bluesky!",
			label: "Bluesky"
		},
		LinkedIn: {
			liClass: "linkedin",
			iconClass: "linkedin-icon",
			dataShare: "linkedin",
			title: "Share this via Linkedin!",
			label: "LinkedIn"
		},
		Threads: {
			liClass: "threads",
			iconClass: "threads-icon",
			dataShare: "threads",
			title: "Share this via Threads!",
			label: "Threads"
		}
	};

	let headingText = $state("Share the campaign!");

	let markupCopied = $state(false);

	$effect(() => {
		const urlParameter = getURLSearchParameter("url");
		if (urlParameter && isURL(urlParameter)) {
			shareLinkState.LinkToShare = urlParameter;
		}
	});

	function buildButtonLi(platform: string, shareLink: string): string {
		const config = BUTTON_MARKUP[platform];
		if (!config) return "";

		const aClass = ["large share button expanded", config.extraAClass, config.iconClass]
			.filter(Boolean)
			.join(" ");

		return `            <li class="${config.liClass}"><a class="${aClass}" data-share="${config.dataShare}" href="${shareLink}" target="_blank" title="${config.title}"><span class="${config.iconClass}"><span>${config.label}</span></span> </a></li>`;
	}

	function generatedMarkup(): string {
		const listItems = getAllShareLinks()
			.map(({ platform, shareLink }) => buildButtonLi(platform, shareLink))
			.join("\n");

		const heading = headingText.trim();

		const headingMarkup =
			heading !== "" ? `    <h2 class="share-buttons-title">${heading}</h2>\n\n` : "";

		return `<div class="share-buttons">
${headingMarkup}    <div class="content">
        <ul class="share-light no-bullet">
${listItems}
        </ul>
    </div>
</div>`;
	}

	function copyMarkup(): void {
		navigator.clipboard.writeText(generatedMarkup());
		markupCopied = true;
		setTimeout(() => {
			markupCopied = false;
		}, 2000);
	}
</script>

<section>
	<form>
		<label for="actionPage" class="flex flex-col">
			Enter the link you want to be shareable
			<small>https://act.your-organisation.org/campaign-name</small>
		</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			name="actionPage"
			id="actionPage"
			placeholder="Enter the link you want people to share"
			aria-label="Enter the link you want to be shareable"
			bind:value={shareLinkState.LinkToShare}
			autofocus
		/>

		{#if shareLinkState.LinkToShare !== ""}
			<label for="headingText" class="flex flex-col mt-6">
				Heading shown above the buttons
				<small>Leave blank to omit the heading</small>
			</label>
			<input
				type="text"
				name="headingText"
				id="headingText"
				bind:value={headingText}
				aria-label="Heading shown above the share buttons"
			/>
		{/if}
	</form>
</section>

{#if shareLinkState.LinkToShare !== ""}
	<section class="mt-6" in:fade={{ delay: 100 }} aria-label="Generated share buttons">
		<details class="customiseDetails">
			<summary>Customise the message for each platform (optional)</summary>
			<p class="mt-2 mb-0">
				<small
					>Add your own text, hashtags or subject line for Twitter / X, WhatsApp, Email, Bluesky,
					LinkedIn and Threads.</small
				>
			</p>
			<ShareLinkList />
		</details>

		<div>
			<p class="h5 mb-0">Generated HTML markup</p>
			<p>Paste the HTML into the Source view of your thank you page.</p>
			<details class="mb-2">
				<summary>Show or hide buttons on specific screen sizes</summary>
				<p>
					Add one of these classes to a <code>&lt;li&gt;</code> to control which screen sizes the button
					appears on.
				</p>
				<dl class="responsiveVisibility">
					<dt><code>show-for-small-only</code></dt>
					<dd>Only visible on small screens</dd>
					<dt><code>show-for-medium-only</code></dt>
					<dd>Only visible on medium screens</dd>
					<dt><code>show-for-large-only</code></dt>
					<dd>Only visible on large screens</dd>
					<dt><code>hide-for-medium</code></dt>
					<dd>Not visible on medium screens or larger</dd>
					<dt><code>hide-for-large</code></dt>
					<dd>Not visible on large screens or larger</dd>
				</dl>
			</details>
			<textarea
				id="markupOutput"
				readonly
				rows="14"
				aria-label="Generated share buttons HTML markup">{generatedMarkup()}</textarea
			>
			<div class="mt-2">
				<button
					class="button small filled text-left"
					type="button"
					disabled={markupCopied}
					onclick={copyMarkup}
				>
					{#if markupCopied}
						Copied!
					{:else}
						Copy markup to clipboard
					{/if}
				</button>
			</div>
		</div>
	</section>
{/if}

<style>
	summary {
		font-weight: bold;
	}

	.customiseDetails {
		margin-bottom: 2.5rem;
	}

	#markupOutput {
		width: 100%;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.85rem;
		white-space: pre;
	}

	.text-left {
		text-align: left;
	}

	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.9em;
		background-color: #f3f3f3;
		padding: 0.05rem 0.3rem;
		border-radius: 3px;
	}

	.responsiveVisibility {
		margin-top: 0.5rem;
	}

	.responsiveVisibility dt {
		margin-top: 0.5rem;
	}

	.responsiveVisibility dd {
		margin-left: 1.5rem;
	}
</style>
