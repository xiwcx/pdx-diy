/**
 * Authentication helpers for Playwright tests
 * Provides utilities to authenticate users and manage test sessions
 */

import type { Page } from "@playwright/test";
import { sessions, users } from "../src/server/db/schema.js";
import { getTestDatabase } from "./db-helpers.js";

/**
 * Single test user for authentication
 */
export const TEST_USER = {
	email: "test@example.com",
	name: "Test User",
	id: "test-user-id",
} as const;

/**
 * Ensures a test user and a corresponding session exist in the test database and returns them.
 *
 * Inserts the constant TEST_USER into the users table (setting emailVerified to now) and creates
 * a session row with a generated session token and a 30-day expiry. Duplicate insertions are
 * ignored (errors are caught and logged), so calling this multiple times is safe.
 *
 * @returns An object with the created-or-existing `user` and the `sessionId` (the generated session token)
 */
export async function createTestUser() {
	const { db } = getTestDatabase();
	const user = TEST_USER;

	// Try to insert user, ignore if already exists
	try {
		await db.insert(users).values({
			id: user.id,
			email: user.email,
			name: user.name,
			emailVerified: new Date(),
			image: null,
		});
	} catch (error) {
		// User already exists, that's fine
		console.log("Test user already exists, continuing...");
	}

	// For testing, we'll create a simple session token
	// NextAuth.js will validate this against the database
	const sessionToken = `test-session-token-${user.id}-${Date.now()}`;

	// Try to insert session, ignore if already exists
	try {
		await db.insert(sessions).values({
			sessionToken: sessionToken,
			userId: user.id,
			expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
		});
	} catch (error) {
		// Session already exists, that's fine
		console.log("Test session already exists, continuing...");
	}

	return { user, sessionId: sessionToken };
}

/**
 * Authenticate a Playwright page by setting a test session cookie so the page behaves as a logged-in user.
 *
 * Adds an "authjs.session-token" cookie to the page context (domain "localhost") for a test session created or retrieved from the test database.
 *
 * @param page - Playwright Page whose context will receive the session cookie.
 * @returns The test user object created or retrieved for the session.
 */
export async function authenticatePage(page: Page) {
	const { user, sessionId } = await createTestUser();

	// Set the session cookie
	await page.context().addCookies([
		{
			name: "authjs.session-token",
			value: sessionId,
			domain: "localhost",
			path: "/",
			httpOnly: true,
			secure: false, // false for localhost
			sameSite: "Lax",
		},
	]);

	return user;
}

/**
 * Clears authentication by removing session cookies
 */
export async function clearAuthentication(page: Page) {
	await page.context().clearCookies();
}

/**
 * Returns whether the given Playwright page appears to be authenticated.
 *
 * Waits up to 1 second for a `span` containing the text "Logged in as". Resolves to
 * `true` if that element appears, otherwise `false`.
 *
 * @param page - Playwright Page to inspect for authenticated UI state
 * @returns `true` when the "Logged in as" indicator is present; `false` otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
	try {
		await page.waitForSelector('span:has-text("Logged in as")', {
			timeout: 1000,
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Waits up to 10 seconds for the page to show a span containing "Logged in as", indicating an authenticated UI state.
 *
 * Resolves when that element becomes visible in the DOM.
 */
export async function waitForAuthentication(page: Page) {
	// Wait for the "Logged in as" text to be visible
	// The text is split across elements, so we need to look for the span containing "Logged in as"
	await page.waitForSelector('span:has-text("Logged in as")', {
		timeout: 10000,
	});
}
