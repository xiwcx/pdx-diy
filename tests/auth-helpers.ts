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
 * Creates or gets the test user directly in the database
 * This bypasses the email verification process for testing
 */
export async function createTestUser() {
	const { db } = getTestDatabase();
	const user = TEST_USER;

	// Try to insert user, ignore if already exists

	await db
		.insert(users)
		.values({
			id: user.id,
			email: user.email,
			name: user.name,
			emailVerified: new Date(),
			image: null,
		})
		.onConflictDoNothing({ target: users.id });

	// For testing, we'll create a simple session token
	// NextAuth.js will validate this against the database
	const sessionToken = `test-session-token-${user.id}-${crypto.randomUUID()}`;

	// Try to insert session, ignore if already exists
	await db
		.insert(sessions)
		.values({
			sessionToken: sessionToken,
			userId: user.id,
			expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
		})
		.onConflictDoNothing({ target: sessions.sessionToken });

	return { user, sessionId: sessionToken };
}

/**
 * Authenticates a page by setting the session cookie
 * This simulates a logged-in user without going through the full auth flow
 */
export async function authenticatePage(page: Page) {
	const { user, sessionId } = await createTestUser();

	// Set the session cookie
	await page.context().addCookies([
		{
			name: "authjs.session-token",
			value: sessionId,
			url: "http://localhost:3000",
			httpOnly: true,
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
 * Checks if a page is authenticated by looking for user-specific content
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
 * Waits for authentication to complete
 */
export async function waitForAuthentication(page: Page) {
	// Wait for the "Logged in as" text to be visible
	// The text is split across elements, so we need to look for the span containing "Logged in as"
	await page.waitForSelector('span:has-text("Logged in as")', {
		timeout: 10000,
	});
}
