#!/usr/bin/env tsx

/**
 * Script to reset the test database by dropping all tables and recreating them
 * This ensures a clean state for e2e tests
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = "postgresql://test:test@localhost:5433/test";

/**
 * Truncates designated event tables in the test database while preserving authentication tables.
 *
 * This connects to the test database, executes `TRUNCATE ... CASCADE` for the configured event
 * tables (currently "pdx-diy_event") to remove event data, and leaves auth-related tables
 * (users, sessions, accounts, tokens) intact so the web server can continue operating.
 * Per-table truncation failures are logged as warnings; a fatal failure aborts the process
 * (process exits with code 1). The database client is always closed on completion.
 *
 * @returns Resolves when the reset operation has finished (or the process has exited on fatal error).
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
				await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE`));
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
		process.exit(1);
	} finally {
		await client.end();
	}
}

// Run the reset if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	resetTestDatabase().catch((error) => {
		console.error("❌ Fatal error:", error);
		process.exit(1);
	});
}
