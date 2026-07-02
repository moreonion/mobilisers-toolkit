import sanitizeHtml from "sanitize-html";
import beautify from "js-beautify";

const sanitise = (text: string) => {
	const unwantedTags = ["span", "div"]; // Add other unwanted tags to this array

	const sanitised = sanitizeHtml(text, {
		allowedTags: sanitizeHtml.defaults.allowedTags.filter((tag) => !unwantedTags.includes(tag)),
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			a: ["href"]
		},
		transformTags: {
			b: "strong",
			span: (_, attribs) => {
				const style = attribs.style || "";
				if (style.includes("font-weight:700")) {
					return {
						tagName: "strong",
						attribs: {}
					};
				}
				if (style.includes("font-style:italic")) {
					return {
						tagName: "em",
						attribs: {}
					};
				}
				if (style.includes("text-decoration:underline")) {
					return {
						tagName: "u",
						attribs: {}
					};
				}
				return {
					tagName: "",
					attribs: {}
				};
			}
		},
		textFilter: (text) => {
			return text.replace(/\s+/g, " ");
		},
		exclusiveFilter: (frame) => {
			if (!frame.text.trim()) {
				return true;
			}
			frame.text = frame.text.replace(/\s+/g, " ").trim();
			return false;
		}
	});

	return sanitised;
};

const cleanupGoogleRedirectURLs = (text: string): string => {
	const anchorTagRegex = /<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
	return text.replace(anchorTagRegex, (_match, href, linkText) => {
		// Extract the original URL from Google's wrapped URL
		const originalURLMatch = href.match(/url\?q=([^&]*)/);
		const originalURL = originalURLMatch ? decodeURIComponent(originalURLMatch[1]) : href;

		return `<a href="${originalURL}">${linkText}</a>`;
	});
};

export const prettify = (text: string): string => {
	return beautify.html(text, {
		max_preserve_newlines: 0,
		preserve_newlines: false
	});
};

const trim = (text: string): string => {
	return text.trim();
};

export const processHTML = (rawHTML: string): string => {
	const transformers = [sanitise, cleanupGoogleRedirectURLs, prettify, trim];

	let result: string = rawHTML;
	for (const transformer of transformers) {
		result = transformer(result);
	}
	return result;
};
