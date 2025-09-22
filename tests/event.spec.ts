import { expect, test } from "@playwright/test";
import { authenticatePage } from "./auth-helpers.js";
import { resetDatabaseBeforeTest } from "./db-helpers.js";

test.beforeEach(async () => {
	// Clean up database before each test to prevent duplicate events
	await resetDatabaseBeforeTest();
});

test("create event - happy path", async ({ page, browserName }) => {
	// Authenticate user
	await authenticatePage(page);

	// Navigate to homepage
	await page.goto("/");

	// Wait for authentication to complete
	await page.waitForSelector('span:has-text("Logged in as")');

	// Verify initial state - no events
	await expect(
		page.locator('text="No events yet. Create the first one!"'),
	).toBeVisible();

	// Click create event link
	await page.click('a[href="/events/create"]');

	// Wait for create event page to load
	await page.waitForURL("/events/create");

	// Fill out the event form with browser-specific title to avoid conflicts
	const eventTitle = `Test Event Title - ${browserName}`;
	await page.fill('input[name="title"]', eventTitle);

	// Submit the form
	await page.click('button[type="submit"]');

	// Wait for success alert and dismiss it
	page.on("dialog", (dialog) => dialog.accept());

	// Wait for form to reset (indicates successful submission)
	await page.waitForFunction(() => {
		const input = document.querySelector(
			'input[name="title"]',
		) as HTMLInputElement;
		return input && input.value === "";
	});

	// Navigate back to homepage to verify event was created
	await page.goto("/");

	// Verify event was created and appears in the list
	await expect(
		page.locator(`ul li h3:has-text("${eventTitle}")`),
	).toBeVisible();
	await expect(
		page.locator('text="No events yet. Create the first one!"'),
	).not.toBeVisible();
});
