import { test, expect } from "@playwright/test";

async function enterTwoVariantTest(
	page: import("@playwright/test").Page,
	control: { sampleSize: string; conversions: string },
	variation: { sampleSize: string; conversions: string }
) {
	const sampleSizes = page.getByLabel("Sample size");
	const conversions = page.getByLabel("Number of conversions");

	await sampleSizes.nth(0).fill(control.sampleSize);
	await conversions.nth(0).fill(control.conversions);
	await sampleSizes.nth(1).fill(variation.sampleSize);
	await conversions.nth(1).fill(variation.conversions);
}

test.describe("A/B testing calculator", () => {
	test("keeps calculator labels visible on narrow screens", async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 800 });
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		const firstDataRow = page
			.getByRole("table", { name: "A/B test data input" })
			.locator("tbody tr")
			.first();
		await expect(firstDataRow.getByText("Variant", { exact: true })).toBeVisible();
		await expect(firstDataRow.getByText("Sample size", { exact: true })).toBeVisible();
		await expect(firstDataRow.getByText("Conversions", { exact: true })).toBeVisible();
		await expect(firstDataRow.getByText("Conversion rate", { exact: true })).toBeVisible();
		const pageWidth = await page.evaluate(() => ({
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth
		}));
		expect(pageWidth.scrollWidth).toBe(pageWidth.clientWidth);
	});

	test("uses a compact table layout at split-screen laptop widths", async ({ page }) => {
		await page.setViewportSize({ width: 700, height: 900 });
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		const dataInputTable = page.getByRole("table", { name: "A/B test data input" });
		await expect(dataInputTable.locator("thead")).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /Variant/ })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /Sample size/ })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /Conversions/ })).toBeVisible();
		await expect(dataInputTable.locator(".mobile-cell-label").first()).toBeHidden();

		await page.getByRole("button", { name: "Add a variant +" }).click();
		const removeButtonBox = await page
			.getByRole("button", { name: /Remove variant/ })
			.first()
			.boundingBox();
		const tableBox = await dataInputTable.boundingBox();
		expect((removeButtonBox?.x ?? 0) + (removeButtonBox?.width ?? 0)).toBeLessThanOrEqual(
			(tableBox?.x ?? 0) + (tableBox?.width ?? 0)
		);
	});

	test("shows a significant result for a clear conversion-rate improvement", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ sampleSize: "10000", conversions: "1200" },
			{ sampleSize: "10000", conversions: "1440" }
		);
		await page.getByRole("button", { name: "Calculate" }).click();

		await expect(page.getByText("Significant result!")).toBeVisible();
		await expect(page.getByText(/Variant B performed\s+better\./)).toBeVisible();
		await expect(page.getByText("20.0% relative increase")).toBeVisible();
	});

	test("alerts the user when an added variant has no sample size", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ sampleSize: "10000", conversions: "1200" },
			{ sampleSize: "10000", conversions: "1440" }
		);
		await page.getByRole("button", { name: "Add a variant +" }).click();
		await page.getByRole("button", { name: "Calculate" }).click();

		const alert = page.getByRole("alert");
		await expect(alert).toContainText("Sample size must be at least 1");
		await expect(alert).toContainText("remove any variant with 0");
	});

	test("estimates conversion impact for a normal audience size", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ sampleSize: "10000", conversions: "1200" },
			{ sampleSize: "10000", conversions: "1440" }
		);
		await page.getByRole("button", { name: "Calculate" }).click();
		await page.getByText("How strong is the evidence?").click();

		await page.getByLabel("Normal audience size").fill("50000");

		await expect(page.getByText("50,000 × 0.024 = about 1,200 extra conversions")).toBeVisible();
	});

	test("shows a data guide when a small difference is not significant", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ sampleSize: "8000", conversions: "480" },
			{ sampleSize: "8000", conversions: "495" }
		);
		await page.getByRole("button", { name: "Calculate" }).click();
		await page.getByText("How strong is the evidence?").click();

		await expect(page.getByText("The gap is 0.19 percentage points")).toBeVisible();
		await expect(page.getByText("260,000 total people in each variant")).toBeVisible();
	});

	test("updates the result when confidence level changes", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ sampleSize: "10000", conversions: "1200" },
			{ sampleSize: "10000", conversions: "1300" }
		);
		await page.getByRole("button", { name: "Calculate" }).click();
		await expect(page.getByText("Significant result!")).toBeVisible();

		await page.getByText("Advanced settings").click();
		await page.getByLabel("Confidence level").selectOption("0.99");

		await expect(page.getByRole("heading", { name: "❌ Not significant" })).toBeVisible();
	});

	test("clears old results when the current data is invalid", async ({ page }) => {
		await page.goto("/ab-testing");
		await page.waitForLoadState("networkidle");

		await enterTwoVariantTest(
			page,
			{ sampleSize: "10000", conversions: "1200" },
			{ sampleSize: "10000", conversions: "1440" }
		);
		await page.getByRole("button", { name: "Calculate" }).click();
		await expect(page.getByText("Significant result!")).toBeVisible();

		await page.getByLabel("Number of conversions").nth(0).fill("20000");
		await page.getByRole("button", { name: "Calculate" }).click();

		await expect(page.getByText("Conversions can't be higher than sample size")).toBeVisible();
		await expect(page.getByText("Significant result!")).toBeHidden();
	});
});
