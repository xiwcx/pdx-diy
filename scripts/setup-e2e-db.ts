#!/usr/bin/env tsx

/**
 * Script to set up the test database for e2e tests
 * This includes starting the database, resetting it, and pushing the schema
 */

import { execSync } from "node:child_process";
import { resetTestDatabase } from "./reset-test-db.js";

/**
 * Orchestrates setup of the end-to-end test PostgreSQL database.
 *
 * Starts the Docker test DB container, waits for it to accept connections, resets the test database, applies the schema via drizzle-kit, and verifies required tables exist.
 *
 * Notes:
 * - This function has important side effects: it runs shell commands (docker compose, pnpm/drizzle-kit), may start containers, and will call process.exit(1) on failure.
 * - Requires Docker and pnpm (and drizzle-kit) to be available on PATH, and uses the test database connection configured in this project.
 */
export async function setupE2EDatabase(): Promise<void> {
	console.log("🚀 Setting up e2e test database...");

	try {
		// Start the test database
		console.log("📦 Starting test database container...");
		execSync("docker compose up -d test-db", { stdio: "inherit" });

		// Wait for database to be ready
		console.log("⏳ Waiting for database to be ready...");
		await waitForDatabase();

		// Reset the database (drop all tables)
		await resetTestDatabase();

		// Push the schema
		console.log("📋 Pushing database schema...");
		execSync("pnpm drizzle-kit push --config=drizzle.test.config.ts", {
			stdio: "inherit",
		});

		// Verify the schema was applied correctly
		console.log("🔍 Verifying database schema...");
		await verifyDatabaseSchema();

		console.log("✅ E2E test database setup complete");
	} catch (error) {
		console.error("❌ Error setting up e2e test database:", error);
		process.exit(1);
	}
}

/**
 * Verifies that the test PostgreSQL database contains the expected pdx-diy_* tables.
 *
 * Connects to the test database at "postgresql://test:test@localhost:5433/test", lists tables in the public schema whose names start with `pdx-diy_`, and checks that the required tables
 * ("pdx-diy_account", "pdx-diy_event", "pdx-diy_session", "pdx-diy_user", "pdx-diy_verification_token") are present.
 *
 * Logs a success message and the discovered table names when verification passes.
 *
 * @throws Error If one or more expected tables are missing or if the database cannot be queried (connection/query errors are rethrown).
 */
async function verifyDatabaseSchema(): Promise<void> {
	const { drizzle } = await import("drizzle-orm/postgres-js");
	const postgres = (await import("postgres")).default;
	const { sql } = await import("drizzle-orm");

	const DATABASE_URL = "postgresql://test:test@localhost:5433/test";

	try {
		const client = postgres(DATABASE_URL);
		const db = drizzle(client);

		// Check if the required tables exist
		const result = await db.execute(sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name LIKE 'pdx-diy_%'
			ORDER BY table_name
		`);

		const tables = result.map((row) => String(row.table_name));
		const expectedTables = [
			"pdx-diy_account",
			"pdx-diy_event",
			"pdx-diy_session",
			"pdx-diy_user",
			"pdx-diy_verification_token",
		];

		const missingTables = expectedTables.filter(
			(table) => !tables.includes(table),
		);

		if (missingTables.length > 0) {
			throw new Error(`Missing tables: ${missingTables.join(", ")}`);
		}

		console.log("✅ Database schema verification successful");
		console.log(`📊 Found tables: ${tables.join(", ")}`);

		await client.end();
	} catch (error) {
		console.error("❌ Database schema verification failed:", error);
		throw error;
	}
}

/**
 * Waits for the test PostgreSQL database to become available by polling a simple query.
 *
 * Repeatedly attempts to connect and execute `SELECT 1` against the test database until a
 * successful response is received or the maximum number of retries is exhausted. On success
 * the function returns; on failure it throws an Error.
 *
 * @param maxRetries - Maximum number of connection attempts (default: 30)
 * @param delay - Milliseconds to wait between attempts (default: 1000)
 * @throws Error if the database is still unavailable after `maxRetries` attempts
 */
async function waitForDatabase(maxRetries = 30, delay = 1000): Promise<void> {
	const { drizzle } = await import("drizzle-orm/postgres-js");
	const postgres = (await import("postgres")).default;
	const { sql } = await import("drizzle-orm");

	const DATABASE_URL = "postgresql://test:test@localhost:5433/test";

	for (let i = 0; i < maxRetries; i++) {
		try {
			const client = postgres(DATABASE_URL);
			const db = drizzle(client);

			// Try to execute a simple query
			await db.execute(sql`SELECT 1`);
			await client.end();

			console.log("✅ Database is ready");
			return;
		} catch (error) {
			if (i === maxRetries - 1) {
				throw new Error(
					`Database not ready after ${maxRetries} attempts: ${(error as Error).message}`,
				);
			}

			console.log(
				`⏳ Database not ready yet, retrying in ${delay}ms... (${i + 1}/${maxRetries})`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	setupE2EDatabase().catch((error) => {
		console.error("❌ Fatal error:", error);
		process.exit(1);
	});
}
