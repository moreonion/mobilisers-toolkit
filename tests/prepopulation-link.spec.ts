import { test, expect } from '@playwright/test';

test.describe('Prepopulation Link Generator', () => {
  test('should generate basic prepopulation URL with default fields', async ({ page }) => {
    await page.goto('/prepopulation-link');
    
    // Enter test URL
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/climate-petition');
    
    // Should see the generated link immediately with default checked fields
    await expect(page.locator('text=https://act.test-org.org/climate-petition#p:')).toBeVisible();
    
    // Should contain the default fields (first_name, last_name, email are checked by default)
    await expect(page.locator('text=first_name=')).toBeVisible();
    await expect(page.locator('text=last_name=')).toBeVisible();
    await expect(page.locator('text=email=')).toBeVisible();
  });

  test('should handle email provider selection', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    // Test Mailchimp (default)
    await expect(page.locator('text=*|FNAME|*')).toBeVisible();
    await expect(page.locator('text=*|LNAME|*')).toBeVisible();
    await expect(page.locator('text=*|EMAIL|*')).toBeVisible();
    
    // Switch to DotDigital
    await page.click('button:has-text("DotDigital")');
    await expect(page.locator('text=@FIRSTNAME@')).toBeVisible();
    await expect(page.locator('text=@LASTNAME@')).toBeVisible();
    await expect(page.locator('text=@EMAIL@')).toBeVisible();
    
    // Switch to CleverReach
    await page.click('button:has-text("CleverReach")');
    await expect(page.locator('text={firstname}')).toBeVisible();
    await expect(page.locator('text={lastname}')).toBeVisible();
    await expect(page.locator('text={email}')).toBeVisible();
  });

  test('should handle donation interval dropdown', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/donate');
    
    // Click customise fields
    await page.click('button:has-text("Customise fields")');
    
    // Find donation_interval row and select dropdown
    const donationIntervalRow = page.locator('tr:has(td:text("donation_interval"))');
    const checkbox = donationIntervalRow.locator('input[type="checkbox"]');
    const select = donationIntervalRow.locator('select');
    
    // Initially unchecked
    await expect(checkbox).not.toBeChecked();
    
    // Select "Monthly"
    await select.selectOption('m');
    await expect(checkbox).toBeChecked();
    await expect(page.locator('text=donation_interval=m').first()).toBeVisible();
    
    // Select "Annual"
    await select.selectOption('y');
    await expect(page.locator('text=donation_interval=y').first()).toBeVisible();
    
    // Select "Single"
    await select.selectOption('1');
    await expect(page.locator('text=donation_interval=1').first()).toBeVisible();
  });

  test('should handle donation amount number validation', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/donate');
    
    await page.click('button:has-text("Customise fields")');
    
    const donationAmountRow = page.locator('tr:has(td:text("donation_amount"))');
    const checkbox = donationAmountRow.locator('input[type="checkbox"]');
    const numberInput = donationAmountRow.locator('input[type="number"]');
    
    // Test valid positive numbers
    await numberInput.fill('25');
    await numberInput.dispatchEvent('change');
    await expect(checkbox).toBeChecked();
    await expect(page.locator('text=donation_amount=25').first()).toBeVisible();
    
    await numberInput.fill('100');
    await numberInput.dispatchEvent('change');
    await expect(page.locator('text=donation_amount=100').first()).toBeVisible();
    
    // Test clearing field unchecks checkbox
    await numberInput.fill('');
    await numberInput.dispatchEvent('change');
    await expect(checkbox).not.toBeChecked();
    
    // Test that negative numbers don't work (should be cleared by oninput)
    await numberInput.fill('-5');
    await page.waitForTimeout(100);
    // Should be cleared and checkbox unchecked
    await expect(checkbox).not.toBeChecked();
  });

  test('should handle custom fields', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    await page.click('button:has-text("Customise fields")');
    
    // Add a custom field
    await page.click('button:has-text("Add a field")');
    
    // Find the custom field row
    const customFieldRow = page.locator('tr').last();
    const formKeyInput = customFieldRow.locator('input[placeholder="Impact Stack form key"]');
    const tokenInput = customFieldRow.locator('input[placeholder*="Merge"]');
    const checkbox = customFieldRow.locator('input[type="checkbox"]');
    
    // Initially should be checked (new fields start checked)
    await expect(checkbox).toBeChecked();
    
    // Add form key and token
    await formKeyInput.fill('organization');
    await formKeyInput.dispatchEvent('change');
    await tokenInput.fill('*|ORG|*');
    await tokenInput.dispatchEvent('change');
    
    // Should appear in URL
    await expect(page.locator('text=organization=*|ORG|*').first()).toBeVisible();
  });

  test('should handle field toggling with checkboxes', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    await page.click('button:has-text("Customise fields")');
    
    // Find postcode field (should be unchecked by default)
    const postcodeRow = page.locator('tr:has(td:text("postcode"))');
    const postcodeCheckbox = postcodeRow.locator('input[type="checkbox"]');
    const postcodeTokenInput = postcodeRow.locator('input[type="text"]');
    
    // Initially, postcode field should not be in URL (unchecked and no token)
    await expect(postcodeCheckbox).not.toBeChecked();
    
    // Enter a token value - should auto-check
    await postcodeTokenInput.fill('custom_postcode_token');
    await postcodeTokenInput.dispatchEvent('change');
    await expect(postcodeCheckbox).toBeChecked();
    await expect(page.locator('text=postcode=custom_postcode_token').first()).toBeVisible();
    
    // Clear the token - should auto-uncheck
    await postcodeTokenInput.fill('');
    await postcodeTokenInput.dispatchEvent('change');
    await expect(postcodeCheckbox).not.toBeChecked();
  });

  test('should have tracking link button that navigates to tracking page', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    // Should have "Add tracking" button that links to tracking-link page
    const trackingButton = page.locator('a:has-text("Add tracking")');
    await expect(trackingButton).toBeVisible();
    
    // Button should have correct href to tracking-link page with encoded URL
    const href = await trackingButton.getAttribute('href');
    expect(href).toContain('/tracking-link?url=');
    expect(href).toContain(encodeURIComponent('https://act.test-org.org/petition#p:'));
  });

  test('should handle "Other" email provider', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    // Switch to "Other" provider
    await page.click('button:has-text("Other")');
    
    // Should automatically show customise fields
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Add the relevant token for each form field')).toBeVisible();
    
    // Tokens should be empty
    const emailRow = page.locator('tr:has(td:text("email"))');
    const emailTokenInput = emailRow.locator('input[type="text"]');
    await expect(emailTokenInput).toHaveValue('');
    
    // Add custom tokens
    await emailTokenInput.fill('{email}');
    await emailTokenInput.dispatchEvent('change');
    await expect(page.locator('text=email={email}').first()).toBeVisible();
  });

  test('should validate URL input', async ({ page }) => {
    await page.goto('/prepopulation-link');
    
    // Invalid URL should not show link generator
    await page.fill('input[name="actionPage"]', 'not-a-url');
    await expect(page.locator('text=#p:')).not.toBeVisible();
    
    // Valid URL should show link generator
    await page.fill('input[name="actionPage"]', 'https://act.example.org/test');
    await expect(page.locator('text=https://act.example.org/test#p:')).toBeVisible();
  });

  test('should handle complex URL with existing parameters', async ({ page }) => {
    await page.goto('/prepopulation-link');
    
    // URL with existing query parameters
    await page.fill('input[name="actionPage"]', 'https://act.test.org/petition?utm_source=email&utm_campaign=climate');
    
    // Should preserve existing parameters and add fragment
    await expect(page.locator('text=utm_source=email')).toBeVisible();
    await expect(page.locator('text=first_name=*|FNAME|*')).toBeVisible();
  });

  test('should update provider tokens when switching providers', async ({ page }) => {
    await page.goto('/prepopulation-link');
    await page.fill('input[name="actionPage"]', 'https://act.test.org/petition');
    
    await page.click('button:has-text("Customise fields")');
    
    // Test provider switching updates tokens correctly
    await expect(page.locator('text=first_name=*|FNAME|*').first()).toBeVisible(); // Mailchimp default
    
    // Switch to DotDigital
    await page.click('button:has-text("DotDigital")');
    await page.waitForTimeout(100); // Allow time for provider switch
    await expect(page.locator('text=first_name=@FIRSTNAME@').first()).toBeVisible();
    await expect(page.locator('text=last_name=@LASTNAME@').first()).toBeVisible();
    
    // Switch back to Mailchimp
    await page.click('button:has-text("Mailchimp")');
    await page.waitForTimeout(100); // Allow time for provider switch
    await expect(page.locator('text=first_name=*|FNAME|*').first()).toBeVisible();
    await expect(page.locator('text=last_name=*|LNAME|*').first()).toBeVisible();
    
    // Test that custom field values are preserved when switching providers
    const donationRow = page.locator('tr:has(td:text("donation_amount"))');
    const donationInput = donationRow.locator('input[type="number"]');
    const donationCheckbox = donationRow.locator('input[type="checkbox"]');
    
    await donationInput.fill('50');
    await donationInput.dispatchEvent('change');
    await expect(donationCheckbox).toBeChecked();
    await expect(page.locator('text=donation_amount=50').first()).toBeVisible();
    
    // Switch providers - custom values should be preserved
    await page.click('button:has-text("DotDigital")');
    await page.waitForTimeout(100);
    await expect(donationCheckbox).toBeChecked(); // Value is preserved
    await expect(page.locator('text=donation_amount=50').first()).toBeVisible();
  });
});