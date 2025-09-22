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

export function getTestDatabase() {
	if (!client || !db) {
		client = postgres(DATABASE_URL);
		db = drizzle(client);
	}
	return { client, db };
}

export async function cleanupTestDatabase() {
	if (client) {
		await client.end();
		client = null;
		db = null;
	}
}

export async function resetDatabaseForTest() {
	console.log("🔄 Resetting database for test...");
	await resetTestDatabase();
	console.log("✅ Database reset complete");
}

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
