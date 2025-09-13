/**
 * @fileoverview Comprehensive tests for PostHog server utilities
 *
 * Tests cover all exported functions with various scenarios including:
 * - Happy path functionality
 * - Error handling and graceful degradation
 * - Singleton behavior
 *
 * - Edge cases and input validation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock PostHog before importing anything else
vi.mock("posthog-node", () => ({
	PostHog: vi.fn(),
}));

// Mock environment variables
vi.mock("~/env.js", () => ({
	env: {
		POSTHOG_KEY: "test-posthog-key",
		POSTHOG_HOST: "https://test.posthog.com",
	},
}));

import { PostHog } from "posthog-node";

describe("PostHog Utilities", () => {
	let mockPostHogInstance: {
		capture: ReturnType<typeof vi.fn>;
		identify: ReturnType<typeof vi.fn>;
		getAllFlags: ReturnType<typeof vi.fn>;
		isFeatureEnabled: ReturnType<typeof vi.fn>;
		shutdown: ReturnType<typeof vi.fn>;
	};
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let posthogModule: typeof import("../posthog");

	beforeEach(async () => {
		// Create mock PostHog instance
		mockPostHogInstance = {
			capture: vi.fn().mockResolvedValue(undefined),
			identify: vi.fn().mockResolvedValue(undefined),
			getAllFlags: vi.fn().mockResolvedValue({}),
			isFeatureEnabled: vi.fn().mockResolvedValue(true),
			shutdown: vi.fn().mockResolvedValue(undefined),
		};

		// Mock PostHog constructor
		vi.mocked(PostHog).mockImplementation(
			() => mockPostHogInstance as unknown as PostHog,
		);

		// Spy on console.error to test error logging
		consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Reset module state to ensure fresh singleton
		vi.resetModules();

		// Import the module fresh for each test
		posthogModule = await import("../posthog");
	});

	afterEach(() => {
		vi.clearAllMocks();
		consoleSpy.mockRestore();
	});

	describe("getPostHogClient", () => {
		it("should create a new PostHog instance with correct configuration", () => {
			const client = posthogModule.getPostHogClient();

			expect(PostHog).toHaveBeenCalledWith("test-posthog-key", {
				host: "https://test.posthog.com",
			});
			expect(client).toBe(mockPostHogInstance);
		});

		it("should return the same instance on subsequent calls (singleton)", () => {
			const client1 = posthogModule.getPostHogClient();
			const client2 = posthogModule.getPostHogClient();

			expect(client1).toBe(client2);
			expect(PostHog).toHaveBeenCalledTimes(1);
		});
	});

	describe("captureEvent", () => {
		it("should capture an event with basic parameters", async () => {
			await posthogModule.captureEvent("user123", "test_event");

			expect(mockPostHogInstance.capture).toHaveBeenCalledWith({
				distinctId: "user123",
				event: "test_event",
				properties: {
					$lib: "posthog-node",
					$lib_version: "5.8.2",
				},
			});
		});

		it("should capture an event with custom properties", async () => {
			const properties = {
				button_name: "signup",
				page: "home",
				user_type: "premium",
			};

			await posthogModule.captureEvent("user123", "button_clicked", properties);

			expect(mockPostHogInstance.capture).toHaveBeenCalledWith({
				distinctId: "user123",
				event: "button_clicked",
				properties: {
					button_name: "signup",
					page: "home",
					user_type: "premium",
					$lib: "posthog-node",
					$lib_version: "5.8.2",
				},
			});
		});

		it("should handle errors gracefully and log them", async () => {
			const error = new Error("PostHog capture failed");
			mockPostHogInstance.capture.mockRejectedValue(error);

			await posthogModule.captureEvent("user123", "test_event");

			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to capture PostHog event:",
				error,
			);
		});

		it("should not throw when capture fails", async () => {
			mockPostHogInstance.capture.mockRejectedValue(new Error("Network error"));

			await expect(
				posthogModule.captureEvent("user123", "test_event"),
			).resolves.toBeUndefined();
		});
	});

	describe("identifyUser", () => {
		it("should identify a user with basic parameters", async () => {
			await posthogModule.identifyUser("user123");

			expect(mockPostHogInstance.identify).toHaveBeenCalledWith({
				distinctId: "user123",
				properties: undefined,
			});
		});

		it("should identify a user with properties", async () => {
			const properties = {
				email: "user@example.com",
				name: "John Doe",
				plan: "premium",
				signup_date: "2024-01-15",
			};

			await posthogModule.identifyUser("user123", properties);

			expect(mockPostHogInstance.identify).toHaveBeenCalledWith({
				distinctId: "user123",
				properties,
			});
		});

		it("should handle errors gracefully and log them", async () => {
			const error = new Error("PostHog identify failed");
			mockPostHogInstance.identify.mockRejectedValue(error);

			await posthogModule.identifyUser("user123", {
				email: "test@example.com",
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to identify user in PostHog:",
				error,
			);
		});

		it("should not throw when identify fails", async () => {
			mockPostHogInstance.identify.mockRejectedValue(
				new Error("Network error"),
			);

			await expect(
				posthogModule.identifyUser("user123"),
			).resolves.toBeUndefined();
		});
	});

	describe("getFeatureFlags", () => {
		it("should get all feature flags for a user", async () => {
			const mockFlags = {
				new_dashboard: true,
				beta_features: false,
				experiment_variant: "control",
			};
			mockPostHogInstance.getAllFlags.mockResolvedValue(mockFlags);

			const flags = await posthogModule.getFeatureFlags("user123");

			expect(mockPostHogInstance.getAllFlags).toHaveBeenCalledWith(
				"user123",
				undefined,
			);
			expect(flags).toEqual(mockFlags);
		});

		it("should get feature flags with group context", async () => {
			const mockFlags = { enterprise_features: true };
			const groups = { company: "acme-corp", plan: "enterprise" };
			mockPostHogInstance.getAllFlags.mockResolvedValue(mockFlags);

			const flags = await posthogModule.getFeatureFlags("user123", groups);

			expect(mockPostHogInstance.getAllFlags).toHaveBeenCalledWith(
				"user123",
				groups,
			);
			expect(flags).toEqual(mockFlags);
		});

		it("should return empty object on error", async () => {
			mockPostHogInstance.getAllFlags.mockRejectedValue(new Error("API error"));

			const flags = await posthogModule.getFeatureFlags("user123");

			expect(flags).toEqual({});
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to get feature flags from PostHog:",
				expect.any(Error),
			);
		});

		it("should handle null/undefined responses", async () => {
			mockPostHogInstance.getAllFlags.mockResolvedValue(null);

			const flags = await posthogModule.getFeatureFlags("user123");

			expect(flags).toBeNull();
		});
	});

	describe("isFeatureEnabled", () => {
		it("should check if a feature flag is enabled", async () => {
			mockPostHogInstance.isFeatureEnabled.mockResolvedValue(true);

			const isEnabled = await posthogModule.isFeatureEnabled(
				"user123",
				"beta_features",
			);

			expect(mockPostHogInstance.isFeatureEnabled).toHaveBeenCalledWith(
				"beta_features",
				"user123",
				undefined,
			);
			expect(isEnabled).toBe(true);
		});

		it("should check feature flag with group context", async () => {
			const groups = { plan: "enterprise" };
			mockPostHogInstance.isFeatureEnabled.mockResolvedValue(true);

			const isEnabled = await posthogModule.isFeatureEnabled(
				"user123",
				"advanced_features",
				groups,
			);

			expect(mockPostHogInstance.isFeatureEnabled).toHaveBeenCalledWith(
				"advanced_features",
				"user123",
				groups,
			);
			expect(isEnabled).toBe(true);
		});

		it("should return false when feature flag is disabled", async () => {
			mockPostHogInstance.isFeatureEnabled.mockResolvedValue(false);

			const isEnabled = await posthogModule.isFeatureEnabled(
				"user123",
				"beta_features",
			);

			expect(isEnabled).toBe(false);
		});

		it("should return false when API returns null/undefined", async () => {
			mockPostHogInstance.isFeatureEnabled.mockResolvedValue(null);

			const isEnabled = await posthogModule.isFeatureEnabled(
				"user123",
				"beta_features",
			);

			expect(isEnabled).toBe(false);
		});

		it("should return false on error and log the error", async () => {
			const error = new Error("PostHog API error");
			mockPostHogInstance.isFeatureEnabled.mockRejectedValue(error);

			const isEnabled = await posthogModule.isFeatureEnabled(
				"user123",
				"beta_features",
			);

			expect(isEnabled).toBe(false);
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to check feature flag in PostHog:",
				error,
			);
		});

		it("should handle undefined response gracefully", async () => {
			mockPostHogInstance.isFeatureEnabled.mockResolvedValue(undefined);

			const isEnabled = await posthogModule.isFeatureEnabled(
				"user123",
				"beta_features",
			);

			expect(isEnabled).toBe(false);
		});
	});

	describe("shutdownPostHog", () => {
		it("should shutdown PostHog client when instance exists", async () => {
			// First create an instance
			posthogModule.getPostHogClient();

			await posthogModule.shutdownPostHog();

			expect(mockPostHogInstance.shutdown).toHaveBeenCalled();
		});

		it("should handle shutdown when no instance exists", async () => {
			// Don't create an instance, just call shutdown
			await posthogModule.shutdownPostHog();

			expect(mockPostHogInstance.shutdown).not.toHaveBeenCalled();
		});

		it("should reset singleton state after shutdown", async () => {
			// Create initial instance
			const client1 = posthogModule.getPostHogClient();
			expect(client1).toBe(mockPostHogInstance);

			// Shutdown
			await posthogModule.shutdownPostHog();

			// Create new instance should call constructor again
			const client2 = posthogModule.getPostHogClient();
			expect(PostHog).toHaveBeenCalledTimes(2); // Called twice
		});

		it("should handle shutdown errors gracefully", async () => {
			posthogModule.getPostHogClient();
			mockPostHogInstance.shutdown.mockRejectedValue(
				new Error("Shutdown failed"),
			);

			// Should reject with the error since shutdown doesn't have error handling
			await expect(posthogModule.shutdownPostHog()).rejects.toThrow(
				"Shutdown failed",
			);
		});
	});

	describe("Integration scenarios", () => {
		it("should handle a complete user journey", async () => {
			// Identify user
			await posthogModule.identifyUser("user123", {
				email: "test@example.com",
				plan: "premium",
			});

			// Check feature flag
			mockPostHogInstance.isFeatureEnabled.mockResolvedValue(true);
			const canAccessBeta = await posthogModule.isFeatureEnabled(
				"user123",
				"beta_features",
			);

			// Capture event based on flag
			if (canAccessBeta) {
				await posthogModule.captureEvent("user123", "beta_feature_accessed", {
					feature_name: "new_dashboard",
				});
			}

			expect(mockPostHogInstance.identify).toHaveBeenCalledWith({
				distinctId: "user123",
				properties: { email: "test@example.com", plan: "premium" },
			});
			expect(mockPostHogInstance.isFeatureEnabled).toHaveBeenCalledWith(
				"beta_features",
				"user123",
				undefined,
			);
			expect(mockPostHogInstance.capture).toHaveBeenCalledWith({
				distinctId: "user123",
				event: "beta_feature_accessed",
				properties: {
					feature_name: "new_dashboard",
					$lib: "posthog-node",
					$lib_version: "5.8.2",
				},
			});
		});

		it("should handle multiple concurrent operations", async () => {
			// Simulate concurrent operations
			const operations = [
				posthogModule.captureEvent("user1", "login"),
				posthogModule.captureEvent("user2", "signup"),
				posthogModule.identifyUser("user3", { email: "user3@example.com" }),
				posthogModule.isFeatureEnabled("user4", "feature_x"),
			];

			await Promise.all(operations);

			expect(mockPostHogInstance.capture).toHaveBeenCalledTimes(2);
			expect(mockPostHogInstance.identify).toHaveBeenCalledTimes(1);
			expect(mockPostHogInstance.isFeatureEnabled).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge cases and input validation", () => {
		it("should handle empty strings gracefully", async () => {
			await posthogModule.captureEvent("", "");
			await posthogModule.identifyUser("");
			await posthogModule.isFeatureEnabled("", "");

			expect(mockPostHogInstance.capture).toHaveBeenCalledWith({
				distinctId: "",
				event: "",
				properties: {
					$lib: "posthog-node",
					$lib_version: "5.8.2",
				},
			});
			expect(mockPostHogInstance.identify).toHaveBeenCalledWith({
				distinctId: "",
				properties: undefined,
			});
			expect(mockPostHogInstance.isFeatureEnabled).toHaveBeenCalledWith(
				"",
				"",
				undefined,
			);
		});

		it("should handle special characters in identifiers", async () => {
			const specialId = "user@domain.com#123$%^&*()";
			const specialEvent = "event-with-special_characters.test";
			const specialFlag = "flag_with-special.characters";

			await posthogModule.captureEvent(specialId, specialEvent);
			await posthogModule.identifyUser(specialId);
			await posthogModule.isFeatureEnabled(specialId, specialFlag);

			expect(mockPostHogInstance.capture).toHaveBeenCalledWith({
				distinctId: specialId,
				event: specialEvent,
				properties: {
					$lib: "posthog-node",
					$lib_version: "5.8.2",
				},
			});
			expect(mockPostHogInstance.identify).toHaveBeenCalledWith({
				distinctId: specialId,
				properties: undefined,
			});
			expect(mockPostHogInstance.isFeatureEnabled).toHaveBeenCalledWith(
				specialFlag,
				specialId,
				undefined,
			);
		});

		it("should handle complex nested properties", async () => {
			const complexProperties = {
				user: {
					profile: {
						name: "John Doe",
						preferences: {
							theme: "dark",
							notifications: true,
						},
					},
				},
				metadata: {
					source: "api",
					version: "1.0.0",
					tags: ["premium", "beta"],
				},
			};

			await posthogModule.captureEvent(
				"user123",
				"complex_event",
				complexProperties,
			);
			await posthogModule.identifyUser("user123", complexProperties);

			expect(mockPostHogInstance.capture).toHaveBeenCalledWith({
				distinctId: "user123",
				event: "complex_event",
				properties: {
					...complexProperties,
					$lib: "posthog-node",
					$lib_version: "5.8.2",
				},
			});
			expect(mockPostHogInstance.identify).toHaveBeenCalledWith({
				distinctId: "user123",
				properties: complexProperties,
			});
		});
	});
});
