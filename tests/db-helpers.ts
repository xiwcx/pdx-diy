/**
 * Database helpers for e2e tests
 * Provides utilities to interact with the test database during tests
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resetTestDatabase } from "../scripts/reset-test-db.js";

const DATABASE_URL = "postgresql://test:test@localhost:5433/test";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Lazily initializes and returns the test PostgreSQL client and its Drizzle ORM wrapper.
 *
 * If the client and/or db are already initialized, the existing instances are returned.
 * These instances remain live until `cleanupTestDatabase()` is called.
 *
 * @returns An object with `client` (the postgres client or null) and `db` (the Drizzle instance or null).
 */
export function getTestDatabase() {
	if (!client || !db) {
		client = postgres(DATABASE_URL);
		db = drizzle(client);
	}
	return { client, db };
}

/**
 * Close the test PostgreSQL client (if initialized) and clear the cached client and ORM instances.
 *
 * This awaits the client's shutdown and is a no-op if no client is present.
 */
export async function cleanupTestDatabase() {
	if (client) {
		await client.end();
		client = null;
		db = null;
	}
}

/**
 * Reset the test database to a clean state.
 *
 * Calls the shared `resetTestDatabase` routine and awaits completion. Any errors
 * thrown by the underlying reset operation are propagated to the caller.
 *
 * @returns A promise that resolves when the reset completes.
 */
export async function resetDatabaseForTest() {
	console.log("🔄 Resetting database for test...");
	await resetTestDatabase();
	console.log("✅ Database reset complete");
}

/**
 * Seeds test data into the test database.
 *
 * Iterates over the provided mapping of table names to record arrays and (when enabled)
 * inserts the records into the corresponding tables in the test database. Currently the
 * actual insert call is a placeholder — this function logs the intended operations but
 * does not perform writes until insertion calls are implemented.
 *
 * @param data - A record whose keys are table names and values are arrays of rows to seed;
 *                 each row should match the target table's shape/schema when insertion is enabled.
 */
export async function seedTestData(data: Record<string, unknown[]>) {
	const { db } = getTestDatabase();

	console.log("🌱 Seeding test data...");

	for (const [tableName, records] of Object.entries(data)) {
		if (records.length > 0) {
			// This would need to be implemented based on your schema
			console.log(`   Seeding ${records.length} records into ${tableName}`);
			// await db.insert(schema[tableName]).values(records);
		}
	}

	console.log("✅ Test data seeded");
}

/**
 * Playwright helper that resets the test database before each test.
 *
 * Call from test.beforeEach(...) to ensure a clean database state for every test.
 */
export async function resetDatabaseBeforeTest() {
	await resetDatabaseForTest();
}

/**
 * Reset the test database once before a Playwright test file runs.
 *
 * Intended for use inside Playwright's `test.beforeAll()` hook to ensure a clean
 * database state for the file's tests.
 */
export async function resetDatabaseBeforeFile() {
	await resetDatabaseForTest();
}
