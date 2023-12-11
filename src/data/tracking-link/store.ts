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
		let params = "";

		if (UTMSource.trim() !== "") params += `utm_source=${UTMSource}&`;
		if (UTMID.trim() !== "") params += `utm_id=${UTMID}&`;
		if (UTMMedium.trim() !== "") params += `utm_medium=${UTMMedium}&`;
		if (UTMCampaign.trim() !== "") params += `utm_campaign=${UTMCampaign}&`;
		if (UTMContent.trim() !== "") params += `utm_content=${UTMContent}&`;
		if (UTMTerm.trim() !== "") params += `utm_term=${UTMTerm}&`;

		// Remove trailing '&' and prepend '?'
		if (params !== "") {
			params = params.slice(0, -1);
			outputLink += `?${params}`;
		}

		set(outputLink);
	}
);
