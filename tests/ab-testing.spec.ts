import { test, expect } from "@playwright/test";

async function enterTwoVariantTest(
	page: import("@playwright/test").Page,
	control: { visitors: string; conversions: string },
	variation: { visitors: string; conversions: string }
) {
	const visitors = page.getByLabel("Number of visitors");
	const conversions = page.getByLabel("Number of conversions");

	await visitors.nth(0).fill(control.visitors);
	await conversions.nth(0).fill(control.conversions);
	await visitors.nth(1).fill(variation.visitors);
	await conversions.nth(1).fill(variation.conversions);
}

test.describe("A/B testing calculator", () => {
	test("shows a significant result for a clear conversion-rate improvement", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ visitors: "10000", conversions: "1200" },
			{ visitors: "10000", conversions: "1440" }
		);
		await page.getByRole("button", { name: "Calculate" }).click();

		await expect(page.getByText("Significant result!")).toBeVisible();
		await expect(page.getByText("20.0% higher")).toBeVisible();
	});

	test("clears old results when the current data is invalid", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ visitors: "10000", conversions: "1200" },
			{ visitors: "10000", conversions: "1440" }
		);
		await page.getByRole("button", { name: "Calculate" }).click();
		await expect(page.getByText("Significant result!")).toBeVisible();

		await page.getByLabel("Number of conversions").nth(0).fill("20000");
		await page.getByRole("button", { name: "Calculate" }).click();

		await expect(page.getByText("You can't have more conversions than visitors")).toBeVisible();
		await expect(page.getByText("Significant result!")).toBeHidden();
	});
});
