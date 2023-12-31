import { z } from "zod";

// The .url() from Zod just uses `new URL()` which doesn't map with most people's understanding of a valid URL so do some extra validation
// https://stackoverflow.com/a/9284473
const URLRegex =
	/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export function isURL(str: string) {
	const urlSchema = z
		.string()
		.url()
		.refine((value) => URLRegex.test(value));

	if (urlSchema.safeParse(str).success) {
		return true;
	}
	return false;
}
