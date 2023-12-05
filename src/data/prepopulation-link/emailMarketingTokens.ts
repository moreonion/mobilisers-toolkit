import { z } from "zod";
export type EmailMarketingProviders =
	| "Mailchimp"
	| "DotDigital"
	| "Optimizely"
	| "CleverReach"
	| "Other";

type Tokens = {
	[K in EmailMarketingProviders]: string;
};
export type EmailMarketingTokens = {
	title: Tokens;
	first_name: Tokens;
	last_name: Tokens;
	email: Tokens;
	phone_number: Tokens;
	mobile_number: Tokens;
	street_address: Tokens;
	city: Tokens;
	state: Tokens;
	postcode: Tokens;
	country: Tokens;
};

export const emailMarketingProviders: EmailMarketingProviders[] = [
	"Mailchimp",
	"DotDigital",
	"Optimizely",
	"CleverReach",
	"Other",
];

export const emailMarketingTokens: EmailMarketingTokens = {
	title: {
		Mailchimp: "",
		DotDigital: "",
		Optimizely: "",
		CleverReach: "{TITLE}",
		Other: "",
	},
	first_name: {
		Mailchimp: "*|FNAME|*",
		DotDigital: "@FIRSTNAME@",
		Optimizely: "firstName",
		CleverReach: "{FIRSTNAME}",
		Other: "",
	},
	last_name: {
		Mailchimp: "*|LNAME|*",
		DotDigital: "@LASTNAME@",
		Optimizely: "lastName",
		CleverReach: "{LASTNAME}",
		Other: "",
	},
	email: {
		Mailchimp: "*|EMAIL|*",
		DotDigital: "@EMAIL@",
		Optimizely: "email",
		CleverReach: "{EMAIL}",
		Other: "",
	},
	phone_number: {
		Mailchimp: "*|PHONE|*",
		DotDigital: "@PHONE@",
		Optimizely: "phone",
		CleverReach: "",
		Other: "",
	},
	mobile_number: {
		Mailchimp: "*|PHONE|*",
		DotDigital: "@PHONE@",
		Optimizely: "phone",
		CleverReach: "",
		Other: "",
	},
	street_address: {
		Mailchimp: "",
		DotDigital: "@ADDRESS@",
		Optimizely: "streetAddress",
		CleverReach: "{STREET}",
		Other: "",
	},
	city: {
		Mailchimp: "",
		DotDigital: "@CITY@",
		Optimizely: "city",
		CleverReach: "{CITY}",
		Other: "",
	},
	state: {
		Mailchimp: "",
		DotDigital: "@STATE@",
		Optimizely: "state",
		CleverReach: "",
		Other: "",
	},
	postcode: {
		Mailchimp: "",
		DotDigital: "@ZIP@",
		Optimizely: "postcode",
		CleverReach: "{ZIP}",
		Other: "",
	},
	country: {
		Mailchimp: "",
		DotDigital: "@COUNTRY@",
		Optimizely: "country",
		CleverReach: "{COUNTRY}",
		Other: "",
	},
};
