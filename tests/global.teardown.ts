import { resetTestDatabase } from "../scripts/reset-test-db.js";

/**
 * Perform global teardown for Playwright tests by resetting the test database.
 *
 * Runs after all tests complete to remove test data and avoid accumulation or conflicts
 * (for example, duplicate events with the same title). Errors during cleanup are logged
 * but intentionally not rethrown so they don't mask test failures.
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
