import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		setupFiles: ["./src/test/setup-tests.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/**/__tests__/**",
				"src/test/**",
				"src/**/*.d.ts",
			],
			reportsDirectory: "coverage",
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
		env: {
			AUTH_SECRET: "test-secret",
			AUTH_RESEND_KEY: "test-resend-key",
			AUTH_RESEND_FROM: "test@example.com",
			DATABASE_URL: "postgresql://test:test@localhost:5432/test",
			NEXT_PUBLIC_POSTHOG_KEY: "test-posthog-key",
			NEXT_PUBLIC_POSTHOG_HOST: "https://test.posthog.com",
			POSTHOG_KEY: "test-posthog-key",
			POSTHOG_HOST: "https://test.posthog.com",
			NODE_ENV: "test",
		},
		projects: [
			{
				extends: true,
				test: {
					name: "client",
					include: [
						"src/app/**/*.test.{ts,tsx}",
						"src/trpc/**/*.test.{ts,tsx}",
					],
					environment: "jsdom",
				},
			},
			{
				extends: true,
				test: {
					name: "server",
					include: ["src/server/**/*.test.{ts,tsx}"],
					environment: "node",
				},
			},
		],
	},
	resolve: {
		alias: {
			"~": resolve(__dirname, "./src"),
		},
	},
});
