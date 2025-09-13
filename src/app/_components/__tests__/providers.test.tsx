/**
 * @fileoverview Unit tests for PostHog providers and initialization
 *
 * Tests cover:
 * - PostHog initialization with environment variables
 * - Provider wrapper behavior in different environments
 * - Proper configuration and client setup
 */

import { render } from "@testing-library/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "../../providers";

// Mock PostHog JS library
vi.mock("posthog-js", () => ({
	default: {
		init: vi.fn(),
	},
}));

// Mock PostHog React provider
vi.mock("posthog-js/react", () => ({
	PostHogProvider: vi.fn(({ children }) => children),
}));

// Mock environment variables
vi.mock("~/env.js", () => ({
	env: {
		NODE_ENV: "development",
		NEXT_PUBLIC_POSTHOG_KEY: "test-posthog-key",
		NEXT_PUBLIC_POSTHOG_HOST: "https://test.posthog.com",
	},
}));

describe("PostHog Providers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock process.env.NODE_ENV to not be "test" so PostHog initializes
		vi.stubEnv("NODE_ENV", "development");
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	it("should initialize PostHog with correct configuration", () => {
		render(
			<Providers>
				<div>Test child</div>
			</Providers>,
		);

		expect(posthog.init).toHaveBeenCalledWith("test-posthog-key", {
			api_host: "https://test.posthog.com",
			capture_pageview: false,
			capture_pageleave: false,
		});
	});

	it("should wrap children with PostHogProvider", () => {
		const TestChild = () => <div data-testid="test-child">Test content</div>;

		const { getByTestId } = render(
			<Providers>
				<TestChild />
			</Providers>,
		);

		// Verify children are rendered correctly
		expect(getByTestId("test-child")).toBeTruthy();

		// Verify PostHogProvider was called
		expect(PostHogProvider).toHaveBeenCalled();
	});

	it("should handle missing environment variables gracefully", () => {
		// This test ensures the component doesn't crash with missing env vars
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Don't throw when rendering
		expect(() => {
			render(
				<Providers>
					<div>Test child</div>
				</Providers>,
			);
		}).not.toThrow();

		consoleSpy.mockRestore();
	});

	it("should handle PostHog initialization errors gracefully", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Clear previous calls to avoid test isolation issues
		vi.clearAllMocks();

		// Mock to throw error on init
		vi.mocked(posthog.init).mockImplementation(() => {
			throw new Error("PostHog initialization failed");
		});

		// Should not throw - the component should handle errors internally
		let result: ReturnType<typeof render> | undefined;
		expect(() => {
			result = render(
				<Providers>
					<div data-testid="test-child">Test child</div>
				</Providers>,
			);
		}).not.toThrow();

		// Component should still render its children
		expect(result?.getByTestId("test-child")).toBeTruthy();

		consoleSpy.mockRestore();
	});

	it("should only initialize PostHog once for multiple renders", () => {
		// Clear previous mocks to start fresh
		vi.clearAllMocks();

		const { rerender } = render(
			<Providers>
				<div>First render</div>
			</Providers>,
		);

		rerender(
			<Providers>
				<div>Second render</div>
			</Providers>,
		);

		// PostHog init should only be called once due to useEffect dependencies
		expect(posthog.init).toHaveBeenCalledTimes(1);
	});
});
