import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class TrackingLinkPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/tracking-link');
    await this.waitForPageLoad();
  }

  async gotoWithUrl(url: string) {
    await this.page.goto(`/tracking-link?url=${encodeURIComponent(url)}`);
    await this.waitForPageLoad();
  }

  private async waitForPageLoad() {
    // Wait for Astro hydration - the main input should be visible and interactive
    await this.page.getByLabel('Enter the link you want to add tracking to').waitFor();
    await this.page.waitForLoadState('networkidle');
  }

  // Elements - using exact labels from component
  get linkToTrackInput() {
    return this.page.getByLabel('Enter the link you want to add tracking to');
  }

  get utmSourceInput() {
    return this.page.getByLabel('UTM Source');
  }

  get utmMediumInput() {
    return this.page.getByLabel('UTM Medium');
  }

  get utmCampaignInput() {
    return this.page.getByLabel('UTM Campaign');
  }

  get utmContentInput() {
    return this.page.getByLabel('UTM Content');
  }

  get utmTermInput() {
    return this.page.getByLabel('UTM Term');
  }

  get utmIdInput() {
    return this.page.getByLabel('UTM ID');
  }

  get previewRegion() {
    return this.page.getByRole('region', { name: /tracking link preview/i });
  }

  get outputRegion() {
    return this.page.getByRole('region', { name: /tracking link output/i });
  }

  get previewLink() {
    return this.previewRegion.locator('p').last();
  }

  get outputLink() {
    return this.outputRegion.locator('p').last();
  }

  get trackingLinkOutputs() {
    return [this.previewLink, this.outputLink];
  }

  // Actions
  async enterTrackingUrl(url: string) {
    await this.linkToTrackInput.fill(url);
    // Wait for UTM fields to appear instead of sections to avoid strict mode issues
    await this.utmSourceInput.waitFor({ state: 'visible' });
  }

  async fillUtmParameters(params: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
    id?: string;
  }) {
    if (params.source) await this.utmSourceInput.fill(params.source);
    if (params.medium) await this.utmMediumInput.fill(params.medium);
    if (params.campaign) await this.utmCampaignInput.fill(params.campaign);
    if (params.content) await this.utmContentInput.fill(params.content);
    if (params.term) await this.utmTermInput.fill(params.term);
    if (params.id) await this.utmIdInput.fill(params.id);
  }

  async clearAllInputs() {
    await this.linkToTrackInput.fill('');
    // UTM fields will be hidden when main input is cleared
  }

  // Assertions
  async expectTrackingFormVisible() {
    // Use unique elements that only appear when form is visible
    await expect(this.utmSourceInput).toBeVisible();
    await expect(this.page.getByText('The link will automatically update as you fill in the form')).toBeVisible();
  }

  async expectTrackingFormHidden() {
    await expect(this.utmSourceInput).not.toBeVisible();
  }

  async expectFinalLinkSectionVisible() {
    await expect(this.page.getByText("Here's your tracking link")).toBeVisible();
    await expect(this.page.getByText("Copy and paste it wherever you need it.")).toBeVisible();
  }

  async expectFinalLinkSectionHidden() {
    await expect(this.page.getByText("Here's your tracking link")).not.toBeVisible();
  }

  async expectUtmFieldsVisible() {
    await expect(this.utmSourceInput).toBeVisible();
    await expect(this.utmMediumInput).toBeVisible();
    await expect(this.utmCampaignInput).toBeVisible();
    await expect(this.utmContentInput).toBeVisible();
    await expect(this.utmTermInput).toBeVisible();
    await expect(this.utmIdInput).toBeVisible();
  }

  async expectUtmFieldsHidden() {
    await expect(this.utmSourceInput).not.toBeVisible();
    await expect(this.utmMediumInput).not.toBeVisible();
    await expect(this.utmCampaignInput).not.toBeVisible();
    await expect(this.utmContentInput).not.toBeVisible();
    await expect(this.utmTermInput).not.toBeVisible();
    await expect(this.utmIdInput).not.toBeVisible();
  }

  async expectGeneratedLinkContains(expectedUrl: string) {
    // Both output locations should contain the expected URL
    for (const output of this.trackingLinkOutputs) {
      await expect(output).toContainText(expectedUrl);
    }
  }

  async expectGeneratedLinkContainsUtmParam(paramName: string, paramValue: string) {
    for (const output of this.trackingLinkOutputs) {
      const text = await output.textContent();
      const url = new URL(text!.trim());
      expect(url.searchParams.get(`utm_${paramName}`)).toBe(paramValue);
    }
  }

  async expectLinkPrefilledFromUrl(expectedUrl: string) {
    await expect(this.linkToTrackInput).toHaveValue(expectedUrl);
    await this.expectTrackingFormVisible();
    await this.expectFinalLinkSectionVisible();
  }

  // URL Construction Testing Helpers
  async getGeneratedLink(): Promise<string> {
    return await this.previewLink.textContent() || '';
  }

  async expectBaseUrlHandling(inputUrl: string, expectedBaseUrl: string) {
    await this.enterTrackingUrl(inputUrl);
    await this.expectGeneratedLinkContains(expectedBaseUrl);
  }

  async expectComplexUrlHandling(inputUrl: string, utmParams: Record<string, string>, expectedOutput: string) {
    await this.enterTrackingUrl(inputUrl);
    await this.fillUtmParameters(utmParams);
    await this.expectGeneratedLinkContains(expectedOutput);
  }
}