// Quick Playwright test to check all pages load without errors
import { test, expect } from '@playwright/test';

test.describe('Page Load Tests', () => {
  test('home page loads without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any async operations
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('share-link page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/share-link');
    await expect(page.locator('input[placeholder*="share"]')).toBeVisible();

    // Test basic interaction
    await page.fill('input[placeholder*="share"]', 'example.com');
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('tracking-link page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/tracking-link');
    await expect(page.locator('input[placeholder*="tracking"]')).toBeVisible();

    // Test basic interaction
    await page.fill('input[placeholder*="tracking"]', 'example.com');
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('prepopulation-link page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/prepopulation-link');
    await expect(page.locator('input[placeholder*="Action page URL"]')).toBeVisible();

    // Test basic interaction
    await page.fill('input[placeholder*="Action page URL"]', 'example.com');
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('clean-html page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/clean-html');
    await expect(page.locator('textarea[placeholder*="HTML"]')).toBeVisible();

    // Test basic interaction
    await page.fill('textarea[placeholder*="HTML"]', '<div>test</div>');
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
});