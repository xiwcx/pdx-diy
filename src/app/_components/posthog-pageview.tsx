"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogPageview() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const posthog = usePostHog();

	// Serialize search params once outside the effect
	const search = searchParams.toString();

	useEffect(() => {
		// Only run on client side
		if (typeof window === "undefined") return;

		if (pathname && posthog) {
			let url = `${window.location.origin}${pathname}`;
			if (search) {
				url = `${url}?${search}`;
			}
			posthog.capture("$pageview", {
				$current_url: url,
			});
		}
	}, [pathname, search, posthog]);

	return null;
}
