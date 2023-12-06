export type EmailMarketingProviders =
	| "Mailchimp"
	| "DotDigital"
	| "Optimizely"
	| "CleverReach"
	| "Other";

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
	"Optimizely",
	"CleverReach",
	"Other",
];

export type EmailMarketingTokens = {
	[K in EmailMarketingProviderFields]: Tokens;
};
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

export type EmailMarketingTokenDocumentationType = {
	[P in EmailMarketingProviders]?: {
		tokenTerminology: string;
		link: string;
	};
};

export const emailMarketingTokenDocumentation: EmailMarketingTokenDocumentationType =
	{
		Mailchimp: {
			tokenTerminology: "Merge tag",
			link: "https://mailchimp.com/help/all-the-merge-tags-cheat-sheet/#Personalization",
		},
		DotDigital: {
			tokenTerminology: "Data field",
			link: "https://support.dotdigital.com/en/articles/8198875-add-data-field-personalisation-to-your-email-campaign-or-landing-page",
		},
		CleverReach: {
			tokenTerminology: "Variable",
			link: "https://support.cleverreach.de/hc/en-us/articles/360020682999-Newsletter-Editor-Personalize-Texts",
		},
	};
