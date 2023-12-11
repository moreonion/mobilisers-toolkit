import { derived, writable } from "svelte/store";
import type { Readable } from "svelte/store";

export type ShareTargets =
	| "Facebook"
	| "Twitter"
	| "WhatsApp"
	| "Facebook Messenger"
	| "Email";

export const LinkToShare = writable("");

const encodedLinkToShare: Readable<string> = derived(
	LinkToShare,
	(LinkToShare: string) => encodeURIComponent(LinkToShare)
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
				hashtags: hashtags.map((hashtag) => hashtag.replace(/\s/g, "_")), // replace spaces
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
	[EmailParameters, encodedLinkToShare],
	([params, encodedLinkToShare]: [EmailParametersType, string]) => {
		let parametersURL = "";

		if (params.subject !== "") {
			parametersURL += `&subject=${encodeURIComponent(params.subject)}`;
		}

		const bodyContent =
			params.body !== ""
				? `${params.body}\n\n${encodedLinkToShare}`
				: `${encodedLinkToShare}`;

		parametersURL += `&body=${encodeURIComponent(bodyContent)}`;

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
	[WhatsAppParameters, encodedLinkToShare],
	([params, encodedLinkToShare]: [WhatsAppParametersType, string]) => {
		let parametersURL = "";

		const textContent =
			params.text !== ""
				? `${params.text}\n\n${encodedLinkToShare}`
				: `${encodedLinkToShare}`;

		parametersURL += `${encodeURIComponent(textContent)}`;

		return parametersURL;
	}
);

export const useUTMParameters = writable<boolean>(true);

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
			platform: "Facebook",
			shareLink: `https://www.facebook.com/sharer/sharer.php?u=${encodedLinkToShare}`,
		},
		{
			platform: "Twitter",
			shareLink: `https://twitter.com/intent/tweet?url=${encodedLinkToShare}${twitterParametersPartOfURL}`,
		},
		{
			platform: "WhatsApp",
			shareLink: `whatsapp://?text=${whatsAppParametersPartOfURL}`,
		},
		{
			platform: "Facebook Messenger",
			shareLink: `fb-messenger://share?link=${encodedLinkToShare}`,
		},
		{
			platform: "Email",
			shareLink: `mailto:${emailParametersPartOfURL}`,
		},
	]
);
