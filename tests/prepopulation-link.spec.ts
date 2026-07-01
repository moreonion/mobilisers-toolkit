import { test, expect } from '@playwright/test';
import { PrepopulationLinkPage } from './pages/prepopulation-link-page';

test.describe('Prepopulation Link Generator', () => {
  let prepopPage: PrepopulationLinkPage;

  test.beforeEach(async ({ page }) => {
    prepopPage = new PrepopulationLinkPage(page);
  });

  test('should generate basic prepopulation URL with default fields', async ({ page }) => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/climate-petition');

    // Should see the generated link immediately with default checked fields
    await expect(page.locator('text=https://act.test-org.org/climate-petition#p:')).toBeVisible();

    // Should contain the default fields (first_name, last_name, email are checked by default)
    await prepopPage.expectGeneratedLinkContains('first_name=');
    await prepopPage.expectGeneratedLinkContains('last_name=');
    await prepopPage.expectGeneratedLinkContains('email=');
  });

  test('should handle email provider selection', async () => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/petition');

    // Test Mailchimp (default)
    await prepopPage.expectGeneratedLinkContains('*|FNAME|*');
    await prepopPage.expectGeneratedLinkContains('*|LNAME|*');
    await prepopPage.expectGeneratedLinkContains('*|EMAIL|*');

    // Switch to DotDigital
    await prepopPage.switchProvider('DotDigital');
    await prepopPage.expectGeneratedLinkContains('@FIRSTNAME@');
    await prepopPage.expectGeneratedLinkContains('@LASTNAME@');
    await prepopPage.expectGeneratedLinkContains('@EMAIL@');
  });

  test('should handle donation interval dropdown', async () => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/donate');

    // Click customise fields
    await prepopPage.openCustomiseFields();

    // Find donation interval checkbox and select dropdown
    const checkbox = prepopPage.fieldPrefillToggle('Donation Interval');

    // Initially unchecked
    await expect(checkbox).not.toBeChecked();

    // Select "Monthly"
    await prepopPage.selectFieldToken('Donation Interval', 'm');
    await expect(checkbox).toBeChecked();
    await prepopPage.expectGeneratedLinkContains('donation_interval=m');

    // Select "Annual"
    await prepopPage.selectFieldToken('Donation Interval', 'y');
    await prepopPage.expectGeneratedLinkContains('donation_interval=y');

    // Select "Single"
    await prepopPage.selectFieldToken('Donation Interval', '1');
    await prepopPage.expectGeneratedLinkContains('donation_interval=1');
  });

  test('should handle donation amount number validation', async () => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/donate');

    await prepopPage.openCustomiseFields();

    const checkbox = prepopPage.fieldPrefillToggle('Donation Amount');

    // Test valid positive numbers
    await prepopPage.fillFieldToken('Donation Amount', '25');
    await expect(checkbox).toBeChecked();
    await prepopPage.expectGeneratedLinkContains('donation_amount=25');

    await prepopPage.fillFieldToken('Donation Amount', '100');
    await prepopPage.expectGeneratedLinkContains('donation_amount=100');

    // Test clearing field unchecks checkbox
    await prepopPage.fillFieldToken('Donation Amount', '');
    await expect(checkbox).not.toBeChecked();

    // Test that negative numbers don't work (should be cleared by oninput)
    await prepopPage.fieldToken('Donation Amount').fill('-5');
    // Should be cleared and checkbox unchecked
    await expect(checkbox).not.toBeChecked();
  });

  test('should handle custom fields', async () => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/petition');

    await prepopPage.openCustomiseFields();

    // Add a custom field
    await prepopPage.addCustomField();

    // Find the custom field row
    const checkbox = prepopPage.fieldPrefillToggle('Custom field');

    // Initially should be checked (new fields start checked)
    await expect(checkbox).toBeChecked();

    // Add form key and token
    await prepopPage.fillCustomFieldFormKey('organization');
    await prepopPage.fillFieldToken('Custom field', '*|ORG|*');

    // Should appear in URL
    await prepopPage.expectGeneratedLinkContains('organization=*|ORG|*');
  });

  test('should handle field toggling with checkboxes', async () => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/petition');

    await prepopPage.openCustomiseFields();

    // Find postcode field (should be unchecked by default)
    const postcodeCheckbox = prepopPage.fieldPrefillToggle('Postcode');

    // Initially, postcode field should not be in URL (unchecked and no token)
    await expect(postcodeCheckbox).not.toBeChecked();

    // Enter a token value - should auto-check
    await prepopPage.fillFieldToken('Postcode', 'custom_postcode_token');
    await expect(postcodeCheckbox).toBeChecked();
    await prepopPage.expectGeneratedLinkContains('postcode=custom_postcode_token');

    // Clear the token - should auto-uncheck
    await prepopPage.fillFieldToken('Postcode', '');
    await expect(postcodeCheckbox).not.toBeChecked();
  });

  test('should have tracking link button that navigates to tracking page', async () => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/petition');

    // Should have "Add tracking" button that links to tracking-link page
    await expect(prepopPage.trackingLinkButton).toBeVisible();

    // Button should have correct href to tracking-link page with encoded URL
    const href = await prepopPage.trackingLinkButton.getAttribute('href');
    expect(href).toContain('/tracking-link?url=');
    expect(href).toContain(encodeURIComponent('https://act.test-org.org/petition#p:'));
  });

  test('should handle "Other" email provider', async ({ page }) => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test-org.org/petition');

    // Switch to "Other" provider
    await prepopPage.switchProvider('Other');

    // Should automatically show customise fields
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Add the relevant token for each form field')).toBeVisible();

    // Tokens should be empty
    const emailTokenInput = prepopPage.fieldToken('Email');
    await expect(emailTokenInput).toHaveValue('');

    // Add custom tokens
    await prepopPage.fillFieldToken('Email', '{email}');
    await prepopPage.expectGeneratedLinkContains('email={email}');
  });

  test('should validate URL input', async () => {
    await prepopPage.goto();

    // Invalid URL should not show link generator
    await prepopPage.fillActionPageUrl('not-a-url');
    await prepopPage.expectGeneratedLinkNotContains('#p:');

    // Valid URL should show link generator
    await prepopPage.fillActionPageUrl('https://act.example.org/test');
    await prepopPage.expectGeneratedLinkContains('https://act.example.org/test#p:');
  });

  test('should handle complex URL with existing parameters', async () => {
    await prepopPage.goto();

    // URL with existing query parameters
    await prepopPage.fillActionPageUrl('https://act.test.org/petition?utm_source=email&utm_campaign=climate');

    // Should preserve existing parameters and add fragment
    await prepopPage.expectGeneratedLinkContains('utm_source=email');
    await prepopPage.expectGeneratedLinkContains('first_name=*|FNAME|*');
  });

  test('should update provider tokens when switching providers', async () => {
    await prepopPage.goto();
    await prepopPage.fillActionPageUrl('https://act.test.org/petition');

    await prepopPage.openCustomiseFields();

    // Test provider switching updates tokens correctly
    await prepopPage.expectGeneratedLinkContains('first_name=*|FNAME|*'); // Mailchimp default

    // Switch to DotDigital
    await prepopPage.switchProvider('DotDigital');
    await prepopPage.expectGeneratedLinkContains('first_name=@FIRSTNAME@');
    await prepopPage.expectGeneratedLinkContains('last_name=@LASTNAME@');

    // Switch back to Mailchimp
    await prepopPage.switchProvider('Mailchimp');
    await prepopPage.expectGeneratedLinkContains('first_name=*|FNAME|*');
    await prepopPage.expectGeneratedLinkContains('last_name=*|LNAME|*');

    // Test that custom field values are preserved when switching providers
    const donationCheckbox = prepopPage.fieldPrefillToggle('Donation Amount');

    await prepopPage.fillFieldToken('Donation Amount', '50');
    await expect(donationCheckbox).toBeChecked();
    await prepopPage.expectGeneratedLinkContains('donation_amount=50');

    // Switch providers - custom values should be preserved
    await prepopPage.switchProvider('DotDigital');
    await expect(donationCheckbox).toBeChecked(); // Value is preserved
    await prepopPage.expectGeneratedLinkContains('donation_amount=50');
  });
});
