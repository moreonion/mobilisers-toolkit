import { derived, writable } from "svelte/store";
import type { Readable } from "svelte/store";

export type ShareTargets =
	| "Facebook"
	| "Twitter / X"
	| "WhatsApp"
	| "Facebook Messenger"
	| "Email";

export const LinkToShare = writable("");

// Ensure LinkToTrack starts with 'https://' if it's not one of the excluded schemes
const prefixedLinkToShare = derived(LinkToShare, ($LinkToShare) => {
	if (
		!$LinkToShare.startsWith("http://") &&
		!$LinkToShare.startsWith("https://") &&
		!$LinkToShare.startsWith("fb-messenger://") &&
		!$LinkToShare.startsWith("mailto:")
	) {
		return `https://${$LinkToShare}`;
	}
	return $LinkToShare;
});

const encodedLinkToShare: Readable<string> = derived(
	prefixedLinkToShare,
	(prefixedLinkToShare: string) => encodeURIComponent(prefixedLinkToShare)
);

type TwitterParametersType = {
	text: string;
	hashtags: string[];
};

function createTwitterParameters() {
	const { subscribe, update, set } = writable<TwitterParametersType>({
		text: "",
		hashtags: [],
	});

	return {
		subscribe,
		set,
		update,
		setHashtags: (hashtags: string[]) =>
			update((storeValue) => ({
				...storeValue,
				hashtags: hashtags.map((hashtag) => hashtag.replace(/[\s-]/g, "_")), // replace spaces and dashes
			})),
	};
}

export const TwitterParameters = createTwitterParameters();

// Writable store for Tags component to bind to
export const TwitterInputHashtags = writable<string[]>([]);

// Update TwitterParameters when the InputHashtags change
TwitterInputHashtags.subscribe((hashtags) => {
	TwitterParameters.setHashtags(hashtags);
});

export const twitterParametersPartOfURL: Readable<string> = derived(
	TwitterParameters,
	({ text, hashtags }: TwitterParametersType) => {
		let parametersURL = "";
		if (text !== "") {
			parametersURL += `&text=${encodeURIComponent(text)}`;
		}

		if (hashtags.length > 0) {
			parametersURL += `&hashtags=${hashtags.join(",")}`;
		}
		return parametersURL;
	}
);

type EmailParametersType = {
	subject: string;
	body: string;
};

export const EmailParameters = writable<EmailParametersType>({
	subject: "",
	body: "",
});

export const emailParametersPartOfURL: Readable<string> = derived(
	[EmailParameters, LinkToShare],
	([params, LinkToShare]: [EmailParametersType, string]) => {
		const bodyContent =
			params.body !== ""
				? `${params.body}\n\n${LinkToShare}`
				: `${LinkToShare}`;

		let parametersURL = `body=${encodeURIComponent(bodyContent)}`;

		if (params.subject !== "") {
			parametersURL += `&subject=${encodeURIComponent(params.subject)}`;
		}

		return parametersURL;
	}
);

type WhatsAppParametersType = {
	text: string;
};

export const WhatsAppParameters = writable<WhatsAppParametersType>({
	text: "",
});

// Writable store for user input text component to bind to
export const WhatsAppInputText = writable<string>("");

// Update WhatsAppParameters when the InputText change
WhatsAppInputText.subscribe((text) => {
	WhatsAppParameters.update((storeValue) => ({
		...storeValue,
		text: text,
	}));
});

export const whatsAppParametersPartOfURL: Readable<string> = derived(
	[WhatsAppParameters, prefixedLinkToShare],
	([params, prefixedLinkToShare]: [WhatsAppParametersType, string]) => {
		let parametersURL = "";

		const textContent =
			params.text !== ""
				? `${params.text}\n\n${prefixedLinkToShare}`
				: `${prefixedLinkToShare}`;

		parametersURL += `${encodeURIComponent(textContent)}`;

		return parametersURL;
	}
);

type ShareLinkType = {
	platform: ShareTargets;
	shareLink: string;
};

type ShareLinkSchemaType = ShareLinkType[];

export const allShareLinks: Readable<ShareLinkSchemaType> = derived(
	[
		encodedLinkToShare,
		twitterParametersPartOfURL,
		emailParametersPartOfURL,
		whatsAppParametersPartOfURL,
	],
	([
		encodedLinkToShare,
		twitterParametersPartOfURL,
		emailParametersPartOfURL,
		whatsAppParametersPartOfURL,
	]: [string, string, string, string]) => [
		{
			platform: "Facebook" as ShareTargets,
			shareLink: `https://www.facebook.com/sharer/sharer.php?u=${encodedLinkToShare}`,
		},
		{
			platform: "Twitter / X" as ShareTargets,
			shareLink: `https://x.com/intent/tweet?url=${encodedLinkToShare}${twitterParametersPartOfURL}`,
		},
		{
			platform: "WhatsApp" as ShareTargets,
			shareLink: `https://wa.me/?text=${whatsAppParametersPartOfURL}`,
		},
		{
			platform: "Facebook Messenger" as ShareTargets,
			shareLink: `fb-messenger://share?link=${encodedLinkToShare}`,
		},
		{
			platform: "Email" as ShareTargets,
			shareLink: `mailto:?${emailParametersPartOfURL}`,
		},
	]
);
