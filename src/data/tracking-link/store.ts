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
			LinkToTrack,
			UTMSource,
			UTMID,
			UTMMedium,
			UTMCampaign,
			UTMContent,
			UTMTerm,
		} = $utmFormData;

		let outputLink = LinkToTrack;
		const paramsArray = [];
		const hasExistingParams = LinkToTrack.includes("?");

		if (UTMSource.trim() !== "")
			paramsArray.push(`utm_source=${encodeURIComponent(UTMSource)}`);
		if (UTMID.trim() !== "")
			paramsArray.push(`utm_id=${encodeURIComponent(UTMID)}`);
		if (UTMMedium.trim() !== "")
			paramsArray.push(`utm_medium=${encodeURIComponent(UTMMedium)}`);
		if (UTMCampaign.trim() !== "")
			paramsArray.push(`utm_campaign=${encodeURIComponent(UTMCampaign)}`);
		if (UTMContent.trim() !== "")
			paramsArray.push(`utm_content=${encodeURIComponent(UTMContent)}`);
		if (UTMTerm.trim() !== "")
			paramsArray.push(`utm_term=${encodeURIComponent(UTMTerm)}`);

		// Join parameters with '&' and prepend with '?' or '&' depending on existing parameters
		if (paramsArray.length > 0) {
			const params = paramsArray.join("&");
			outputLink += (hasExistingParams ? "&" : "?") + params;
		}

		set(outputLink);
	}
);
