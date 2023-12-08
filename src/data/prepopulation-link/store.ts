import { persisted } from "svelte-persisted-store";
import { writable } from "svelte/store";
import { emailMarketingTokens } from "@/data/prepopulation-link/emailMarketingTokens";
import type {
	EmailMarketingProviderFields,
	EmailMarketingProviders,
	EmailMarketingTokens,
} from "@/data/prepopulation-link/emailMarketingTokens";

/**
 * If true, the user can customise which fields they want to include
 */
export const customiseFields = writable(false);

export type PrefillFormFieldsType = {
	id: number;
	label: string;
	formKey: string;
	prefilled: boolean;
	token: string;
};

export type PrepopulationLinkStoreType = {
	selectedEmailProvider: EmailMarketingProviders;
	actionPageURL: string;
};

/**
 * A store that's written to local storage to keep the user's selected email provider and the url they're working with
 */
export const prepopulationLinkStore = persisted<PrepopulationLinkStoreType>(
	"prepopulationLinkStore",
	{
		selectedEmailProvider: "Mailchimp",
		actionPageURL: "",
	}
);

/**
 * Initial state for "prefillFormFields" store
 */
const initialPrefillFormFields: PrefillFormFieldsType[] = [
	{
		id: 1,
		label: "First Name",
		formKey: "first_name",
		prefilled: true,
		token: "",
	},
	{
		id: 2,
		label: "Last Name",
		formKey: "last_name",
		prefilled: true,
		token: "",
	},
	{
		id: 3,
		label: "Email",
		formKey: "email",
		prefilled: true,
		token: "",
	},
	{
		id: 4,
		label: "Postcode",
		formKey: "postcode",
		prefilled: false,
		token: "",
	},
	{
		id: 5,
		label: "Street Address",
		formKey: "street_address",
		prefilled: false,
		token: "",
	},
	{
		id: 6,
		label: "City",
		formKey: "city",
		prefilled: false,
		token: "",
	},
	{
		id: 7,
		label: "Country",
		formKey: "country",
		prefilled: false,
		token: "",
	},
	{
		id: 8,
		label: "Title",
		formKey: "title",
		prefilled: false,
		token: "",
	},
	{
		id: 9,
		label: "Phone Number",
		formKey: "phone_number",
		prefilled: false,
		token: "",
	},
	{
		id: 10,
		label: "Mobile Number",
		formKey: "mobile_number",
		prefilled: false,
		token: "",
	},
	{
		id: 11,
		label: "State",
		formKey: "state",
		prefilled: false,
		token: "",
	},
];

/**
 * Svelte store for maintaining state of the form fields that need to be prefilled.
 */
export const prefillFormFields = writable<PrefillFormFieldsType[]>(
	initialPrefillFormFields
);

/**
 * Returns the token for given email marketing provider and field.
 */
function getToken(
	emailMarketingTokens: EmailMarketingTokens,
	key: EmailMarketingProviderFields,
	selectedEmailProvider: EmailMarketingProviders
) {
	if (Object.prototype.hasOwnProperty.call(emailMarketingTokens, key)) {
		return emailMarketingTokens[key][selectedEmailProvider];
	}
	return null;
}
export function updatePrefillFormFields(provider: EmailMarketingProviders) {
	prefillFormFields.update((items) => {
		return items.map((field) => {
			const key = field.formKey as EmailMarketingProviderFields;

			if (Object.prototype.hasOwnProperty.call(emailMarketingTokens, key)) {
				return {
					...field,
					token: getToken(emailMarketingTokens, key, provider) ?? "",
				};
			}

			return field;
		});
	});
}

/**
 * Automatically updates all form fields with their appropriate tokens for the specified provider whenever the selectedEmailProvider updates
 */
prepopulationLinkStore.subscribe(({ selectedEmailProvider }) => {
	updatePrefillFormFields(selectedEmailProvider);
});
