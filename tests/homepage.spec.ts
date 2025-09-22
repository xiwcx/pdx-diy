import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
	await page.goto("/");

	// Expect the title to include the project name.
	await expect(page).toHaveTitle(/PDX DIY/i);
});
