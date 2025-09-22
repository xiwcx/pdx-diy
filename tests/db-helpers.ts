/**
 * Database helpers for e2e tests
 * Provides utilities to interact with the test database during tests
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resetTestDatabase } from "../scripts/reset-test-db.js";

const DATABASE_URL =
	process.env.TEST_DATABASE_URL ?? "postgresql://test:test@localhost:5433/test";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Gets or creates a test database connection.
 * Returns a singleton instance to avoid multiple connections.
 */
export function getTestDatabase() {
	if (!client || !db) {
		client = postgres(DATABASE_URL);
		db = drizzle(client);
	}
	return { client, db };
}

/**
 * Closes the test database connection and cleans up resources.
 */
export async function cleanupTestDatabase() {
	if (client) {
		await client.end();
		client = null;
		db = null;
	}
}

/**
 * Resets the test database by clearing all event data.
 */
export async function resetDatabaseForTest() {
	await resetTestDatabase();
}

/**
 * Playwright test helper to reset database before each test
 * Use this in test.beforeEach() hooks
 */
export async function resetDatabaseBeforeTest() {
	await resetDatabaseForTest();
}

/**
 * Playwright test helper to reset database before each test file
 * Use this in test.beforeAll() hooks
 */
export async function resetDatabaseBeforeFile() {
	await resetDatabaseForTest();
}
