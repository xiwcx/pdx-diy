"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

/**
 * PostHog pageview tracking component for client-side analytics.
 *
 * Automatically captures pageview events when the route changes,
 * while filtering out sensitive URL parameters like auth tokens.
 * Must be rendered within a PostHog provider context.
 *
 * @returns null (component has no visual output)
 *
 * @example
 * ```tsx
 * // Include in your layout or root component
 * <PostHogProvider client={posthog}>
 *   <PostHogPageview />
 *   <App />
 * </PostHogProvider>
 * ```
 *
 * @security Automatically removes sensitive parameters to prevent token leakage
 */
export function PostHogPageview() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const posthog = usePostHog();

	// Serialize search params once outside the effect, filtering sensitive parameters
	const search = (() => {
		const params = new URLSearchParams(searchParams.toString());
		// Remove sensitive parameters that could contain auth tokens or codes
		const sensitiveParams = [
			"code",
			"token",
			"access_token",
			"refresh_token",
			"auth_token",
			"api_key",
		];
		for (const param of sensitiveParams) {
			params.delete(param);
		}
		return params.toString();
	})();

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
