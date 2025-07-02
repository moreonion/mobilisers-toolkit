export const SHARE_TARGETS = [
	"Facebook",
	"Twitter / X",
	"WhatsApp",
	"Facebook Messenger",
	"Email",
	"Blue Sky",
	"LinkedIn",
	"Threads"
] as const;

type ShareTargets = (typeof SHARE_TARGETS)[number];

type ShareLinkType = {
	platform: ShareTargets;
	shareLink: string;
};

type ShareLinkSchemaType = ShareLinkType[];

export const shareLinkState = $state({
	LinkToShare: "",
	TwitterParameters: {
		text: "",
		hashtags: [] as string[]
	},
	EmailParameters: {
		subject: "",
		body: ""
	},
	WhatsAppParameters: {
		text: ""
	},
	BlueSkyParameters: {
		text: ""
	},
	LinkedInParameters: {
		text: ""
	},
	ThreadsParameters: {
		text: "",
		url: ""
	}
});

export function getPrefixedLinkToShare(): string {
	const link = shareLinkState.LinkToShare;
	if (
		!link.startsWith("http://") &&
		!link.startsWith("https://") &&
		!link.startsWith("fb-messenger://") &&
		!link.startsWith("mailto:")
	) {
		return `https://${link}`;
	}
	return link;
}

export function getEncodedLinkToShare(): string {
	return encodeURIComponent(getPrefixedLinkToShare());
}

export function getTwitterParametersPartOfURL(): string {
	let parametersURL = "";
	if (shareLinkState.TwitterParameters.text !== "") {
		parametersURL += `&text=${encodeURIComponent(shareLinkState.TwitterParameters.text)}`;
	}

	if (shareLinkState.TwitterParameters.hashtags.length > 0) {
		parametersURL += `&hashtags=${shareLinkState.TwitterParameters.hashtags.join(",")}`;
	}
	return parametersURL;
}

export function getEmailParametersPartOfURL(): string {
	const bodyContent =
		shareLinkState.EmailParameters.body !== ""
			? `${shareLinkState.EmailParameters.body}\n\n${shareLinkState.LinkToShare}`
			: `${shareLinkState.LinkToShare}`;

	let parametersURL = `body=${encodeURIComponent(bodyContent)}`;

	if (shareLinkState.EmailParameters.subject !== "") {
		parametersURL += `&subject=${encodeURIComponent(shareLinkState.EmailParameters.subject)}`;
	}

	return parametersURL;
}

export function getWhatsAppParametersPartOfURL(): string {
	const textContent =
		shareLinkState.WhatsAppParameters.text !== ""
			? `${shareLinkState.WhatsAppParameters.text}\n\n${getPrefixedLinkToShare()}`
			: `${getPrefixedLinkToShare()}`;

	return encodeURIComponent(textContent);
}

export function getBlueSkyParametersPartOfURL(): string {
	const textContent =
		shareLinkState.BlueSkyParameters.text !== ""
			? `${shareLinkState.BlueSkyParameters.text}\n\n${getPrefixedLinkToShare()}`
			: `${getPrefixedLinkToShare()}`;

	return encodeURIComponent(textContent);
}

export function getLinkedInParametersPartOfURL(): string {
	const textContent =
		shareLinkState.LinkedInParameters.text !== ""
			? `${shareLinkState.LinkedInParameters.text}\n\n${getPrefixedLinkToShare()}`
			: `${getPrefixedLinkToShare()}`;

	return encodeURIComponent(textContent);
}

export function getThreadsParametersPartOfURL(): string {
	let parametersURL = "";

	// If there's text content, add it as the text parameter
	if (shareLinkState.ThreadsParameters.text !== "") {
		parametersURL += `text=${encodeURIComponent(shareLinkState.ThreadsParameters.text)}`;
	}

	// Add the shared link as the url parameter
	if (parametersURL !== "") {
		parametersURL += "&";
	}
	parametersURL += `url=${encodeURIComponent(shareLinkState.LinkToShare)}`;

	return parametersURL;
}

export function getAllShareLinks(): ShareLinkSchemaType {
	return [
		{
			platform: "Facebook",
			shareLink: `https://www.facebook.com/sharer/sharer.php?u=${getEncodedLinkToShare()}`
		},
		{
			platform: "Twitter / X",
			shareLink: `https://x.com/intent/tweet?url=${getEncodedLinkToShare()}${getTwitterParametersPartOfURL()}`
		},
		{
			platform: "WhatsApp",
			shareLink: `https://wa.me/?text=${getWhatsAppParametersPartOfURL()}`
		},
		{
			platform: "Facebook Messenger",
			shareLink: `fb-messenger://share?link=${getEncodedLinkToShare()}`
		},
		{
			platform: "Email",
			shareLink: `mailto:?${getEmailParametersPartOfURL()}`
		},
		{
			platform: "Blue Sky",
			shareLink: `https://bsky.app/intent/compose?text=${getBlueSkyParametersPartOfURL()}`
		},
		{
			platform: "LinkedIn",
			shareLink: `https://www.linkedin.com/feed/?shareActive=true&text=${getLinkedInParametersPartOfURL()}`
		},
		{
			platform: "Threads",
			shareLink: `https://www.threads.net/intent/post?${getThreadsParametersPartOfURL()}`
		}
	];
}
