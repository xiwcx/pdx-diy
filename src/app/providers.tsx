"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window !== "undefined") {
			const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
			const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

			if (posthogKey && posthogHost) {
				posthog.init(posthogKey, {
					api_host: posthogHost,
					capture_pageview: false, // Disable automatic pageview capture, as we capture manually
					capture_pageleave: false, // Disable automatic pageleave capture
				});
			}
		}
	}, []);

	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return <PostHogProviderWrapper>{children}</PostHogProviderWrapper>;
}
