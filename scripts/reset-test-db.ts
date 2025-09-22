#!/usr/bin/env tsx

/**
 * Script to reset the test database for e2e tests.
 * Truncates event data while preserving auth tables.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL =
	process.env.TEST_DATABASE_URL ?? "postgresql://test:test@localhost:5433/test";

/**
 * Resets the test database by clearing event data while preserving auth tables.
 * This allows the web server to continue functioning while clearing test data.
 */
export async function resetTestDatabase(): Promise<void> {
	console.log("🔄 Resetting test database...");

	// Create a connection to the test database
	const client = postgres(DATABASE_URL);
	const db = drizzle(client);

	try {
		// Only clear event data, keep authentication tables intact
		// This allows the web server to continue functioning while clearing test data
		const eventTables = ["pdx-diy_event"];

		console.log(`🗑️  Clearing event data from ${eventTables.length} tables...`);

		// Clear only event data (but keep the tables for the web server)
		for (const tableName of eventTables) {
			try {
				await db.execute(
					sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE`,
				);
				console.log(`   ✓ Cleared data from table: ${tableName}`);
			} catch (error) {
				console.warn(
					`   ⚠️  Could not clear table ${tableName}:`,
					(error as Error).message,
				);
			}
		}

		console.log(
			"ℹ️  Authentication tables (users, sessions, accounts, tokens) left intact",
		);

		console.log("✅ Test database reset complete");
	} catch (error) {
		console.error("❌ Error resetting test database:", error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run the reset if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	resetTestDatabase().catch((error) => {
		console.error("❌ Fatal error:", error);
		throw error;
	});
}
