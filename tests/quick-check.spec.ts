// Quick Playwright test to check all pages load without errors
import { test, expect } from '@playwright/test';

test.describe('Page Load Tests', () => {
  test('home page loads without errors', async ({ page }) => {
    // Set up console error monitoring before navigation
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out 404 errors for dev server assets - these are normal in development
        if (!msg.text().includes('Failed to load resource') && !msg.text().includes('404')) {
          errors.push(msg.text());
        }
      }
    });

    await page.goto('/');
    
    // Wait for page to be ready and Astro/Svelte hydration to complete
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: "Mobiliser's Toolkit" })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('share-link page loads without errors', async ({ page }) => {
    // Set up console error monitoring before navigation
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out 404 errors for dev server assets - these are normal in development
        if (!msg.text().includes('Failed to load resource') && !msg.text().includes('404')) {
          errors.push(msg.text());
        }
      }
    });

    await page.goto('/share-link');
    
    // Wait for Svelte island to be hydrated and input to be interactive
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Enter the link you want to be shareable')).toBeVisible();

    // Test basic interaction to ensure hydration is complete
    await page.getByLabel('Enter the link you want to be shareable').fill('https://example.com');
    
    // Verify interaction worked by checking if share links section appears
    await expect(page.getByText('Here are the share links')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('tracking-link page loads without errors', async ({ page }) => {
    // Set up console error monitoring before navigation
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out 404 errors for dev server assets - these are normal in development
        if (!msg.text().includes('Failed to load resource') && !msg.text().includes('404')) {
          errors.push(msg.text());
        }
      }
    });

    await page.goto('/tracking-link');
    
    // Wait for Svelte island to be hydrated and input to be interactive
    await page.waitForLoadState('networkidle');
    await expect(page.getByPlaceholder('Enter the link you want to add tracking to')).toBeVisible();

    // Test basic interaction to ensure hydration is complete
    await page.getByPlaceholder('Enter the link you want to add tracking to').fill('https://example.com');
    
    // Verify interaction worked by checking if tracking form appears
    await expect(page.getByText('Build your tracking link using the form below')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('prepopulation-link page loads without errors', async ({ page }) => {
    // Set up console error monitoring before navigation
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out 404 errors for dev server assets - these are normal in development
        if (!msg.text().includes('Failed to load resource') && !msg.text().includes('404')) {
          errors.push(msg.text());
        }
      }
    });

    await page.goto('/prepopulation-link');
    
    // Wait for Svelte island to be hydrated and input to be interactive
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Enter your Impact Stack action URL')).toBeVisible();

    // Test basic interaction to ensure hydration is complete
    await page.getByLabel('Enter your Impact Stack action URL').fill('https://example.com');
    
    // Verify interaction worked by checking if prepopulation link appears
    await expect(page.locator('text=https://example.com#p:')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('clean-html page loads without errors', async ({ page }) => {
    // Set up console error monitoring before navigation
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out 404 errors for dev server assets - these are normal in development
        if (!msg.text().includes('Failed to load resource') && !msg.text().includes('404')) {
          errors.push(msg.text());
        }
      }
    });

    await page.goto('/clean-html');
    
    // Wait for Svelte island to be hydrated and textarea to be interactive
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Enter the HTML you want to clean')).toBeVisible();

    // Test basic interaction to ensure hydration is complete
    await page.getByLabel('Enter the HTML you want to clean').fill('<div>test</div>');
    
    // Verify textarea accepted the input
    await expect(page.getByLabel('Enter the HTML you want to clean')).toHaveValue('<div>test</div>');

    expect(errors).toEqual([]);
  });
});