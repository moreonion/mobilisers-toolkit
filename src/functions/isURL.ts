import { z } from "zod";

export function isURL(str: string) {
	const urlSchema = z.string().url();

	if (urlSchema.safeParse(str).success) {
		return true;
	}
	return false;
}
