import { z } from "astro/zod";

export function isURL(str: string) {
	const urlSchema = z.url();

	if (urlSchema.safeParse(str).success) {
		return true;
	}
	return false;
}
