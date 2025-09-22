#!/usr/bin/env tsx

/**
 * Script to set up the test database for e2e tests
 * This includes starting the database, resetting it, and pushing the schema
 */

import { execSync } from "node:child_process";
import { resetTestDatabase } from "./reset-test-db.js";

/**
 * Sets up the e2e test database by starting Docker, resetting data, and pushing schema.
 */
export async function setupE2EDatabase(): Promise<void> {
	console.log("🚀 Setting up e2e test database...");

	try {
		// Check if Docker is available
		await checkDockerAvailability();

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
		throw error;
	}
}

/**
 * Verifies that Docker is available and running for database operations.
 */
async function checkDockerAvailability(): Promise<void> {
	try {
		// Check if docker command exists and is accessible
		execSync("docker --version", { stdio: "pipe" });
		// Check if docker compose is available
		execSync("docker compose version", { stdio: "pipe" });
		// Check if docker daemon is running
		execSync("docker info", { stdio: "pipe" });
		console.log("🐳 Docker is available and running");
	} catch (error) {
		console.error("❌ Docker is not available or not running");
		console.error("💡 Please start Docker Desktop and try again");
		console.error("   Error details:", (error as Error).message);
		throw new Error(
			"Docker is required for e2e tests. Please start Docker Desktop and try again.",
		);
	}
}

/**
 * Verifies that all required database tables exist after schema push.
 */
async function verifyDatabaseSchema(): Promise<void> {
	const { drizzle } = await import("drizzle-orm/postgres-js");
	const postgres = (await import("postgres")).default;
	const { sql } = await import("drizzle-orm");

	const DATABASE_URL =
		process.env.TEST_DATABASE_URL ??
		"postgresql://test:test@localhost:5433/test";

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
 * Waits for the database to be ready by attempting connections with retries.
 * @param maxRetries - Maximum number of connection attempts
 * @param delay - Delay between attempts in milliseconds
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
		throw error;
	});
}
