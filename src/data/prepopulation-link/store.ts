import { persisted } from "svelte-persisted-store";
import { writable } from "svelte/store";
export type PrefillFormFieldsType = {
	id: number;
	label: string;
	formKey: string;
	prefilled: boolean;
	tag: string;
};

type PrepopulationLinkStoreType = {
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
		tag: "A tag",
	},
	{
		id: 2,
		label: "Last Name",
		formKey: "last_name",
		prefilled: true,
		tag: "",
	},
	{
		id: 3,
		label: "Email",
		formKey: "email",
		prefilled: true,
		tag: "",
	},
]);
