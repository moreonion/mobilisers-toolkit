export function getURLSearchParameter(name: string) {
	const urlParams = new URLSearchParams(window.location.search);
	const paramValue = urlParams.get(name);

	// If paramValue is not null, decode and return, otherwise return null
	return paramValue !== null ? decodeURIComponent(paramValue) : null;
}
