import { derived, writable } from "svelte/store";
import type { Readable, Writable } from "svelte/store";

type UTMFormType = {
	LinkToTrack: string;
	UTMSource: string;
	UTMID: string;
	UTMMedium: string;
	UTMCampaign: string;
	UTMContent: string;
	UTMTerm: string;
};

export const utmFormData: Writable<UTMFormType> = writable({
	LinkToTrack: "",
	UTMSource: "",
	UTMID: "",
	UTMMedium: "",
	UTMCampaign: "",
	UTMContent: "",
	UTMTerm: "",
});

export const OutputLinkToTrack: Readable<string> = derived(
	utmFormData,
	($utmFormData: UTMFormType, set: (value: string) => void) => {
		const {
			UTMSource,
			UTMID,
			UTMMedium,
			UTMCampaign,
			UTMContent,
			UTMTerm,
			LinkToTrack,
		} = $utmFormData;

		let linkAsURLObject: URL;

		try {
			linkAsURLObject = new URL(LinkToTrack);
		} catch (e) {
			if (LinkToTrack.length > 0) {
				linkAsURLObject = new URL(`https://${LinkToTrack}`);
			} else {
				return;
			}
		}

		// Ensure link starts with 'https://' as long as it's not one of the excluded schemes so this supports 'google.com' rather than just 'https://google.com'
		if (
			linkAsURLObject.protocol !== "http:" &&
			linkAsURLObject.protocol !== "https:" &&
			linkAsURLObject.protocol !== "fb-messenger:" &&
			linkAsURLObject.protocol !== "mailto:"
		) {
			console.error("Invalid URL scheme:", linkAsURLObject.protocol);
			return;
		}

		// If the input URL has put the query parameters after the has then they will be in the hash. We need to move them to the search params
		if (linkAsURLObject.hash.includes("?")) {
			const [cleanHash, hashParams] = linkAsURLObject.hash.split("?");
			linkAsURLObject.hash = cleanHash;

			const hashQueryParams = new URLSearchParams(hashParams);

			// Append the query parameters that were incorrectly in the hash to the output search parameters
			for (const [key, value] of hashQueryParams.entries()) {
				linkAsURLObject.searchParams.append(key, value);
			}
		}

		// If the user has defined a query parameter in the form then add it to the search params of the output URL
		if (UTMSource.trim() !== "")
			linkAsURLObject.searchParams.set("utm_source", UTMSource);
		if (UTMID.trim() !== "") linkAsURLObject.searchParams.set("utm_id", UTMID);
		if (UTMMedium.trim() !== "")
			linkAsURLObject.searchParams.set("utm_medium", UTMMedium);
		if (UTMCampaign.trim() !== "")
			linkAsURLObject.searchParams.set("utm_campaign", UTMCampaign);
		if (UTMContent.trim() !== "")
			linkAsURLObject.searchParams.set("utm_content", UTMContent);
		if (UTMTerm.trim() !== "")
			linkAsURLObject.searchParams.set("utm_term", UTMTerm);

		set(linkAsURLObject.toString());
	}
);
