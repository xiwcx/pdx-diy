import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "html",
	/* Global teardown to clean up test database after all tests complete */
	globalTeardown: "./tests/global.teardown.ts",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:3000",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
	},

	/* Configure projects for major browsers */
	projects: [
		// Authentication setup project - runs after webServer starts
		{
			name: "setup auth",
			testMatch: /auth\.setup\.ts/,
		},
		// Authenticated tests - depend on auth setup
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Use prepared auth state for authenticated tests
				storageState: "playwright/.auth/user.json",
			},
			dependencies: ["setup auth"],
			testMatch: /event\.spec\.ts/,
		},
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				storageState: "playwright/.auth/user.json",
			},
			dependencies: ["setup auth"],
			testMatch: /event\.spec\.ts/,
		},
		// Unauthenticated tests - no storage state
		{
			name: "chromium-unauthenticated",
			use: {
				...devices["Desktop Chrome"],
				// Explicitly no storage state for unauthenticated tests
				storageState: { cookies: [], origins: [] },
			},
			dependencies: ["setup auth"],
			testMatch: /homepage\.spec\.ts/,
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: "pnpm e2e:db:setup && pnpm dev --turbo",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2 minutes timeout
		env: {
			DATABASE_URL: "postgresql://test:test@localhost:5433/test",
			AUTH_SECRET: "test-secret-for-e2e-tests",
			AUTH_RESEND_KEY: "test-resend-key",
			AUTH_RESEND_FROM: "test@example.com",
			POSTHOG_KEY: "phc_test_key",
			POSTHOG_HOST: "https://test.posthog.com",
			NEXT_PUBLIC_POSTHOG_KEY: "phc_test_key",
			NEXT_PUBLIC_POSTHOG_HOST: "https://test.posthog.com",
			NODE_ENV: "test",
		},
	},
});
