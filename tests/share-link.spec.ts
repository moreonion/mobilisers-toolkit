import { test, expect } from "@playwright/test";
import { ShareLinkPage } from "./pages/share-link-page";

test.describe("Share Link Generator", () => {
	let sharePage: ShareLinkPage;

	test.beforeEach(async ({ page }) => {
		sharePage = new ShareLinkPage(page);
	});

	test("should generate basic share links with URL input", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/climate-petition");

		// Should see the share links section appear
		await sharePage.expectShareLinksVisible();

		// Check that all expected platforms are present
		await expect(sharePage.facebookSection).toBeVisible();
		await expect(sharePage.twitterSection).toBeVisible();
		await expect(sharePage.whatsappSection).toBeVisible();
		await expect(sharePage.messengerSection).toBeVisible();
		await expect(sharePage.emailSection).toBeVisible();
		await expect(sharePage.blueSkySection).toBeVisible();
		await expect(sharePage.linkedInSection).toBeVisible();
		await expect(sharePage.threadsSection).toBeVisible();

		// Check that basic URLs are generated correctly
		await expect(sharePage.facebookLink).toBeVisible();
		await expect(sharePage.twitterLink).toBeVisible();
		await expect(sharePage.whatsappLink).toBeVisible();
		await expect(sharePage.emailLink).toBeVisible();
	});

	test("should handle Twitter/X text input and character count", async ({ page }) => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/petition");

		await expect(sharePage.twitterSection).toBeVisible();
		await expect(sharePage.twitterTextarea).toBeVisible();

		// Initially should show 0 characters
		await expect(page.locator("text=0 characters")).toBeVisible();

		// Add some text
		const testText = "Check out this important climate petition!";
		await sharePage.fillTwitterText(testText);

		// Should show character count
		await expect(page.locator(`text=${testText.length} characters`)).toBeVisible();

		// Twitter URL should include the text
		expect(await sharePage.getUrlParam(sharePage.twitterLink, "text")).toBe(testText);

		// Test character limit (280 chars)
		const longText = "a".repeat(300);
		await sharePage.fillTwitterText(longText);

		// Should be truncated to 280 characters
		const actualValue = await sharePage.twitterTextarea.inputValue();
		expect(actualValue.length).toBe(280);
	});

	test("should handle Twitter hashtags with Tags component", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/petition");

		// Find the hashtags input
		await expect(sharePage.twitterHashtagsInput).toBeVisible();

		// Add a hashtag
		await sharePage.addHashtag("climate");

		// Should see a named remove button for the hashtag tag
		await expect(sharePage.getHashtagRemoveButton("climate")).toBeVisible();

		// Add another hashtag
		await sharePage.addHashtag("environment");

		await expect(sharePage.getHashtagRemoveButton("environment")).toBeVisible();

		// Twitter URL should include hashtags
		expect(await sharePage.getUrlParam(sharePage.twitterLink, "hashtags")).toBe(
			"climate,environment"
		);

		// Test removing a hashtag
		await sharePage.removeHashtag("climate");

		// Should only show environment hashtag in URL
		expect(await sharePage.getUrlParam(sharePage.twitterLink, "hashtags")).toBe("environment");
	});

	test("should handle WhatsApp text input", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/petition");

		await expect(sharePage.whatsappSection).toBeVisible();
		await expect(sharePage.whatsappTextarea).toBeVisible();

		// Add text
		const testText = "Please sign this important petition!";
		await sharePage.fillWhatsappText(testText);

		// Should see WhatsApp URL with the text and original link included
		expect(await sharePage.getUrlParam(sharePage.whatsappLink, "text")).toBe(
			`${testText}\n\nhttps://act.test-org.org/petition`
		);
	});

	test("should handle Email subject and body inputs", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/petition");

		await expect(sharePage.emailSection).toBeVisible();
		await expect(sharePage.emailSubjectInput).toBeVisible();
		await expect(sharePage.emailBodyTextarea).toBeVisible();

		// Add subject
		const subject = "Important Climate Petition";
		await sharePage.fillEmailSubject(subject);

		// Add body text
		const bodyText = "I thought you might be interested in this petition about climate action.";
		await sharePage.fillEmailBody(bodyText);

		// Should see mailto URL within the Email section, with subject and body (plus the original link) included
		expect(await sharePage.getUrlParam(sharePage.emailLink, "subject")).toBe(subject);
		expect(await sharePage.getUrlParam(sharePage.emailLink, "body")).toBe(
			`${bodyText}\n\nhttps://act.test-org.org/petition`
		);
	});

	test("should handle Blue Sky text input", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/petition");

		await expect(sharePage.blueSkySection).toBeVisible();
		await expect(sharePage.blueSkyTextarea).toBeVisible();

		// Add text
		const testText = "Join me in supporting this cause!";
		await sharePage.fillBlueSkyText(testText);

		// Should see Blue Sky URL with the text and link included
		expect(await sharePage.getUrlParam(sharePage.blueSkyLink, "text")).toBe(
			`${testText}\n\nhttps://act.test-org.org/petition`
		);
	});

	test("should handle LinkedIn text input", async ({ page }) => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/petition");

		await expect(sharePage.linkedInSection).toBeVisible();
		await expect(sharePage.linkedInTextarea).toBeVisible();

		// Add text
		const testText = "Professional networks can drive change too!";
		await sharePage.fillLinkedInText(testText);

		// Should see LinkedIn URL with the text and link included
		expect(await sharePage.getUrlParam(sharePage.linkedInLink, "text")).toBe(
			`${testText}\n\nhttps://act.test-org.org/petition`
		);

		// Should show LinkedIn warning message
		await expect(page.locator("text=LinkedIn appears to change the format")).toBeVisible();
	});

	test("should handle Threads text input", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test-org.org/petition");

		await expect(sharePage.threadsSection).toBeVisible();
		await expect(sharePage.threadsInput).toBeVisible();

		// Add text
		const testText = "Check this out on Threads!";
		await sharePage.fillThreadsText(testText);

		// Should see Threads URL with the text and link as separate params
		expect(await sharePage.getUrlParam(sharePage.threadsLink, "text")).toBe(testText);
		expect(await sharePage.getUrlParam(sharePage.threadsLink, "url")).toBe(
			"https://act.test-org.org/petition"
		);
	});

	test("should handle URL parameter pre-filling", async () => {
		// Test with URL parameter
		const testUrl = "https://act.example.org/campaign";
		await sharePage.gotoWithUrl(testUrl);

		// Input should be pre-filled
		await expect(sharePage.linkToShareInput).toHaveValue(testUrl);

		// Share links should be generated automatically
		await sharePage.expectShareLinksVisible();
		// The URL appears in all share links, so just verify one specific platform
		expect(await sharePage.getUrlParam(sharePage.facebookLink, "u")).toBe(testUrl);
	});

	test("should validate URL input", async () => {
		await sharePage.goto();

		// Start with valid URL to show share links
		await sharePage.fillLinkToShare("https://act.example.org/petition");
		await sharePage.expectShareLinksVisible();

		// Invalid URL should still show share links (component shows links for any non-empty input)
		await sharePage.fillLinkToShare("not-a-valid-url");
		await sharePage.expectShareLinksVisible();

		// Valid URL should show share links
		await sharePage.fillLinkToShare("https://act.example.org/petition");
		await sharePage.expectShareLinksVisible();

		// Clear input should hide share links
		await sharePage.fillLinkToShare("");
		await sharePage.expectShareLinksHidden();
	});

	test("should handle complex URLs with existing parameters", async () => {
		await sharePage.goto();

		// URL with existing query parameters
		const complexUrl = "https://act.test.org/petition?utm_source=email&utm_campaign=climate";
		await sharePage.fillLinkToShare(complexUrl);

		// Should preserve the full URL in share links
		await sharePage.expectShareLinksVisible();
		// Check that URL parameters are preserved by looking for the Facebook share URL specifically
		expect(await sharePage.getUrlParam(sharePage.facebookLink, "u")).toBe(complexUrl);
	});

	test("should handle URLs without protocol", async () => {
		await sharePage.goto();

		// URL without https://
		await sharePage.fillLinkToShare("act.example.org/petition");

		// Should still generate share links (auto-prefixed with https://)
		await sharePage.expectShareLinksVisible();
		// Check that https:// was auto-prefixed in a specific platform
		expect(await sharePage.getUrlParam(sharePage.facebookLink, "u")).toBe(
			"https://act.example.org/petition"
		);
	});

	test("should maintain input values when switching between platforms", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test.org/petition");

		// Add Twitter text
		await sharePage.fillTwitterText("Twitter message");

		// Add WhatsApp text
		await sharePage.fillWhatsappText("WhatsApp message");

		// Add Email subject and body
		await sharePage.fillEmailSubject("Email subject");
		await sharePage.fillEmailBody("Email body text");

		// Check that all values are preserved in their respective URLs
		expect(await sharePage.getUrlParam(sharePage.twitterLink, "text")).toBe("Twitter message");
		expect(await sharePage.getUrlParam(sharePage.whatsappLink, "text")).toBe(
			"WhatsApp message\n\nhttps://act.test.org/petition"
		);
		expect(await sharePage.getUrlParam(sharePage.emailLink, "subject")).toBe("Email subject");
		expect(await sharePage.getUrlParam(sharePage.emailLink, "body")).toBe(
			"Email body text\n\nhttps://act.test.org/petition"
		);

		// Change main URL and verify all custom text is maintained
		await sharePage.fillLinkToShare("https://different-url.org/new-petition");

		// All platform-specific text should still be there
		await expect(sharePage.twitterTextarea).toHaveValue("Twitter message");
		await expect(sharePage.whatsappTextarea).toHaveValue("WhatsApp message");
		await expect(sharePage.emailSubjectInput).toHaveValue("Email subject");
		await expect(sharePage.emailBodyTextarea).toHaveValue("Email body text");
	});

	test("should handle special characters in text inputs", async () => {
		await sharePage.goto();
		await sharePage.fillLinkToShare("https://act.test.org/petition");

		// Test special characters in Twitter
		const specialText = "Sign this petition! #ClimateAction @everyone 🌍";
		await sharePage.fillTwitterText(specialText);

		expect(await sharePage.getUrlParam(sharePage.twitterLink, "text")).toBe(specialText);

		// Test emoji and special chars in WhatsApp
		const whatsappText = "🌍 Save our planet! 💚";
		await sharePage.fillWhatsappText(whatsappText);

		expect(await sharePage.getUrlParam(sharePage.whatsappLink, "text")).toBe(
			`${whatsappText}\n\nhttps://act.test.org/petition`
		);
	});
});
