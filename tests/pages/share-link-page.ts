import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

export class ShareLinkPage {
	constructor(private page: Page) {}

	// Navigation
	async goto() {
		await this.page.goto("/share-link");
		await this.waitForHydration();
	}

	async gotoWithUrl(url: string) {
		await this.page.goto(`/share-link?url=${encodeURIComponent(url)}`);
		await this.waitForHydration();
	}

	async waitForHydration() {
		await this.page
			.locator('astro-island[component-url="/src/islands/share-link.svelte"]:not([ssr])')
			.waitFor();
	}

	// Elements
	get linkToShareInput() {
		return this.page.getByLabel("Enter the link you want to be shareable");
	}

	get facebookSection() {
		return this.page.getByRole("region", { name: "Facebook share options" });
	}

	get twitterSection() {
		return this.page.getByRole("region", { name: "Twitter / X share options" });
	}

	get whatsappSection() {
		return this.page.getByRole("region", { name: "WhatsApp share options" });
	}

	get messengerSection() {
		return this.page.getByRole("region", { name: "Facebook Messenger share options" });
	}

	get emailSection() {
		return this.page.getByRole("region", { name: "Email share options" });
	}

	get blueSkySection() {
		return this.page.getByRole("region", { name: "Blue Sky share options" });
	}

	get linkedInSection() {
		return this.page.getByRole("region", { name: "LinkedIn share options" });
	}

	get threadsSection() {
		return this.page.getByRole("region", { name: "Threads share options" });
	}

	get twitterTextarea() {
		return this.page.getByLabel("Twitter template text");
	}

	get twitterHashtagsInput() {
		return this.twitterSection.getByPlaceholder(/hashtags/);
	}

	get whatsappTextarea() {
		return this.page.getByLabel("WhatsApp template text");
	}

	get emailSubjectInput() {
		return this.page.getByLabel("Email subject");
	}

	get emailBodyTextarea() {
		return this.page.getByLabel("Email body text");
	}

	get blueSkyTextarea() {
		return this.page.getByLabel("Blue Sky template text");
	}

	get linkedInTextarea() {
		return this.page.getByLabel("LinkedIn template text");
	}

	get threadsInput() {
		return this.page.getByLabel("Threads template text");
	}

	// Generated link output, one paragraph per platform section
	get facebookLink() {
		return this.facebookSection.locator("p", { hasText: "facebook.com/sharer" });
	}

	get twitterLink() {
		return this.twitterSection.locator("p", { hasText: "x.com/intent/tweet" });
	}

	get whatsappLink() {
		return this.whatsappSection.locator("p", { hasText: "wa.me" });
	}

	get emailLink() {
		return this.emailSection.locator("p", { hasText: "mailto:" });
	}

	get blueSkyLink() {
		return this.blueSkySection.locator("p", { hasText: "bsky.app/intent/compose" });
	}

	get linkedInLink() {
		return this.linkedInSection.locator("p", { hasText: "linkedin.com/feed" });
	}

	get threadsLink() {
		return this.threadsSection.locator("p", { hasText: "threads.net/intent/post" });
	}

	// Actions
	async fillLinkToShare(url: string) {
		await this.linkToShareInput.fill(url);
	}

	async fillTwitterText(text: string) {
		await this.twitterTextarea.fill(text);
	}

	async addHashtag(tag: string) {
		await this.twitterHashtagsInput.fill(tag);
		await this.twitterHashtagsInput.press("Enter");
	}

	getHashtagRemoveButton(tag: string) {
		return this.twitterSection.getByRole("button", { name: `Remove ${tag}` });
	}

	async removeHashtag(tag: string) {
		await this.getHashtagRemoveButton(tag).click();
	}

	async fillWhatsappText(text: string) {
		await this.whatsappTextarea.fill(text);
	}

	async fillEmailSubject(subject: string) {
		await this.emailSubjectInput.fill(subject);
	}

	async fillEmailBody(body: string) {
		await this.emailBodyTextarea.fill(body);
	}

	async fillBlueSkyText(text: string) {
		await this.blueSkyTextarea.fill(text);
	}

	async fillLinkedInText(text: string) {
		await this.linkedInTextarea.fill(text);
	}

	async fillThreadsText(text: string) {
		await this.threadsInput.fill(text);
	}

	// Assertions / helpers
	async expectShareLinksVisible() {
		await expect(this.page.getByText("Here are the share links")).toBeVisible();
	}

	async expectShareLinksHidden() {
		await expect(this.page.getByText("Here are the share links")).not.toBeVisible();
	}

	async getUrlParam(link: Locator, paramName: string): Promise<string | null> {
		const url = new URL((await link.textContent())!.trim());
		return url.searchParams.get(paramName);
	}
}
