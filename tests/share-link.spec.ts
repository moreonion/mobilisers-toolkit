import { test, expect } from '@playwright/test';

test.describe('Share Link Generator', () => {
  test('should generate basic share links with URL input', async ({ page }) => {
    await page.goto('/share-link');
    
    // Enter test URL
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/climate-petition');
    
    // Should see the share links section appear
    await expect(page.getByText('Here are the share links')).toBeVisible();
    
    // Check that all expected platforms are present
    await expect(page.getByRole('region', { name: 'Facebook share options' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Twitter / X share options' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'WhatsApp share options' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Facebook Messenger share options' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Email share options' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Blue Sky share options' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'LinkedIn share options' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Threads share options' })).toBeVisible();
    
    // Check that basic URLs are generated correctly
    await expect(page.locator('text=facebook.com/sharer/sharer.php')).toBeVisible();
    await expect(page.locator('text=x.com/intent/tweet')).toBeVisible();
    await expect(page.locator('text=wa.me/')).toBeVisible();
    await expect(page.locator('text=mailto:')).toBeVisible();
  });

  test('should handle Twitter/X text input and character count', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/petition');
    
    // Find Twitter section
    const twitterSection = page.getByRole('region', { name: 'Twitter / X share options' });
    await expect(twitterSection).toBeVisible();
    
    // Find the Twitter textarea
    const twitterTextarea = page.getByLabel('Twitter template text');
    await expect(twitterTextarea).toBeVisible();
    
    // Initially should show 0 characters
    await expect(page.locator('text=0 characters')).toBeVisible();
    
    // Add some text
    const testText = 'Check out this important climate petition!';
    await twitterTextarea.fill(testText);
    
    // Should show character count
    await expect(page.locator(`text=${testText.length} characters`)).toBeVisible();
    
    // Twitter URL should include the text
    await expect(page.locator('text=text=Check%20out%20this%20important%20climate%20petition!')).toBeVisible();
    
    // Test character limit (280 chars)
    const longText = 'a'.repeat(300);
    await twitterTextarea.fill(longText);
    
    // Should be truncated to 280 characters
    const actualValue = await twitterTextarea.inputValue();
    expect(actualValue.length).toBe(280);
  });

  test('should handle Twitter hashtags with Tags component', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/petition');
    
    const twitterSection = page.getByRole('region', { name: 'Twitter / X share options' });
    
    // Find the hashtags input
    const hashtagsInput = twitterSection.getByPlaceholder(/hashtags/);
    await expect(hashtagsInput).toBeVisible();
    
    // Add a hashtag
    await hashtagsInput.fill('climate');
    await hashtagsInput.press('Enter');
    
    // Should see the hashtag tag appear
    await expect(twitterSection.locator('.tagWrapper:has-text("climate")')).toBeVisible();
    
    // Add another hashtag
    await hashtagsInput.fill('environment');
    await hashtagsInput.press('Enter');
    
    await expect(twitterSection.locator('.tagWrapper:has-text("environment")')).toBeVisible();
    
    // Twitter URL should include hashtags
    await expect(page.locator('text=hashtags=climate,environment')).toBeVisible();
    
    // Test removing a hashtag
    await twitterSection.locator('.tagWrapper:has-text("climate") .removeTagButton').click();
    
    // Should only show environment hashtag in URL
    await expect(page.locator('text=hashtags=environment')).toBeVisible();
    await expect(page.locator('text=hashtags=climate,environment')).not.toBeVisible();
  });

  test('should handle WhatsApp text input', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/petition');
    
    const whatsappSection = page.getByRole('region', { name: 'WhatsApp share options' });
    await expect(whatsappSection).toBeVisible();
    
    // Find WhatsApp textarea
    const whatsappTextarea = page.getByLabel('WhatsApp template text');
    await expect(whatsappTextarea).toBeVisible();
    
    // Add text
    const testText = 'Please sign this important petition!';
    await whatsappTextarea.fill(testText);
    
    // Should see WhatsApp URL with encoded text
    await expect(whatsappSection.getByText('wa.me')).toBeVisible();
    await expect(whatsappSection.getByText('Please%20sign%20this%20important%20petition!')).toBeVisible();
    
    // Should also include the original URL in the WhatsApp link 
    await expect(whatsappSection.getByText('%0A%0Ahttps%3A%2F%2Fact.test-org.org%2Fpetition')).toBeVisible();
  });

  test('should handle Email subject and body inputs', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/petition');
    
    const emailSection = page.getByRole('region', { name: 'Email share options' });
    await expect(emailSection).toBeVisible();
    
    // Find email inputs
    const subjectInput = page.getByLabel('Email subject');
    const bodyTextarea = page.getByLabel('Email body text');
    
    await expect(subjectInput).toBeVisible();
    await expect(bodyTextarea).toBeVisible();
    
    // Add subject
    await subjectInput.fill('Important Climate Petition');
    
    // Add body text
    await bodyTextarea.fill('I thought you might be interested in this petition about climate action.');
    
    // Should see mailto URL within the Email section
    await expect(emailSection.getByText('mailto:')).toBeVisible();
    await expect(emailSection.getByText('subject=Important%20Climate%20Petition')).toBeVisible();
    
    // Should see encoded body text in mailto URL
    await expect(emailSection.getByText('I%20thought%20you%20might%20be%20interested')).toBeVisible();
    
    // Should include the original URL in email body
    await expect(emailSection.getByText('https%3A%2F%2Fact.test-org.org%2Fpetition')).toBeVisible();
  });

  test('should handle Blue Sky text input', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/petition');
    
    const blueSkySection = page.getByRole('region', { name: 'Blue Sky share options' });
    await expect(blueSkySection).toBeVisible();
    
    // Find Blue Sky textarea
    const blueSkyTextarea = page.getByLabel('Blue Sky template text');
    await expect(blueSkyTextarea).toBeVisible();
    
    // Add text
    const testText = 'Join me in supporting this cause!';
    await blueSkyTextarea.fill(testText);
    
    // Should see Blue Sky URL with encoded text
    await expect(page.locator('text=bsky.app/intent/compose')).toBeVisible();
    await expect(page.locator('text=Join%20me%20in%20supporting%20this%20cause!')).toBeVisible();
  });

  test('should handle LinkedIn text input', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/petition');
    
    const linkedInSection = page.getByRole('region', { name: 'LinkedIn share options' });
    await expect(linkedInSection).toBeVisible();
    
    // Find LinkedIn textarea
    const linkedInTextarea = page.getByLabel('LinkedIn template text');
    await expect(linkedInTextarea).toBeVisible();
    
    // Add text
    const testText = 'Professional networks can drive change too!';
    await linkedInTextarea.fill(testText);
    
    // Should see LinkedIn URL with encoded text
    await expect(page.locator('text=linkedin.com/feed')).toBeVisible();
    await expect(page.locator('text=Professional%20networks%20can%20drive%20change%20too!')).toBeVisible();
    
    // Should show LinkedIn warning message
    await expect(page.locator('text=LinkedIn appears to change the format')).toBeVisible();
  });

  test('should handle Threads text input', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test-org.org/petition');
    
    const threadsSection = page.getByRole('region', { name: 'Threads share options' });
    await expect(threadsSection).toBeVisible();
    
    // Find Threads input
    const threadsInput = page.getByLabel('Threads template text');
    await expect(threadsInput).toBeVisible();
    
    // Add text
    const testText = 'Check this out on Threads!';
    await threadsInput.fill(testText);
    
    // Should see Threads URL
    await expect(page.locator('text=threads.net/intent/post')).toBeVisible();
    await expect(page.locator('text=Check%20this%20out%20on%20Threads!')).toBeVisible();
  });

  test('should handle URL parameter pre-filling', async ({ page }) => {
    // Test with URL parameter
    const testUrl = 'https://act.example.org/campaign';
    await page.goto(`/share-link?url=${encodeURIComponent(testUrl)}`);
    
    // Input should be pre-filled
    const actionPageInput = page.getByLabel('Enter the link you want to be shareable');
    await expect(actionPageInput).toHaveValue(testUrl);
    
    // Share links should be generated automatically
    await expect(page.getByText('Here are the share links')).toBeVisible();
    // The URL appears in all share links, so just verify one specific platform
    await expect(page.getByRole('region', { name: 'Facebook share options' }).getByText('https%3A%2F%2Fact.example.org%2Fcampaign')).toBeVisible();
  });

  test('should validate URL input', async ({ page }) => {
    await page.goto('/share-link');
    
    const actionPageInput = page.getByLabel('Enter the link you want to be shareable');
    
    // Start with valid URL to show share links
    await actionPageInput.fill('https://act.example.org/petition');
    await expect(page.getByText('Here are the share links')).toBeVisible();
    
    // Invalid URL should still show share links (component shows links for any non-empty input)
    await actionPageInput.fill('not-a-valid-url');
    await expect(page.getByText('Here are the share links')).toBeVisible();
    
    // Valid URL should show share links
    await actionPageInput.fill('https://act.example.org/petition');
    await expect(page.getByText('Here are the share links')).toBeVisible();
    
    // Clear input should hide share links
    await actionPageInput.fill('');
    await expect(page.getByText('Here are the share links')).not.toBeVisible();
  });

  test('should handle complex URLs with existing parameters', async ({ page }) => {
    await page.goto('/share-link');
    
    // URL with existing query parameters
    const complexUrl = 'https://act.test.org/petition?utm_source=email&utm_campaign=climate';
    await page.getByLabel('Enter the link you want to be shareable').fill(complexUrl);
    
    // Should preserve the full URL in share links
    await expect(page.getByText('Here are the share links')).toBeVisible();
    // Check that URL parameters are preserved by looking for the Facebook share URL specifically
    await expect(page.getByText('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fact.test.org%2Fpetition%3Futm_source%3Demail%26utm_campaign%3Dclimate')).toBeVisible();
  });

  test('should handle URLs without protocol', async ({ page }) => {
    await page.goto('/share-link');
    
    // URL without https://
    await page.getByLabel('Enter the link you want to be shareable').fill('act.example.org/petition');
    
    // Should still generate share links (auto-prefixed with https://)
    await expect(page.getByText('Here are the share links')).toBeVisible();
    // Check that https:// was auto-prefixed in a specific platform
    await expect(page.getByRole('region', { name: 'Facebook share options' }).getByText('https%3A%2F%2Fact.example.org%2Fpetition')).toBeVisible();
  });

  test('should maintain input values when switching between platforms', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test.org/petition');
    
    // Add Twitter text
    const twitterTextarea = page.getByLabel('Twitter template text');
    await twitterTextarea.fill('Twitter message');
    
    // Add WhatsApp text
    const whatsappTextarea = page.getByLabel('WhatsApp template text');
    await whatsappTextarea.fill('WhatsApp message');
    
    // Add Email subject and body
    const emailSubject = page.getByLabel('Email subject');
    const emailBody = page.getByLabel('Email body text');
    await emailSubject.fill('Email subject');
    await emailBody.fill('Email body text');
    
    // Check that all values are preserved in their respective URLs
    await expect(page.locator('text=Twitter%20message')).toBeVisible();
    await expect(page.locator('text=WhatsApp%20message')).toBeVisible();
    await expect(page.locator('text=Email%20subject')).toBeVisible();
    await expect(page.locator('text=Email%20body%20text')).toBeVisible();
    
    // Change main URL and verify all custom text is maintained
    await page.getByLabel('Enter the link you want to be shareable').fill('https://different-url.org/new-petition');
    
    // All platform-specific text should still be there
    await expect(twitterTextarea).toHaveValue('Twitter message');
    await expect(whatsappTextarea).toHaveValue('WhatsApp message');
    await expect(emailSubject).toHaveValue('Email subject');
    await expect(emailBody).toHaveValue('Email body text');
  });

  test('should handle special characters in text inputs', async ({ page }) => {
    await page.goto('/share-link');
    await page.getByLabel('Enter the link you want to be shareable').fill('https://act.test.org/petition');
    
    // Test special characters in Twitter
    const twitterTextarea = page.getByLabel('Twitter template text');
    const specialText = 'Sign this petition! #ClimateAction @everyone 🌍';
    await twitterTextarea.fill(specialText);
    
    // Should be properly encoded in the URL
    await expect(page.locator('text=Sign%20this%20petition!')).toBeVisible();
    await expect(page.locator('text=%40everyone')).toBeVisible(); // @ should be encoded
    
    // Test emoji and special chars in WhatsApp
    const whatsappTextarea = page.getByLabel('WhatsApp template text');
    await whatsappTextarea.fill('🌍 Save our planet! 💚');
    
    // Should handle emojis in encoding
    await expect(page.locator('text=Save%20our%20planet!')).toBeVisible();
  });
});