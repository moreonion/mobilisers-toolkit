// AI-NOTE: Svelte 5 runes-based shared state for prepopulation-link functionality
// AI-NOTE: Maintaining persisted storage functionality and form field token management

import { persisted } from "svelte-persisted-store";
import { emailMarketingTokens } from "@/data/prepopulation-link/emailMarketingTokens";
import type {
	EmailMarketingProviderFields,
	EmailMarketingProviders,
	EmailMarketingTokens,
} from "@/data/prepopulation-link/emailMarketingTokens";

/**
 * Shared reactive state for prepopulation functionality
 * AI-NOTE: Using state object pattern to allow mutations from imports
 */
export const prepopulationState = $state({
	customiseFields: false,
});

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
 * A persisted store that's written to local storage to keep the user's selected email provider and the url they're working with
 * AI-NOTE: Keeping persisted store for localStorage functionality - uses traditional $ prefix syntax in components
 */
export const prepopulationLinkStore = persisted<PrepopulationLinkStoreType>("prepopulationLinkStore", {
	selectedEmailProvider: "Mailchimp",
	actionPageURL: "",
});

/**
 * Initial state for prefillFormFields reactive state
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
 * Reactive state for maintaining the form fields that need to be prefilled.
 * AI-NOTE: Using $state with initialization function to avoid circular derivation issues
 */
export const prefillFormFields = $state<PrefillFormFieldsType[]>([...initialPrefillFormFields]);

/**
 * Updates prefill form fields with tokens for the specified provider
 * AI-NOTE: Manual update function for when provider changes or component initializes
 */
export function updatePrefillFormFields(provider: EmailMarketingProviders) {
	prefillFormFields.forEach((field, index) => {
		const key = field.formKey as EmailMarketingProviderFields;
		
		if (Object.prototype.hasOwnProperty.call(emailMarketingTokens, key)) {
			prefillFormFields[index] = {
				...field,
				token: getToken(emailMarketingTokens, key, provider) ?? "",
			};
		}
	});
}

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

