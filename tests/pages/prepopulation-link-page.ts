import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export class PrepopulationLinkPage {
	constructor(private page: Page) {}

	// Navigation
	async goto() {
		await this.page.goto("/prepopulation-link");
	}

	async gotoWithUrl(url: string) {
		await this.page.goto(`/prepopulation-link?url=${encodeURIComponent(url)}`);
	}

	// Elements
	get actionPageUrlInput() {
		return this.page.getByLabel("Enter your Impact Stack action URL");
	}

	get customiseFieldsButton() {
		return this.page.getByRole("button", { name: "Customise prepopulation fields" });
	}

	get addFieldButton() {
		return this.page.getByRole("button", { name: "Add a field" });
	}

	get trackingLinkButton() {
		return this.page.getByRole("link", { name: "Add tracking" });
	}

	// There are two PrefillLink renders on the page once fields are customised
	// (one above, one below the field table), so provider tabs appear twice.
	providerButton(provider: string) {
		return this.page.getByRole("button", { name: provider }).first();
	}

	fieldPrefillToggle(label: string) {
		return this.page.getByLabel(`${label} prefill toggle`);
	}

	fieldToken(label: string) {
		return this.page.getByLabel(`${label} token`);
	}

	fieldFormKey(label: string) {
		return this.page.getByLabel(`${label} form key`);
	}

	// Actions
	async fillActionPageUrl(url: string) {
		await this.actionPageUrlInput.fill(url);
	}

	async openCustomiseFields() {
		await this.customiseFieldsButton.click();
	}

	async switchProvider(provider: string) {
		await this.providerButton(provider).click();
	}

	async addCustomField() {
		await this.addFieldButton.click();
	}

	async fillFieldToken(label: string, value: string) {
		const input = this.fieldToken(label);
		await input.fill(value);
		await input.dispatchEvent("change");
	}

	async fillCustomFieldFormKey(value: string) {
		const input = this.fieldFormKey("Custom field");
		await input.fill(value);
		await input.dispatchEvent("change");
	}

	async selectFieldToken(label: string, value: string) {
		await this.fieldToken(label).selectOption(value);
	}

	// Assertions
	async expectGeneratedLinkContains(text: string) {
		await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
	}

	async expectGeneratedLinkNotContains(text: string) {
		await expect(this.page.getByText(text, { exact: false })).not.toBeVisible();
	}
}
