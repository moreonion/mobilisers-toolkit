export type EmailMarketingProviders = "Mailchimp" | "DotDigital" | "CleverReach" | "Other";

export type EmailMarketingProviderFields =
	| "title"
	| "first_name"
	| "last_name"
	| "email"
	| "phone_number"
	| "mobile_number"
	| "street_address"
	| "city"
	| "state"
	| "postcode"
	| "country";

export type EmailMarketingProviderTokensType = {
	[K in EmailMarketingProviders]: EmailMarketingProviderFields;
};

type Tokens = {
	[K in EmailMarketingProviders]: string;
};

export const emailMarketingProviders: EmailMarketingProviders[] = [
	"Mailchimp",
	"DotDigital",
	"CleverReach",
	"Other"
];

export type EmailMarketingTokens = {
	[K in EmailMarketingProviderFields]: Tokens;
};
export const emailMarketingTokens: EmailMarketingTokens = {
	title: {
		Mailchimp: "",
		DotDigital: "",
		CleverReach: "{TITLE}",
		Other: ""
	},
	first_name: {
		Mailchimp: "*|FNAME|*",
		DotDigital: "@FIRSTNAME@",
		CleverReach: "{FIRSTNAME}",
		Other: ""
	},
	last_name: {
		Mailchimp: "*|LNAME|*",
		DotDigital: "@LASTNAME@",
		CleverReach: "{LASTNAME}",
		Other: ""
	},
	email: {
		Mailchimp: "*|EMAIL|*",
		DotDigital: "@EMAIL@",
		CleverReach: "{EMAIL}",
		Other: ""
	},
	phone_number: {
		Mailchimp: "*|PHONE|*",
		DotDigital: "@PHONE@",
		CleverReach: "",
		Other: ""
	},
	mobile_number: {
		Mailchimp: "*|PHONE|*",
		DotDigital: "@PHONE@",
		CleverReach: "",
		Other: ""
	},
	street_address: {
		Mailchimp: "",
		DotDigital: "@ADDRESS@",
		CleverReach: "{STREET}",
		Other: ""
	},
	city: {
		Mailchimp: "",
		DotDigital: "@CITY@",
		CleverReach: "{CITY}",
		Other: ""
	},
	state: {
		Mailchimp: "",
		DotDigital: "@STATE@",
		CleverReach: "",
		Other: ""
	},
	postcode: {
		Mailchimp: "",
		DotDigital: "@ZIP@",
		CleverReach: "{ZIP}",
		Other: ""
	},
	country: {
		Mailchimp: "",
		DotDigital: "@COUNTRY@",
		CleverReach: "{COUNTRY}",
		Other: ""
	}
};

export type EmailMarketingTokenDocumentationType = {
	[P in EmailMarketingProviders]?: {
		tokenTerminology: string;
		link: string;
	};
};

export const emailMarketingTokenDocumentation: EmailMarketingTokenDocumentationType = {
	Mailchimp: {
		tokenTerminology: "Merge tag",
		link: "https://mailchimp.com/help/all-the-merge-tags-cheat-sheet/#Personalization"
	},
	DotDigital: {
		tokenTerminology: "Data field",
		link: "https://support.dotdigital.com/en/articles/8198875-add-data-field-personalisation-to-your-email-campaign-or-landing-page"
	},
	CleverReach: {
		tokenTerminology: "Variable",
		link: "https://support.cleverreach.de/hc/en-us/articles/360020682999-Newsletter-Editor-Personalize-Texts"
	}
};
