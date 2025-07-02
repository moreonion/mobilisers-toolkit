import { test, expect } from '@playwright/test';
import { TrackingLinkPage } from './pages/tracking-link-page';

test.describe('Tracking Link Generator', () => {
  let trackingPage: TrackingLinkPage;

  test.beforeEach(async ({ page }) => {
    trackingPage = new TrackingLinkPage(page);
  });

  test('should load page and show correct initial state', async () => {
    await trackingPage.goto();

    // Main input should be visible and focused
    await expect(trackingPage.linkToTrackInput).toBeVisible();
    await expect(trackingPage.linkToTrackInput).toBeFocused();

    // UTM form should be hidden initially
    await trackingPage.expectTrackingFormHidden();
    await trackingPage.expectFinalLinkSectionHidden();
    await trackingPage.expectUtmFieldsHidden();
  });

  test('should show tracking form when URL is entered', async () => {
    await trackingPage.goto();

    await trackingPage.enterTrackingUrl('https://act.example.org/petition');

    // Form sections should appear
    await trackingPage.expectTrackingFormVisible();
    await trackingPage.expectFinalLinkSectionVisible();
    await trackingPage.expectUtmFieldsVisible();

    // Should show basic tracking link without UTM parameters
    await trackingPage.expectGeneratedLinkContains('https://act.example.org/petition');
  });

  test('should hide tracking form when URL is cleared', async () => {
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

  test('should handle URL prepopulation from query parameter', async () => {
    const testUrl = 'https://act.example.org/climate-action';

    await trackingPage.gotoWithUrl(testUrl);

    // Should prefill input and show form
    await trackingPage.expectLinkPrefilledFromUrl(testUrl);
    await trackingPage.expectGeneratedLinkContains(testUrl);
  });

  test('should generate UTM parameters correctly', async () => {
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

  test('should handle URLs without protocol by auto-prefixing https', async () => {
    await trackingPage.goto();

    await trackingPage.expectBaseUrlHandling(
      'act.example.org/petition',
      'https://act.example.org/petition'
    );
  });

  test('should preserve existing query parameters', async () => {
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

  test('should handle special characters in UTM parameters', async () => {
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

  test('should handle URLs with fragments/hash', async () => {
    await trackingPage.goto();

    // Test URL with hash that contains query parameters (edge case from store logic)
    const urlWithHashQuery = 'https://act.example.org/petition#section?existing=param';
    await trackingPage.enterTrackingUrl(urlWithHashQuery);

    await trackingPage.fillUtmParameters({
      source: 'newsletter'
    });

    // Should handle hash parameters correctly based on store logic
    const generatedLink = await trackingPage.getGeneratedLink();
    expect(generatedLink).toContain('utm_source=newsletter');
    expect(generatedLink).toContain('existing=param');
  });

  test('should handle empty UTM fields gracefully', async () => {
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

  test('should handle invalid URLs gracefully', async () => {
    await trackingPage.goto();

    // Based on actual behavior, the app auto-prefixes https:// to invalid URLs
    await trackingPage.linkToTrackInput.fill('not-a-valid-url');

    // Form should still appear (based on component logic)
    await trackingPage.expectTrackingFormVisible();
    await trackingPage.expectFinalLinkSectionVisible();

    // The app auto-prefixes https:// to make invalid URLs valid
    await trackingPage.expectGeneratedLinkContains('https://not-a-valid-url/');
  });

  test('should handle multiple protocol schemes correctly', async () => {
    await trackingPage.goto();

    // Test different valid protocols based on store logic
    const testCases = [
      'https://act.example.org/petition',
      'http://act.example.org/petition',
      'mailto:test@example.org',
      'fb-messenger://share?link=test'
    ];

    for (const testUrl of testCases) {
      await trackingPage.linkToTrackInput.fill(testUrl);
      await trackingPage.fillUtmParameters({ source: 'test' });

      // Should generate valid tracking link for supported protocols
      await trackingPage.expectGeneratedLinkContains(testUrl);

      // Clear for next test
      await trackingPage.clearAllInputs();
    }
  });

  test('should maintain state when switching between URLs', async () => {
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

  test('should show duplicate tracking link outputs', async () => {
    await trackingPage.goto();
    await trackingPage.enterTrackingUrl('https://act.example.org/petition');

    // Based on component structure, there are two identical outputs
    const outputs = await trackingPage.trackingLinkOutputs.all();
    expect(outputs.length).toBe(2);

    // Both should show the same content
    const firstText = await outputs[0].textContent();
    const secondText = await outputs[1].textContent();
    expect(firstText).toBe(secondText);
    expect(firstText).toContain('https://act.example.org/petition');
  });

  test('should handle real-world campaign scenario', async () => {
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

    // Verify complete tracking link structure - expect + encoding for spaces
    expect(generatedLink).toContain('https://act.greenpeace.org/save-the-arctic');
    expect(generatedLink).toContain('utm_source=facebook');
    expect(generatedLink).toContain('utm_medium=social');
    expect(generatedLink).toContain('utm_campaign=save-arctic-2024');
    expect(generatedLink).toContain('utm_content=video-post');
    expect(generatedLink).toContain('utm_term=arctic+climate+change');

    // Should be a valid URL
    expect(() => new URL(generatedLink)).not.toThrow();
  });
});