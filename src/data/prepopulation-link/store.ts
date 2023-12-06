import { persisted } from "svelte-persisted-store";
import { writable } from "svelte/store";

export type PrefillFormFieldsType = {
	id: number;
	label: string;
	formKey: string;
	prefilled: boolean;
	token: string;
};

export type PrepopulationLinkStoreType = {
	selectedEmailProvider: string;
	actionPageURL: string;
};

export const prepopulationLinkStore = persisted<PrepopulationLinkStoreType>(
	"prepopulationLinkStore",
	{
		selectedEmailProvider: "",
		actionPageURL: "",
	}
);
export const prefillFormFields = writable<PrefillFormFieldsType[]>([
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
]);
