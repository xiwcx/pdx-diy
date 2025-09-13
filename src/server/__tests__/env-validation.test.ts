/**
 * @fileoverview Tests for environment variable validation logic
 *
 * Tests cover:
 * - PostHog environment variable validation
 * - Warning messages for mismatched keys/hosts
 * - Environment variable schema validation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Environment Variable Validation", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		// Save original environment
		originalEnv = { ...process.env };

		// Mock console.warn
		consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// Reset modules to ensure fresh env evaluation
		vi.resetModules();
	});

	afterEach(() => {
		// Restore original environment
		for (const key of Object.keys(process.env)) {
			if (!(key in originalEnv)) {
				delete process.env[key];
			}
		}
		Object.assign(process.env, originalEnv);
		consoleSpy.mockRestore();
		vi.resetModules();
	});

	it("should warn when POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_KEY differ in development", async () => {
		// Set up environment with different keys
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("POSTHOG_KEY", "server-key-123");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "client-key-456");
		vi.stubEnv("POSTHOG_HOST", "https://test.posthog.com");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://test.posthog.com");
		vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
		vi.stubEnv("AUTH_RESEND_FROM", "test@example.com");
		vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

		// Import env module to trigger validation
		await import("~/env.js");

		expect(consoleSpy).toHaveBeenCalledWith(
			"[env] POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_KEY differ; ensure they point to the same project.",
		);
	});

	it("should warn when POSTHOG_HOST and NEXT_PUBLIC_POSTHOG_HOST differ in development", async () => {
		// Set up environment with different hosts
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("POSTHOG_KEY", "test-key-123");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key-123");
		vi.stubEnv("POSTHOG_HOST", "https://server.posthog.com");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://client.posthog.com");
		vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
		vi.stubEnv("AUTH_RESEND_FROM", "test@example.com");
		vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

		// Import env module to trigger validation
		await import("~/env.js");

		expect(consoleSpy).toHaveBeenCalledWith(
			"[env] POSTHOG_HOST and NEXT_PUBLIC_POSTHOG_HOST differ; ensure they target the same ingestion host.",
		);
	});

	it("should not warn in production environment even with different keys", async () => {
		// Set up production environment with different keys
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("AUTH_SECRET", "production-secret");
		vi.stubEnv("POSTHOG_KEY", "server-key-123");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "client-key-456");
		vi.stubEnv("POSTHOG_HOST", "https://server.posthog.com");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://client.posthog.com");
		vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
		vi.stubEnv("AUTH_RESEND_FROM", "test@example.com");
		vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

		// Import env module to trigger validation
		await import("~/env.js");

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it("should not warn when POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_KEY are the same", async () => {
		// Set up environment with same keys
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("POSTHOG_KEY", "same-key-123");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "same-key-123");
		vi.stubEnv("POSTHOG_HOST", "https://test.posthog.com");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://test.posthog.com");
		vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
		vi.stubEnv("AUTH_RESEND_FROM", "test@example.com");
		vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

		// Import env module to trigger validation
		await import("~/env.js");

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it("should not warn when environment variables are missing", async () => {
		// Set up environment with missing PostHog variables
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
		vi.stubEnv("AUTH_RESEND_FROM", "test@example.com");
		vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
		vi.stubEnv("POSTHOG_KEY", "");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
		vi.stubEnv("POSTHOG_HOST", "");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

		// This should fail validation but not trigger warnings
		try {
			await import("~/env.js");
		} catch (error) {
			// Expected to fail due to missing required env vars
		}

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it("should validate PostHog URLs are properly formatted", async () => {
		// Set up environment with invalid URLs
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("POSTHOG_KEY", "test-key");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		vi.stubEnv("POSTHOG_HOST", "invalid-url");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "invalid-url");
		vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
		vi.stubEnv("AUTH_RESEND_FROM", "test@example.com");
		vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

		// Should throw validation error for invalid URLs
		await expect(async () => {
			await import("~/env.js");
		}).rejects.toThrow();
	});

	it("should handle test environment properly", async () => {
		// Set up test environment
		vi.stubEnv("NODE_ENV", "test");
		vi.stubEnv("POSTHOG_KEY", "test-key-123");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "different-key-456");
		vi.stubEnv("POSTHOG_HOST", "https://test.posthog.com");
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://test.posthog.com");
		vi.stubEnv("AUTH_RESEND_KEY", "test-resend-key");
		vi.stubEnv("AUTH_RESEND_FROM", "test@example.com");
		vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

		// Import env module
		const { env } = await import("~/env.js");

		// Should work in test environment
		expect(env.NODE_ENV).toBe("test");
		expect(env.POSTHOG_KEY).toBe("test-key-123");
		expect(env.NEXT_PUBLIC_POSTHOG_KEY).toBe("different-key-456");

		// Should still warn about different keys even in test
		expect(consoleSpy).toHaveBeenCalledWith(
			"[env] POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_KEY differ; ensure they point to the same project.",
		);
	});
});
