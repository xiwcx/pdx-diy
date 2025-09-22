import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test as setup } from "@playwright/test";
import { authenticatePage, waitForAuthentication } from "./auth-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../playwright/.auth/user.json");

/**
 * Authentication setup for Playwright tests.
 *
 * This setup follows the NextAuth.js testing patterns and creates
 * authenticated browser state that can be reused across tests.
 *
 * The authentication flow:
 * 1. Create a test user directly in the database
 * 2. Set the session cookie to simulate authentication
 * 3. Verify authentication by checking for user-specific content
 * 4. Save the browser state for reuse in tests
 */
setup("authenticate", async ({ page }) => {
	// Wait for the web server to be ready by checking the home page
	console.log("⏳ Waiting for web server to be ready...");
	await page.goto("/");

	// Wait for the page to load completely
	await page.waitForLoadState("networkidle");

	// Wait a bit more to ensure the server is fully ready
	await page.waitForTimeout(2000);

	// Authenticate the page using our test helpers
	await authenticatePage(page);

	// Navigate to the home page to verify authentication
	await page.goto("/");

	// Wait for authentication to be visible
	await waitForAuthentication(page);

	// Verify we're authenticated by checking for user-specific content
	await expect(page.getByText("Logged in as")).toBeVisible();

	// Save the authentication state
	await fs.mkdir(path.dirname(authFile), { recursive: true });
	await page.context().storageState({ path: authFile });
});
