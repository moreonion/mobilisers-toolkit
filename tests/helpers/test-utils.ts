import type { Page } from '@playwright/test';

/**
 * Waits for Astro page hydration and Svelte component initialization
 * @param page - Playwright page instance
 * @param componentSelector - Optional specific component selector to wait for
 */
export async function waitForAstroHydration(page: Page, componentSelector?: string) {
  // Wait for network to be idle (Astro static generation)
  await page.waitForLoadState('networkidle');
  
  // If specific component selector provided, wait for it
  if (componentSelector) {
    await page.locator(componentSelector).waitFor();
  }
  
  // Wait for any potential client-side JavaScript to initialize
  await page.waitForFunction(() => {
    // Check if document is ready and any deferred scripts have executed
    return document.readyState === 'complete';
  });
}

/**
 * Utility to collect console errors during test execution
 * Should be called before performing actions that might cause errors
 */
export function setupConsoleErrorTracking(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Validates that a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encodes UTM parameters the same way the application does
 */
export function encodeUtmParameter(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Helper to wait for Svelte component state updates
 * Useful when testing reactive stores and bindings
 */
export async function waitForSvelteUpdate(page: Page, timeout = 1000) {
  // Wait a small amount for Svelte reactivity to process
  await page.waitForFunction(() => {
    // Simple check that Svelte has processed updates
    return new Promise(resolve => {
      // Use setTimeout to wait for next tick
      setTimeout(resolve, 10);
    });
  }, { timeout });
}

/**
 * Test data generators for common scenarios
 */
export const testData = {
  urls: {
    simple: 'https://act.example.org/petition',
    withParams: 'https://act.example.org/petition?existing=param&another=value',
    withHash: 'https://act.example.org/petition#section',
    withHashQuery: 'https://act.example.org/petition#section?existing=param',
    noProtocol: 'act.example.org/petition',
    complex: 'https://act.greenpeace.org/save-the-arctic?utm_source=test&campaign=existing'
  },
  
  utmParams: {
    basic: {
      source: 'email',
      medium: 'newsletter',
      campaign: 'test-campaign'
    },
    complete: {
      source: 'facebook',
      medium: 'social',
      campaign: 'save-arctic-2024',
      content: 'video-post',
      term: 'arctic climate change',
      id: 'camp123'
    },
    specialChars: {
      source: 'social media',
      campaign: 'climate & environment',
      content: 'test@example.com',
      term: '#climateaction'
    }
  }
};