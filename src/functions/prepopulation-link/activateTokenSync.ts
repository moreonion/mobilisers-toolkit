import {
	emailMarketingProviders,
	emailMarketingTokens,
} from "@/data/prepopulation-link/emailMarketingTokens";
import type {
	EmailMarketingProviderFields,
	EmailMarketingProviders,
} from "@/data/prepopulation-link/emailMarketingTokens";
import type { Writable } from "svelte/store";
import type {
	PrepopulationLinkStoreType,
	PrefillFormFieldsType,
} from "@/data/prepopulation-link/store";

/**
 * Sets up an active subscription to update the prefillFormFields store with the value of the token for the selected email marketing tool
 */

export function activateTokenSync(
	prepopulationLinkStore: Writable<PrepopulationLinkStoreType>,
	prefillFormFields: Writable<PrefillFormFieldsType[]>
) {
	prepopulationLinkStore.subscribe((state: PrepopulationLinkStoreType) => {
		const selectedEmailProvider =
			state.selectedEmailProvider as EmailMarketingProviders;

		if (emailMarketingProviders.includes(selectedEmailProvider)) {
			prefillFormFields.update((fields) =>
				fields.map((field) => {
					if (
						Object.prototype.hasOwnProperty.call(
							emailMarketingTokens,
							field.formKey
						)
					) {
						const key = field.formKey as EmailMarketingProviderFields;
						return {
							...field,
							token: emailMarketingTokens[key][selectedEmailProvider] ?? "",
						};
					}
					return field;
				})
			);
		}
	});
}
