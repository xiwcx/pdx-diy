import { resetTestDatabase } from "../scripts/reset-test-db.js";

/**
 * Global teardown for Playwright tests.
 *
 * This runs after all tests complete to clean up the test database.
 * This ensures that test data doesn't accumulate between test runs
 * and prevents issues like duplicate events with the same title.
 */
export default async function globalTeardown() {
	console.log("🧹 Cleaning up test database...");

	try {
		await resetTestDatabase();
		console.log("✅ Test database cleanup complete");
	} catch (error) {
		console.error("❌ Error during test database cleanup:", error);
		// Don't throw here as it would mask test failures
	}
}
