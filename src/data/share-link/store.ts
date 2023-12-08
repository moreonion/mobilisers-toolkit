import { derived, writable } from "svelte/store";
import type { Readable } from "svelte/store";

export type ShareTargets =
	| "Facebook"
	| "Twitter"
	| "WhatsApp"
	| "Facebook Messenger"
	| "Email";

type ShareLinkSchemaType = {
	[key in ShareTargets]: string;
};

// const shareLinkSchema: ShareLinkSchemaType = {
// 	Facebook: "https://www.facebook.com/sharer/sharer.php?u=",
// 	Twitter: "https://twitter.com/intent/tweet?text=",
// 	WhatsApp: "whatsapp://send?text=",
// 	"Facebook Messenger": "fb-messenger://share?link=",
// 	Email: "mailto://",
// };

export const LinkToShare = writable("");

const encodedLinkToShare = derived(LinkToShare, (LinkToShare: string) =>
	encodeURIComponent(LinkToShare)
);

export const allShareLinks: Readable<ShareLinkSchemaType> = derived(
	encodedLinkToShare,
	(encodedLinkToShare: string) => ({
		Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLinkToShare}`,
		Twitter: `https://twitter.com/intent/tweet?text=${encodedLinkToShare}`,
		WhatsApp: `whatsapp://send?text=${encodedLinkToShare}`,
		"Facebook Messenger": `fb-messenger://share?link=${encodedLinkToShare}`,
		Email: `mailto:?body=${encodedLinkToShare}`,
	})
);
