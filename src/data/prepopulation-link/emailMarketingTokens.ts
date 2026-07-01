export type EmailMarketingProviders = "Mailchimp" | "DotDigital" | "Other";

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
	"Other",
];

export type EmailMarketingTokens = {
	[K in EmailMarketingProviderFields]: Tokens;
};
export const emailMarketingTokens: EmailMarketingTokens = {
	title: {
		Mailchimp: "",
		DotDigital: "",
		Other: "",
	},
	first_name: {
		Mailchimp: "*|FNAME|*",
		DotDigital: "@FIRSTNAME@",
		Other: "",
	},
	last_name: {
		Mailchimp: "*|LNAME|*",
		DotDigital: "@LASTNAME@",
		Other: "",
	},
	email: {
		Mailchimp: "*|EMAIL|*",
		DotDigital: "@EMAIL@",
		Other: "",
	},
	phone_number: {
		Mailchimp: "*|PHONE|*",
		DotDigital: "@PHONE@",
		Other: "",
	},
	mobile_number: {
		Mailchimp: "*|PHONE|*",
		DotDigital: "@PHONE@",
		Other: "",
	},
	street_address: {
		Mailchimp: "",
		DotDigital: "@ADDRESS@",
		Other: "",
	},
	city: {
		Mailchimp: "",
		DotDigital: "@CITY@",
		Other: "",
	},
	state: {
		Mailchimp: "",
		DotDigital: "@STATE@",
		Other: "",
	},
	postcode: {
		Mailchimp: "",
		DotDigital: "@ZIP@",
		Other: "",
	},
	country: {
		Mailchimp: "",
		DotDigital: "@COUNTRY@",
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
	};
