import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		setupFiles: ["./src/test/setup-tests.ts"],
		env: {
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
