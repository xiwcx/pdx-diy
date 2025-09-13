"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
// biome-ignore lint/style/useImportType: React needed at runtime for JSX transform
import React, { useEffect } from "react";

/**
 * Internal wrapper component that initializes PostHog and provides the context.
 *
 * Handles PostHog initialization with proper environment variable checks
 * and error handling. Only initializes in browser environment and
 * skips initialization during testing.
 *
 * @param children - Child components that need PostHog access
 * @returns PostHog provider with initialized client
 */
function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
			const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
			const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

			if (posthogKey && posthogHost) {
				try {
					posthog.init(posthogKey, {
						api_host: posthogHost,
						capture_pageview: false, // Disable automatic pageview capture, as we capture manually
						capture_pageleave: false, // Disable automatic pageleave capture
					});
				} catch (error) {
					console.error("Failed to initialize PostHog:", error);
				}
			}
		}
	}, []);

	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

/**
 * Main providers component that wraps the application with necessary providers.
 *
 * Currently includes PostHog analytics provider. This is where additional
 * global providers (like theme, auth context, etc.) would be added in the future.
 *
 * @param children - The application content to wrap with providers
 * @returns The wrapped application with all necessary context providers
 *
 * @example
 * ```tsx
 * // In your root layout
 * <Providers>
 *   <App />
 * </Providers>
 * ```
 */
export function Providers({ children }: { children: React.ReactNode }) {
	return <PostHogProviderWrapper>{children}</PostHogProviderWrapper>;
}
