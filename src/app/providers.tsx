"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
// biome-ignore lint/style/useImportType: React needed at runtime for JSX transform
import React, { useEffect } from "react";
import { env } from "~/env.js";

function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
			const posthogKey = env.NEXT_PUBLIC_POSTHOG_KEY;
			const posthogHost = env.NEXT_PUBLIC_POSTHOG_HOST;

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

export function Providers({ children }: { children: React.ReactNode }) {
	return <PostHogProviderWrapper>{children}</PostHogProviderWrapper>;
}
