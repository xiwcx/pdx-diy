import { PostHog } from "posthog-node";
import { env } from "~/env.js";

// Create a singleton PostHog instance for server-side use
let posthog: PostHog | null = null;

export function getPostHogClient(): PostHog {
	if (!posthog) {
		posthog = new PostHog(env.POSTHOG_KEY, {
			host: env.POSTHOG_HOST,
		});
	}
	return posthog;
}

// Helper function to safely capture events
export async function captureEvent(
	distinctId: string,
	event: string,
	properties?: Record<string, unknown>,
) {
	try {
		const client = getPostHogClient();
		await client.capture({
			distinctId,
			event,
			properties: {
				...properties,
				$lib: "posthog-node",
				$lib_version: "5.8.2",
			},
		});
	} catch (error) {
		console.error("Failed to capture PostHog event:", error);
	}
}

// Helper function to identify users
export async function identifyUser(
	distinctId: string,
	properties?: Record<string, unknown>,
) {
	try {
		const client = getPostHogClient();
		await client.identify({
			distinctId,
			properties,
		});
	} catch (error) {
		console.error("Failed to identify user in PostHog:", error);
	}
}

// Helper function to get feature flags
export async function getFeatureFlags(
	distinctId: string,
	groups?: Record<string, string>,
) {
	try {
		const client = getPostHogClient();
		return await client.getAllFlags(distinctId, groups);
	} catch (error) {
		console.error("Failed to get feature flags from PostHog:", error);
		return {};
	}
}

// Helper function to check if a feature flag is enabled
export async function isFeatureEnabled(
	distinctId: string,
	flagKey: string,
	groups?: Record<string, string>,
): Promise<boolean> {
	try {
		const client = getPostHogClient();
		const result = await client.isFeatureEnabled(flagKey, distinctId, groups);
		return result ?? false;
	} catch (error) {
		console.error("Failed to check feature flag in PostHog:", error);
		return false;
	}
}

// Helper function to shutdown PostHog (useful for cleanup)
export async function shutdownPostHog() {
	if (posthog) {
		await posthog.shutdown();
		posthog = null;
	}
}
