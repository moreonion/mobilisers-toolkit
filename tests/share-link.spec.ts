import { test, expect } from '@playwright/test';

test.describe('Share Link Generator', () => {
  test('should generate basic share links with URL input', async ({ page }) => {
    await page.goto('/share-link');
    
    // Enter test URL
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/climate-petition');
    
    // Should see the share links section appear
    await expect(page.locator('text=Here are the share links')).toBeVisible();
    
    // Check that all expected platforms are present
    await expect(page.locator('text=Facebook').first()).toBeVisible();
    await expect(page.locator('text=Twitter / X').first()).toBeVisible();
    await expect(page.locator('text=WhatsApp').first()).toBeVisible();
    await expect(page.locator('text=Facebook Messenger').first()).toBeVisible();
    await expect(page.locator('text=Email').first()).toBeVisible();
    await expect(page.locator('text=Blue Sky').first()).toBeVisible();
    await expect(page.locator('text=LinkedIn').first()).toBeVisible();
    await expect(page.locator('text=Threads').first()).toBeVisible();
    
    // Check that basic URLs are generated correctly
    await expect(page.locator('text=facebook.com/sharer/sharer.php')).toBeVisible();
    await expect(page.locator('text=x.com/intent/tweet')).toBeVisible();
    await expect(page.locator('text=wa.me/')).toBeVisible();
    await expect(page.locator('text=mailto:')).toBeVisible();
  });

  test('should handle Twitter/X text input and character count', async ({ page }) => {
    await page.goto('/share-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    // Find Twitter section
    const twitterSection = page.locator('#twitter---x');
    await expect(twitterSection).toBeVisible();
    
    // Find the Twitter textarea
    const twitterTextarea = twitterSection.locator('#twitterTextarea');
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
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    const twitterSection = page.locator('#twitter---x');
    
    // Find the hashtags input
    const hashtagsInput = twitterSection.locator('input[placeholder*="hashtags"]');
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
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    const whatsappSection = page.locator('#whatsapp');
    await expect(whatsappSection).toBeVisible();
    
    // Find WhatsApp textarea
    const whatsappTextarea = whatsappSection.locator('textarea[placeholder*="WhatsApp"]');
    await expect(whatsappTextarea).toBeVisible();
    
    // Add text
    const testText = 'Please sign this important petition!';
    await whatsappTextarea.fill(testText);
    
    // Should see encoded text in the WhatsApp URL
    await expect(page.locator('text=Please%20sign%20this%20important%20petition!')).toBeVisible();
    
    // Should also include the original URL
    await expect(page.locator('text=https%3A//act.test-org.org/petition')).toBeVisible();
  });

  test('should handle Email subject and body inputs', async ({ page }) => {
    await page.goto('/share-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    const emailSection = page.locator('#email');
    await expect(emailSection).toBeVisible();
    
    // Find email inputs
    const subjectInput = emailSection.locator('input[placeholder*="subject"]');
    const bodyTextarea = emailSection.locator('textarea[placeholder*="body"]');
    
    await expect(subjectInput).toBeVisible();
    await expect(bodyTextarea).toBeVisible();
    
    // Add subject
    await subjectInput.fill('Important Climate Petition');
    
    // Add body text
    await bodyTextarea.fill('I thought you might be interested in this petition about climate action.');
    
    // Should see encoded subject in mailto URL
    await expect(page.locator('text=subject=Important%20Climate%20Petition')).toBeVisible();
    
    // Should see encoded body text in mailto URL
    await expect(page.locator('text=I%20thought%20you%20might%20be%20interested')).toBeVisible();
    
    // Should include the original URL in body
    await expect(page.locator('text=https%3A//act.test-org.org/petition')).toBeVisible();
  });

  test('should handle Blue Sky text input', async ({ page }) => {
    await page.goto('/share-link');
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    const blueSkySection = page.locator('#blue-sky');
    await expect(blueSkySection).toBeVisible();
    
    // Find Blue Sky textarea
    const blueSkyTextarea = blueSkySection.locator('textarea[placeholder*="Blue Sky"]');
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
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    const linkedInSection = page.locator('#linkedin');
    await expect(linkedInSection).toBeVisible();
    
    // Find LinkedIn textarea
    const linkedInTextarea = linkedInSection.locator('textarea[placeholder*="LinkedIn"]');
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
    await page.fill('input[name="actionPage"]', 'https://act.test-org.org/petition');
    
    const threadsSection = page.locator('#threads');
    await expect(threadsSection).toBeVisible();
    
    // Find Threads input
    const threadsInput = threadsSection.locator('input[placeholder*="template text"]');
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
    const actionPageInput = page.locator('input[name="actionPage"]');
    await expect(actionPageInput).toHaveValue(testUrl);
    
    // Share links should be generated automatically
    await expect(page.locator('text=Here are the share links')).toBeVisible();
    await expect(page.locator(`text=${testUrl}`)).toBeVisible();
  });

  test('should validate URL input', async ({ page }) => {
    await page.goto('/share-link');
    
    // Invalid URL should not show share links
    await page.fill('input[name="actionPage"]', 'not-a-valid-url');
    await expect(page.locator('text=Here are the share links')).not.toBeVisible();
    
    // Valid URL should show share links
    await page.fill('input[name="actionPage"]', 'https://act.example.org/petition');
    await expect(page.locator('text=Here are the share links')).toBeVisible();
    
    // Clear input should hide share links
    await page.fill('input[name="actionPage"]', '');
    await expect(page.locator('text=Here are the share links')).not.toBeVisible();
  });

  test('should handle complex URLs with existing parameters', async ({ page }) => {
    await page.goto('/share-link');
    
    // URL with existing query parameters
    const complexUrl = 'https://act.test.org/petition?utm_source=email&utm_campaign=climate';
    await page.fill('input[name="actionPage"]', complexUrl);
    
    // Should preserve the full URL in share links
    await expect(page.locator('text=Here are the share links')).toBeVisible();
    await expect(page.locator('text=utm_source=email')).toBeVisible();
    await expect(page.locator('text=utm_campaign=climate')).toBeVisible();
  });

  test('should handle URLs without protocol', async ({ page }) => {
    await page.goto('/share-link');
    
    // URL without https://
    await page.fill('input[name="actionPage"]', 'act.example.org/petition');
    
    // Should still generate share links (auto-prefixed with https://)
    await expect(page.locator('text=Here are the share links')).toBeVisible();
    await expect(page.locator('text=https://act.example.org/petition')).toBeVisible();
  });

  test('should maintain input values when switching between platforms', async ({ page }) => {
    await page.goto('/share-link');
    await page.fill('input[name="actionPage"]', 'https://act.test.org/petition');
    
    // Add Twitter text
    const twitterTextarea = page.locator('#twitterTextarea');
    await twitterTextarea.fill('Twitter message');
    
    // Add WhatsApp text
    const whatsappTextarea = page.locator('#whatsapp textarea');
    await whatsappTextarea.fill('WhatsApp message');
    
    // Add Email subject and body
    const emailSubject = page.locator('#email input[placeholder*="subject"]');
    const emailBody = page.locator('#email textarea');
    await emailSubject.fill('Email subject');
    await emailBody.fill('Email body text');
    
    // Check that all values are preserved in their respective URLs
    await expect(page.locator('text=Twitter%20message')).toBeVisible();
    await expect(page.locator('text=WhatsApp%20message')).toBeVisible();
    await expect(page.locator('text=Email%20subject')).toBeVisible();
    await expect(page.locator('text=Email%20body%20text')).toBeVisible();
    
    // Change main URL and verify all custom text is maintained
    await page.fill('input[name="actionPage"]', 'https://different-url.org/new-petition');
    
    // All platform-specific text should still be there
    await expect(twitterTextarea).toHaveValue('Twitter message');
    await expect(whatsappTextarea).toHaveValue('WhatsApp message');
    await expect(emailSubject).toHaveValue('Email subject');
    await expect(emailBody).toHaveValue('Email body text');
  });

  test('should handle special characters in text inputs', async ({ page }) => {
    await page.goto('/share-link');
    await page.fill('input[name="actionPage"]', 'https://act.test.org/petition');
    
    // Test special characters in Twitter
    const twitterTextarea = page.locator('#twitterTextarea');
    const specialText = 'Sign this petition! #ClimateAction @everyone 🌍';
    await twitterTextarea.fill(specialText);
    
    // Should be properly encoded in the URL
    await expect(page.locator('text=Sign%20this%20petition!')).toBeVisible();
    await expect(page.locator('text=%40everyone')).toBeVisible(); // @ should be encoded
    
    // Test emoji and special chars in WhatsApp
    const whatsappTextarea = page.locator('#whatsapp textarea');
    await whatsappTextarea.fill('🌍 Save our planet! 💚');
    
    // Should handle emojis in encoding
    await expect(page.locator('text=Save%20our%20planet!')).toBeVisible();
  });
});