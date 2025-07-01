/**
 * Development mode detection utility
 * Detects if the application is running in development mode
 */
export function isDevMode(): boolean {
	return import.meta.env.MODE === "development" || import.meta.env.DEV === true;
}

/**
 * Only execute function in development mode
 * @param fn Function to execute only in dev mode
 */
export function devOnly<T extends (...args: any[]) => any>(fn: T): T | (() => void) {
	return isDevMode() ? fn : () => {};
}
