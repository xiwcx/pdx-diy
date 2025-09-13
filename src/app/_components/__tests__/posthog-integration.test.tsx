/**
 * @fileoverview Integration tests for PostHog with Next.js components
 *
 * Tests cover:
 * - PostHog integration with layout and page components
 * - Provider and pageview component working together
 * - Real-world usage scenarios
 */

import { render, screen } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { usePostHog } from "posthog-js/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "../../providers";
import { PostHogPageview } from "../posthog-pageview";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useSearchParams: vi.fn(),
}));

// Mock PostHog
vi.mock("posthog-js", () => ({
	default: {
		init: vi.fn(),
		capture: vi.fn(),
	},
}));

vi.mock("posthog-js/react", () => ({
	PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
	usePostHog: vi.fn(),
}));

// Mock environment
vi.mock("~/env.js", () => ({
	env: {
		NODE_ENV: "development",
		NEXT_PUBLIC_POSTHOG_KEY: "test-key",
		NEXT_PUBLIC_POSTHOG_HOST: "https://test.posthog.com",
	},
}));

// Mock window
Object.defineProperty(window, "location", {
	value: { origin: "https://example.com" },
	writable: true,
});

describe("PostHog Integration", () => {
	let mockSearchParams: { toString: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		mockSearchParams = {
			toString: vi.fn().mockReturnValue(""),
		};

		vi.mocked(usePathname).mockReturnValue("/");
		vi.mocked(useSearchParams).mockReturnValue(
			mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
		);
		vi.mocked(usePostHog).mockReturnValue(posthog);

		// Mock process.env.NODE_ENV to not be "test" so PostHog initializes
		vi.stubEnv("NODE_ENV", "development");
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	it("should initialize PostHog and track pageviews in a complete layout", () => {
		// Simulate a complete layout with providers and pageview tracking
		const TestLayout = () => (
			<Providers>
				<PostHogPageview />
				<main>
					<h1>Test Page</h1>
					<p>Content goes here</p>
				</main>
			</Providers>
		);

		render(<TestLayout />);

		// PostHog should be initialized
		expect(posthog.init).toHaveBeenCalledWith("test-key", {
			api_host: "https://test.posthog.com",
			capture_pageview: false,
			capture_pageleave: false,
		});

		// Pageview should be captured
		expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/",
		});

		// Content should be rendered
		expect(screen.getByText("Test Page")).toBeTruthy();
		expect(screen.getByText("Content goes here")).toBeTruthy();
	});

	it("should handle route changes in a full application layout", () => {
		const TestApp = () => (
			<Providers>
				<PostHogPageview />
				<nav>
					<a href="/about">About</a>
					<a href="/contact">Contact</a>
				</nav>
				<main>
					<h1>Home Page</h1>
				</main>
			</Providers>
		);

		const { rerender } = render(<TestApp />);

		// Initial pageview
		expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/",
		});

		// Simulate navigation to /about
		vi.mocked(usePathname).mockReturnValue("/about");
		rerender(<TestApp />);

		expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/about",
		});

		// Simulate navigation to /contact with search params
		vi.mocked(usePathname).mockReturnValue("/contact");
		mockSearchParams.toString.mockReturnValue("ref=navigation");
		rerender(<TestApp />);

		expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/contact?ref=navigation",
		});

		expect(posthog.capture).toHaveBeenCalledTimes(3);
	});

	it("should work with nested providers and components", () => {
		const TestComponent = () => {
			const posthogClient = usePostHog();

			const handleClick = () => {
				posthogClient?.capture("button_clicked", {
					button_name: "test-button",
					page: "test-page",
				});
			};

			return (
				<div>
					<button type="button" onClick={handleClick} data-testid="test-button">
						Click me
					</button>
				</div>
			);
		};

		const TestApp = () => (
			<Providers>
				<PostHogPageview />
				<div>
					<header>Header</header>
					<TestComponent />
					<footer>Footer</footer>
				</div>
			</Providers>
		);

		render(<TestApp />);

		// PostHog should be available to nested components
		expect(screen.getByTestId("test-button")).toBeTruthy();

		// Simulate click
		screen.getByTestId("test-button").click();

		expect(posthog.capture).toHaveBeenCalledWith("button_clicked", {
			button_name: "test-button",
			page: "test-page",
		});
	});

	it("should handle multiple simultaneous PostHog operations", () => {
		const TestComponent = () => {
			const posthogClient = usePostHog();

			React.useEffect(() => {
				if (posthogClient) {
					// Simulate multiple operations
					posthogClient.capture("component_mounted");
					posthogClient.capture("user_action", { action: "view" });
				}
			}, [posthogClient]);

			return <div>Test Component</div>;
		};

		const TestApp = () => (
			<Providers>
				<PostHogPageview />
				<TestComponent />
			</Providers>
		);

		render(<TestApp />);

		// Should capture pageview + component events
		expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/",
		});
		expect(posthog.capture).toHaveBeenCalledWith("component_mounted");
		expect(posthog.capture).toHaveBeenCalledWith("user_action", {
			action: "view",
		});
	});

	it("should gracefully handle PostHog unavailability", () => {
		// Mock PostHog as unavailable
		// biome-ignore lint/suspicious/noExplicitAny: Testing PostHog unavailability requires null return
		(usePostHog as any).mockReturnValue(null);

		const TestComponent = () => {
			const posthogClient = usePostHog();

			const handleAction = () => {
				// This should not throw even when PostHog is null
				posthogClient?.capture("action_performed");
			};

			return (
				<button
					type="button"
					onClick={handleAction}
					data-testid="action-button"
				>
					Perform Action
				</button>
			);
		};

		const TestApp = () => (
			<Providers>
				<PostHogPageview />
				<TestComponent />
			</Providers>
		);

		expect(() => render(<TestApp />)).not.toThrow();

		// Click should not cause errors
		expect(() => {
			screen.getByTestId("action-button").click();
		}).not.toThrow();

		// No capture calls should be made when PostHog is unavailable
		expect(posthog.capture).not.toHaveBeenCalled();
	});

	it("should handle complex application states", () => {
		const TestApp = ({ userLoggedIn }: { userLoggedIn: boolean }) => (
			<Providers>
				<PostHogPageview />
				<header>
					<h1>My App</h1>
					{userLoggedIn ? <div>Welcome, User!</div> : <div>Please log in</div>}
				</header>
				<main>
					{userLoggedIn ? <div>Dashboard content</div> : <div>Login form</div>}
				</main>
			</Providers>
		);

		// Test logged out state
		const { rerender } = render(<TestApp userLoggedIn={false} />);
		expect(screen.getByText("Please log in")).toBeTruthy();
		expect(screen.getByText("Login form")).toBeTruthy();

		// Test state change to logged in
		rerender(<TestApp userLoggedIn={true} />);
		expect(screen.getByText("Welcome, User!")).toBeTruthy();
		expect(screen.getByText("Dashboard content")).toBeTruthy();

		// PostHog should still be tracking throughout state changes
		expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/",
		});
	});
});
