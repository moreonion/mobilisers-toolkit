import { persisted } from "svelte-persisted-store";

export const prepopulationLinkStore = persisted("prepopulationLinkStore", {
	emailProvider: "",
	actionPageURL: "",
	formFields: [
		{
			label: "First Name",
			formKey: "first_name",
			prefilled: true,
			tag: "",
		},
		{
			label: "Last Name",
			formKey: "last_name",
			prefilled: true,
			tag: "",
		},
		{
			label: "Email",
			formKey: "email",
			prefilled: true,
			tag: "",
		},
	],
});
