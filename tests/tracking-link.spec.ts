import { test, expect } from '@playwright/test';
import { TrackingLinkPage } from './pages/tracking-link-page';

test.describe('Tracking Link Generator', () => {
  let trackingPage: TrackingLinkPage;

  test.beforeEach(async ({ page }) => {
    trackingPage = new TrackingLinkPage(page);
  });

  test('should load page and show correct initial state', async ({ page }) => {
    await trackingPage.goto();
    
    // Main input should be visible and focused
    await expect(trackingPage.linkToTrackInput).toBeVisible();
    await expect(trackingPage.linkToTrackInput).toBeFocused();
    
    // UTM form should be hidden initially
    await trackingPage.expectTrackingFormHidden();
    await trackingPage.expectFinalLinkSectionHidden();
    await trackingPage.expectUtmFieldsHidden();
  });

  test('should show tracking form when URL is entered', async ({ page }) => {
    await trackingPage.goto();
    
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');
    
    // Form sections should appear
    await trackingPage.expectTrackingFormVisible();
    await trackingPage.expectFinalLinkSectionVisible();
    await trackingPage.expectUtmFieldsVisible();
    
    // Should show basic tracking link without UTM parameters
    await trackingPage.expectGeneratedLinkContains('https://act.example.org/petition');
  });

  test('should hide tracking form when URL is cleared', async ({ page }) => {
    await trackingPage.goto();
    
    // Enter URL first
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');
    await trackingPage.expectTrackingFormVisible();
    
    // Clear URL
    await trackingPage.clearAllInputs();
    
    // Form sections should disappear
    await trackingPage.expectTrackingFormHidden();
    await trackingPage.expectFinalLinkSectionHidden();
  });

  test('should handle URL prepopulation from query parameter', async ({ page }) => {
    const testUrl = 'https://act.example.org/climate-action';
    
    await trackingPage.gotoWithUrl(testUrl);
    
    // Should prefill input and show form
    await trackingPage.expectLinkPrefilledFromUrl(testUrl);
    await trackingPage.expectGeneratedLinkContains(testUrl);
  });

  test('should generate UTM parameters correctly', async ({ page }) => {
    await trackingPage.goto();
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');
    
    // Fill UTM parameters
    await trackingPage.fillUtmParameters({
      source: 'email',
      medium: 'newsletter',
      campaign: 'climate-action-2024',
      content: 'header-link',
      term: 'climate change',
      id: 'camp123'
    });
    
    // Check each UTM parameter appears in the generated link
    await trackingPage.expectGeneratedLinkContainsUtmParam('source', 'email');
    await trackingPage.expectGeneratedLinkContainsUtmParam('medium', 'newsletter');
    await trackingPage.expectGeneratedLinkContainsUtmParam('campaign', 'climate-action-2024');
    await trackingPage.expectGeneratedLinkContainsUtmParam('content', 'header-link');
    await trackingPage.expectGeneratedLinkContainsUtmParam('term', 'climate change');
    await trackingPage.expectGeneratedLinkContainsUtmParam('id', 'camp123');
  });

  test('should handle URLs without protocol by auto-prefixing https', async ({ page }) => {
    await trackingPage.goto();
    
    await trackingPage.expectBaseUrlHandling(
      'act.example.org/petition',
      'https://act.example.org/petition'
    );
  });

  test('should preserve existing query parameters', async ({ page }) => {
    await trackingPage.goto();
    
    const urlWithParams = 'https://act.example.org/petition?existing=param&another=value';
    await trackingPage.enterTrackingUrl(urlWithParams);
    
    await trackingPage.fillUtmParameters({
      source: 'facebook',
      campaign: 'social-media'
    });
    
    // Should contain both existing and new parameters
    await trackingPage.expectGeneratedLinkContains('existing=param');
    await trackingPage.expectGeneratedLinkContains('another=value');
    await trackingPage.expectGeneratedLinkContainsUtmParam('source', 'facebook');
    await trackingPage.expectGeneratedLinkContainsUtmParam('campaign', 'social-media');
  });

  test('should handle special characters in UTM parameters', async ({ page }) => {
    await trackingPage.goto();
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');
    
    await trackingPage.fillUtmParameters({
      source: 'social media',
      campaign: 'climate & environment',
      content: 'test@example.com',
      term: '#climateaction'
    });
    
    // Special characters should be URL encoded
    await trackingPage.expectGeneratedLinkContainsUtmParam('source', 'social media');
    await trackingPage.expectGeneratedLinkContainsUtmParam('campaign', 'climate & environment');
    await trackingPage.expectGeneratedLinkContainsUtmParam('content', 'test@example.com');
    await trackingPage.expectGeneratedLinkContainsUtmParam('term', '#climateaction');
  });

  test("moves query params found after # into the URL's search params", async ({ page }) => {
    await trackingPage.goto();

    const urlWithHashQuery = 'https://act.example.org/petition#section?existing=param';
    await trackingPage.enterTrackingUrl(urlWithHashQuery);

    await trackingPage.fillUtmParameters({
      source: 'newsletter'
    });

    const generatedLink = await trackingPage.getGeneratedLink();
    const url = new URL(generatedLink);
    expect(url.hash).toBe('#section');
    expect(url.searchParams.get('existing')).toBe('param');
    expect(url.searchParams.get('utm_source')).toBe('newsletter');
  });

  test('should handle empty UTM fields gracefully', async ({ page }) => {
    await trackingPage.goto();
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');
    
    // Fill only some UTM fields
    await trackingPage.fillUtmParameters({
      source: 'email',
      campaign: 'test-campaign'
      // Leave medium, content, term, id empty
    });
    
    // Should only include filled parameters
    await trackingPage.expectGeneratedLinkContainsUtmParam('source', 'email');
    await trackingPage.expectGeneratedLinkContainsUtmParam('campaign', 'test-campaign');
    
    // Empty parameters should not appear in URL
    const generatedLink = await trackingPage.getGeneratedLink();
    expect(generatedLink).not.toContain('utm_medium=');
    expect(generatedLink).not.toContain('utm_content=');
    expect(generatedLink).not.toContain('utm_term=');
    expect(generatedLink).not.toContain('utm_id=');
  });

  test('auto-adds https:// scheme when the input has no protocol', async ({ page }) => {
    await trackingPage.goto();

    await trackingPage.linkToTrackInput.fill('not-a-valid-url');

    await trackingPage.expectTrackingFormVisible();
    await trackingPage.expectFinalLinkSectionVisible();

    const generatedLink = await trackingPage.getGeneratedLink();
    const url = new URL(generatedLink);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('not-a-valid-url');
  });

  test('supports https: links (allow-listed protocol)', async ({ page }) => {
    await trackingPage.goto();

    const testUrl = 'https://act.example.org/petition';
    await trackingPage.linkToTrackInput.fill(testUrl);
    await trackingPage.fillUtmParameters({ source: 'test' });

    await trackingPage.expectGeneratedLinkContains(testUrl);
  });

  test('supports http: links (allow-listed protocol)', async ({ page }) => {
    await trackingPage.goto();

    const testUrl = 'http://act.example.org/petition';
    await trackingPage.linkToTrackInput.fill(testUrl);
    await trackingPage.fillUtmParameters({ source: 'test' });

    await trackingPage.expectGeneratedLinkContains(testUrl);
  });

  test('supports mailto: links (allow-listed protocol)', async ({ page }) => {
    await trackingPage.goto();

    const testUrl = 'mailto:test@example.org';
    await trackingPage.linkToTrackInput.fill(testUrl);
    await trackingPage.fillUtmParameters({ source: 'test' });

    await trackingPage.expectGeneratedLinkContains(testUrl);
  });

  test('supports fb-messenger: links (allow-listed protocol)', async ({ page }) => {
    await trackingPage.goto();

    const testUrl = 'fb-messenger://share?link=test';
    await trackingPage.linkToTrackInput.fill(testUrl);
    await trackingPage.fillUtmParameters({ source: 'test' });

    await trackingPage.expectGeneratedLinkContains(testUrl);
  });

  test('produces empty output for an unsupported protocol', async ({ page }) => {
    await trackingPage.goto();

    await trackingPage.linkToTrackInput.fill('javascript:alert(1)');
    await trackingPage.fillUtmParameters({ source: 'test' });

    const generatedLink = await trackingPage.getGeneratedLink();
    expect(generatedLink).toBe('');
  });

  test('should maintain state when switching between URLs', async ({ page }) => {
    await trackingPage.goto();
    
    // Enter first URL and UTM parameters
    await trackingPage.enterTrackingUrl('https://act.example.org/petition1');
    await trackingPage.fillUtmParameters({
      source: 'email',
      campaign: 'test'
    });
    
    // Verify initial state
    await trackingPage.expectGeneratedLinkContains('petition1');
    await trackingPage.expectGeneratedLinkContainsUtmParam('source', 'email');
    
    // Change URL but keep UTM parameters
    await trackingPage.linkToTrackInput.fill('https://act.example.org/petition2');
    
    // UTM fields should maintain their values
    await expect(trackingPage.utmSourceInput).toHaveValue('email');
    await expect(trackingPage.utmCampaignInput).toHaveValue('test');
    
    // Generated link should update with new URL but keep UTM params
    await trackingPage.expectGeneratedLinkContains('petition2');
    await trackingPage.expectGeneratedLinkContainsUtmParam('source', 'email');
  });

  test('should show the live link preview in the "Tracking link preview" region', async ({ page }) => {
    await trackingPage.goto();
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');

    await expect(trackingPage.previewRegion).toBeVisible();
    await expect(trackingPage.previewRegion).toContainText('https://act.example.org/petition');
  });

  test('should show the copy-friendly link in the "Tracking link output" region', async ({ page }) => {
    await trackingPage.goto();
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');

    await expect(trackingPage.outputRegion).toBeVisible();
    await expect(trackingPage.outputRegion).toContainText('https://act.example.org/petition');
  });

  test('should keep the preview and output links in sync', async ({ page }) => {
    await trackingPage.goto();
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');
    await trackingPage.fillUtmParameters({ source: 'newsletter' });

    const previewText = await trackingPage.previewLink.textContent();
    const outputText = await trackingPage.outputLink.textContent();

    expect(new URL(previewText!.trim())).toEqual(new URL(outputText!.trim()));
  });

  test('should handle real-world campaign scenario', async ({ page }) => {
    await trackingPage.goto();
    
    // Simulate real campaign setup
    await trackingPage.enterTrackingUrl('https://act.greenpeace.org/save-the-arctic');
    
    await trackingPage.fillUtmParameters({
      source: 'facebook',
      medium: 'social',
      campaign: 'save-arctic-2024',
      content: 'video-post',
      term: 'arctic climate change'
    });
    
    const generatedLink = await trackingPage.getGeneratedLink();
    const url = new URL(generatedLink);

    // Verify complete tracking link structure
    expect(url.origin + url.pathname).toBe('https://act.greenpeace.org/save-the-arctic');
    expect(url.searchParams.get('utm_source')).toBe('facebook');
    expect(url.searchParams.get('utm_medium')).toBe('social');
    expect(url.searchParams.get('utm_campaign')).toBe('save-arctic-2024');
    expect(url.searchParams.get('utm_content')).toBe('video-post');
    expect(url.searchParams.get('utm_term')).toBe('arctic climate change');
  });
});