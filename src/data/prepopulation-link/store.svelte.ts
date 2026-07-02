import { persisted } from "svelte-persisted-store";
import type { EmailMarketingProviders } from "@/data/prepopulation-link/emailMarketingTokens";

export const prepopulationState = $state({
	customiseFields: false
});

export type PrefillFormFieldsType = {
	id: number;
	label: string;
	formKey: string;
	prefilled: boolean;
	token: string;
	fieldType?: "text" | "select" | "number";
	options?: string[];
	validation?: {
		min?: number;
		required?: boolean;
	};
};

export type PrepopulationLinkStoreType = {
	selectedEmailProvider: EmailMarketingProviders;
	actionPageURL: string;
};

export const prepopulationLinkStore = persisted<PrepopulationLinkStoreType>(
	"prepopulationLinkStore",
	{
		selectedEmailProvider: "Mailchimp",
		actionPageURL: ""
	}
);

/**
 * Initial state for prefillFormFields reactive state
 */
const initialPrefillFormFields: PrefillFormFieldsType[] = [
	{
		id: 1,
		label: "First Name",
		formKey: "first_name",
		prefilled: true,
		token: ""
	},
	{
		id: 2,
		label: "Last Name",
		formKey: "last_name",
		prefilled: true,
		token: ""
	},
	{
		id: 3,
		label: "Email",
		formKey: "email",
		prefilled: true,
		token: ""
	},
	{
		id: 4,
		label: "Donation Interval",
		formKey: "donation_interval",
		prefilled: false,
		token: "",
		fieldType: "select",
		options: ["Single", "Monthly", "Annual"]
	},
	{
		id: 5,
		label: "Donation Amount",
		formKey: "donation_amount",
		prefilled: false,
		token: "",
		fieldType: "number",
		validation: {
			min: 1
		}
	},
	{
		id: 6,
		label: "Postcode",
		formKey: "postcode",
		prefilled: false,
		token: ""
	},
	{
		id: 7,
		label: "Street Address",
		formKey: "street_address",
		prefilled: false,
		token: ""
	},
	{
		id: 8,
		label: "City",
		formKey: "city",
		prefilled: false,
		token: ""
	},
	{
		id: 9,
		label: "Country",
		formKey: "country",
		prefilled: false,
		token: ""
	},
	{
		id: 10,
		label: "Title",
		formKey: "title",
		prefilled: false,
		token: ""
	},
	{
		id: 11,
		label: "Phone Number",
		formKey: "phone_number",
		prefilled: false,
		token: ""
	},
	{
		id: 12,
		label: "Mobile Number",
		formKey: "mobile_number",
		prefilled: false,
		token: ""
	},
	{
		id: 13,
		label: "State",
		formKey: "state",
		prefilled: false,
		token: ""
	}
];

/**
 * Base form fields without tokens - to be used in components for deriving final fields
 */
export const basePrefillFormFields = [...initialPrefillFormFields];

/**
 * Helper function to create initial form fields */
export function createInitialFormFields(): PrefillFormFieldsType[] {
	return basePrefillFormFields.map((field) => ({
		...field,
		token: "" // Will be populated by the component
	}));
}
