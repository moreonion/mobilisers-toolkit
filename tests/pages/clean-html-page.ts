import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForAstroHydration, waitForSvelteUpdate } from '../helpers/test-utils';

export class CleanHtmlPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/clean-html');
    await this.waitForPageLoad();
  }

  private async waitForPageLoad() {
    // Wait for Astro hydration and the input textarea to be interactive
    await waitForAstroHydration(this.page);
    await this.rawHtmlTextarea.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  // Elements - using exact selectors from the component
  get rawHtmlTextarea() {
    return this.page.getByLabel('Enter the HTML you want to clean');
  }

  get cleanButton() {
    return this.page.getByRole('button', { name: 'Clean →' });
  }

  get cleanHtmlTextarea() {
    return this.page.locator('#cleanHTML');
  }

  get copyButton() {
    return this.page.getByRole('button', { name: /Copy clean HTML to clipboard|Copied!/ });
  }

  get startAgainButton() {
    return this.page.getByRole('button', { name: '← Start again' });
  }

  get originalHtmlDetails() {
    return this.page.getByText('See the original HTML');
  }

  get detailsElement() {
    return this.page.locator('details');
  }

  get originalHtmlContent() {
    return this.page.locator('#dirtyHTML');
  }

  // Section containers to avoid strict mode violations
  get inputSection() {
    return this.page.locator('#dirtyHTMLForm');
  }

  get outputSection() {
    // Target the section that contains the clean HTML output
    return this.page.locator('section').filter({ has: this.page.locator('#cleanHTML') });
  }

  // Actions
  async enterRawHtml(html: string) {
    await this.rawHtmlTextarea.fill(html);
  }

  async clickCleanButton() {
    await this.cleanButton.click();
    // Wait for Svelte state update and output section to appear
    await waitForSvelteUpdate(this.page);
    // Wait for the output section to become visible (not just the textarea)
    await this.outputSection.waitFor({ state: 'visible' });
    await this.cleanHtmlTextarea.waitFor({ state: 'visible' });
  }

  async clickCopyButton() {
    // Store original button text to verify state change
    const originalText = await this.copyButton.textContent();
    
    await this.copyButton.click();
    
    // Wait for button text to change to "Copied!"
    await expect(this.copyButton).toContainText('Copied!');
    
    return originalText;
  }

  async clickStartAgain() {
    await this.startAgainButton.click();
    // Wait for UI to return to initial state
    await waitForSvelteUpdate(this.page);
    await this.inputSection.waitFor({ state: 'visible' });
  }

  async expandOriginalHtmlDetails() {
    // Click the summary to expand details
    await this.originalHtmlDetails.click();
    
    // Wait a moment for any animation
    await this.page.waitForTimeout(100);
  }

  // Helper method to process HTML end-to-end
  async processHtml(rawHtml: string) {
    await this.enterRawHtml(rawHtml);
    await this.clickCleanButton();
  }

  // Assertions
  async expectInitialState() {
    // Input form should be visible
    await expect(this.inputSection).toBeVisible();
    await expect(this.rawHtmlTextarea).toBeVisible();
    await expect(this.cleanButton).toBeVisible();
    
    // Output elements should not be visible
    await expect(this.outputSection).not.toBeVisible();
    await expect(this.cleanHtmlTextarea).not.toBeVisible();
    await expect(this.copyButton).not.toBeVisible();
    await expect(this.startAgainButton).not.toBeVisible();
    await expect(this.originalHtmlDetails).not.toBeVisible();
  }

  async expectOutputState() {
    // Input form should be hidden
    await expect(this.inputSection).not.toBeVisible();
    
    // Output elements should be visible
    await expect(this.outputSection).toBeVisible();
    await expect(this.cleanHtmlTextarea).toBeVisible();
    await expect(this.copyButton).toBeVisible();
    await expect(this.startAgainButton).toBeVisible();
    await expect(this.originalHtmlDetails).toBeVisible();
  }

  async expectCleanHtmlOutput(expectedContent: string) {
    await expect(this.cleanHtmlTextarea).toHaveValue(expectedContent);
  }

  async expectCleanHtmlContains(partialContent: string) {
    const value = await this.cleanHtmlTextarea.inputValue();
    expect(value).toContain(partialContent);
  }

  async expectOriginalHtmlPreserved(originalHtml: string) {
    // Expand details first
    await this.expandOriginalHtmlDetails();
    // Check the content contains the original HTML (even if not fully visible)
    const content = await this.originalHtmlContent.textContent();
    expect(content || '').toContain(originalHtml);
  }

  async expectCopyButtonDisabled() {
    await expect(this.copyButton).toBeDisabled();
    await expect(this.copyButton).toContainText('Copied!');
  }

  async expectCopyButtonEnabled() {
    await expect(this.copyButton).not.toBeDisabled();
    await expect(this.copyButton).toContainText('Copy clean HTML to clipboard');
  }

  // Utility methods
  async getCleanHtmlOutput(): Promise<string> {
    return await this.cleanHtmlTextarea.inputValue();
  }

  async getRawHtmlInput(): Promise<string> {
    return await this.rawHtmlTextarea.inputValue();
  }

  // Debug helper
  async debugCurrentState() {
    console.log('=== Clean HTML Page Debug ===');
    console.log('Input section visible:', await this.inputSection.isVisible().catch(() => 'error'));
    console.log('Output section visible:', await this.outputSection.isVisible().catch(() => 'error'));
    console.log('Clean textarea visible:', await this.cleanHtmlTextarea.isVisible().catch(() => 'error'));
    console.log('Raw input value:', await this.getRawHtmlInput().catch(() => 'error'));
    console.log('Clean output value:', await this.getCleanHtmlOutput().catch(() => 'error'));
    console.log('================================');
  }

  async expectInputFocused() {
    await expect(this.rawHtmlTextarea).toBeFocused();
  }

  async expectTextareaHasPlaceholder() {
    await expect(this.rawHtmlTextarea).toHaveAttribute('placeholder', 'Enter HTML here');
  }

  // Testing specific HTML transformations
  async expectSpanTagsRemoved(originalHtml: string) {
    const cleanHtml = await this.getCleanHtmlOutput();
    
    // Original should have <span> tags
    expect(originalHtml).toContain('<span');
    
    // Clean HTML should not have <span> tags
    expect(cleanHtml).not.toContain('<span');
  }

  async expectDivTagsRemoved(originalHtml: string) {
    const cleanHtml = await this.getCleanHtmlOutput();
    
    // Original should have <div> tags
    expect(originalHtml).toContain('<div');
    
    // Clean HTML should not have <div> tags
    expect(cleanHtml).not.toContain('<div');
  }

  async expectBoldTagsNormalized() {
    const cleanHtml = await this.getCleanHtmlOutput();
    
    // Should use <strong> instead of <b>
    expect(cleanHtml).not.toContain('<b>');
    expect(cleanHtml).not.toContain('</b>');
  }

  async expectGoogleRedirectsClean() {
    const cleanHtml = await this.getCleanHtmlOutput();
    
    // Should not contain Google redirect URLs
    expect(cleanHtml).not.toContain('google.com/url?q=');
  }

  async expectHtmlPrettified() {
    const cleanHtml = await this.getCleanHtmlOutput();
    
    // Should have proper indentation and line breaks
    expect(cleanHtml).toMatch(/\n\s+/); // Contains newlines with indentation
  }
}