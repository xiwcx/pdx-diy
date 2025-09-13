/**
 * @fileoverview Unit tests for PostHogPageview component
 *
 * Tests cover the client-side pageview tracking component including:
 * - Pageview event capture on route changes
 * - URL construction with search parameters
 * - PostHog integration and error handling
 */

import { render } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostHogPageview } from "../posthog-pageview";

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useSearchParams: vi.fn(),
}));

// Mock PostHog React hook
vi.mock("posthog-js/react", () => ({
	usePostHog: vi.fn(),
}));

// Mock window.location.origin
Object.defineProperty(window, "location", {
	value: {
		origin: "https://example.com",
	},
	writable: true,
});

describe("PostHogPageview", () => {
	let mockPostHog: {
		capture: ReturnType<typeof vi.fn>;
	};
	let mockSearchParams: {
		toString: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		// Create mock PostHog instance
		mockPostHog = {
			capture: vi.fn(),
		};

		// Create mock search params
		mockSearchParams = {
			toString: vi.fn().mockReturnValue(""),
		};

		// Set up default mock returns
		vi.mocked(usePostHog).mockReturnValue(
			mockPostHog as unknown as ReturnType<typeof usePostHog>,
		);
		vi.mocked(usePathname).mockReturnValue("/");
		vi.mocked(useSearchParams).mockReturnValue(
			mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should capture pageview event with correct URL on pathname change", () => {
		vi.mocked(usePathname).mockReturnValue("/about");

		render(<PostHogPageview />);

		expect(mockPostHog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/about",
		});
	});

	it("should include search parameters in the URL when present", () => {
		vi.mocked(usePathname).mockReturnValue("/search");
		mockSearchParams.toString.mockReturnValue("q=test&category=blog");

		render(<PostHogPageview />);

		expect(mockPostHog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/search?q=test&category=blog",
		});
	});

	it("should not capture pageview when PostHog is not available", () => {
		vi.mocked(usePostHog).mockReturnValue(
			null as unknown as ReturnType<typeof usePostHog>,
		);
		vi.mocked(usePathname).mockReturnValue("/home");

		render(<PostHogPageview />);

		expect(mockPostHog.capture).not.toHaveBeenCalled();
	});

	it("should not capture pageview when pathname is null", () => {
		vi.mocked(usePathname).mockReturnValue(
			null as unknown as ReturnType<typeof usePathname>,
		);

		render(<PostHogPageview />);

		expect(mockPostHog.capture).not.toHaveBeenCalled();
	});

	it("should render nothing (null)", () => {
		const { container } = render(<PostHogPageview />);

		expect(container.firstChild).toBeNull();
	});

	it("should handle route changes and capture multiple pageviews", () => {
		const { rerender } = render(<PostHogPageview />);

		// Initial render
		expect(mockPostHog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/",
		});

		// Change pathname
		vi.mocked(usePathname).mockReturnValue("/contact");
		rerender(<PostHogPageview />);

		expect(mockPostHog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url: "https://example.com/contact",
		});

		expect(mockPostHog.capture).toHaveBeenCalledTimes(2);

		// Rerender without changing pathname or search params should not produce extra captures
		rerender(<PostHogPageview />);

		expect(mockPostHog.capture).toHaveBeenCalledTimes(2);
	});

	it("should handle complex URLs with special characters and search params", () => {
		vi.mocked(usePathname).mockReturnValue("/user/profile%20test");
		mockSearchParams.toString.mockReturnValue("tab=settings&id=123&filter=all");

		render(<PostHogPageview />);

		expect(mockPostHog.capture).toHaveBeenCalledWith("$pageview", {
			$current_url:
				"https://example.com/user/profile%20test?tab=settings&id=123&filter=all",
		});
	});
});
