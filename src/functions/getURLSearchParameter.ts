export function getURLSearchParameter(
	name: string,
	url: string = window.location.href
): string | null {
	// Find the first occurrence of '?' and extract the substring from there onwards
	const queryStringStart = url.indexOf("?");
	const queryString =
		queryStringStart !== -1 ? url.substring(queryStringStart + 1) : "";
	const urlParams = new URLSearchParams(queryString);

	// Get the parameter by name, which is expected to be a URL
	const paramValue = urlParams.get(name);

	// Decode the extracted parameter value if it's not null
	return paramValue !== null ? decodeURIComponent(paramValue) : null;
}
