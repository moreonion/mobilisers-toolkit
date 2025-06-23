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

  // Sections that appear conditionally - using unique identifiers to avoid strict mode violations
  get trackingFormSection() {
    // Target the section that contains the first #trackingLinkWrapper (preview section)
    return this.page.locator('section').filter({ has: this.page.locator('#trackingLinkWrapper') }).first();
  }

  get finalTrackingLinkSection() {
    // Target the final output section by its unique text
    return this.page.getByText("Here's your tracking link").locator('..');
  }

  get trackingLinkOutputs() {
    return this.page.locator('#trackingLinkWrapper p');
  }

  // UTM form container (the div that contains all UTM inputs)
  get utmFormContainer() {
    return this.page.locator('#utmSource').locator('../..');
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
    const outputs = await this.trackingLinkOutputs.all();
    for (const output of outputs) {
      await expect(output).toContainText(expectedUrl);
    }
  }

  async expectGeneratedLinkContainsUtmParam(paramName: string, paramValue: string) {
    // The app uses URL encoding where spaces become + instead of %20
    const expectedParam = `utm_${paramName}=${encodeURIComponent(paramValue).replace(/%20/g, '+')}`;
    
    const outputs = await this.trackingLinkOutputs.all();
    for (const output of outputs) {
      await expect(output).toContainText(expectedParam);
    }
  }

  async expectLinkPrefilledFromUrl(expectedUrl: string) {
    await expect(this.linkToTrackInput).toHaveValue(expectedUrl);
    await this.expectTrackingFormVisible();
    await this.expectFinalLinkSectionVisible();
  }

  // URL Construction Testing Helpers
  async getGeneratedLink(): Promise<string> {
    // Get the text from the first output element
    const firstOutput = this.trackingLinkOutputs.first();
    return await firstOutput.textContent() || '';
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