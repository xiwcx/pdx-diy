/**
 * @fileoverview Server-side PostHog analytics integration for PDX-DIY.
 *
 * This module provides a secure, server-side PostHog client with helper functions
 * for event tracking, user identification, and feature flag evaluation. All functions
 * include comprehensive error handling to prevent analytics failures from affecting
 * the main application.
 *
 * Key features:
 * - Singleton PostHog client for optimal resource usage
 * - Safe error handling with fallback values
 * - Comprehensive JSDoc documentation with examples
 * - Security-focused design (no PII exposure)
 *
 * @author PDX-DIY Team
 * @since 1.0.0
 */

import { PostHog } from "posthog-node";
import { env } from "~/env";

// Create a singleton PostHog instance for server-side use
declare global {
	// eslint-disable-next-line no-var
	var __posthogClient: PostHog | undefined;
}

// Create a singleton PostHog instance for server-side use
let posthog: PostHog | null = globalThis.__posthogClient ?? null;

/**
 * Gets or creates a singleton PostHog client instance for server-side use.
 *
 * This function implements the singleton pattern to ensure only one PostHog client
 * is created per server instance, improving performance and resource usage.
 *
 * @returns {PostHog} The PostHog client instance configured with environment variables
 *
 * @example
 * ```typescript
 * const client = getPostHogClient();
 * await client.capture({ distinctId: 'user123', event: 'page_view' });
 * ```
 */
export function getPostHogClient(): PostHog {
	if (!posthog) {
		posthog = new PostHog(env.POSTHOG_KEY, {
			host: env.POSTHOG_HOST,
		});
		globalThis.__posthogClient = posthog;
	}
	return posthog;
}

/**
 * Safely captures an event in PostHog with error handling.
 *
 * This function wraps PostHog's capture method with try-catch to prevent
 * analytics failures from breaking the application. Automatically adds
 * library metadata to all events.
 *
 * @param {string} distinctId - Unique identifier for the user/session
 * @param {string} event - Name of the event to track (e.g., 'button_clicked', 'page_viewed')
 * @param {Record<string, unknown>} [properties] - Optional event properties/metadata
 *
 * @returns {Promise<void>} Promise that resolves when event is captured or error is handled
 *
 * @example
 * ```typescript
 * // Basic event tracking
 * await captureEvent('user123', 'login');
 *
 * // Event with properties
 * await captureEvent('user123', 'button_clicked', {
 *   button_name: 'signup',
 *   page: 'home',
 *   experiment_variant: 'blue_button'
 * });
 * ```
 */
export async function captureEvent(
	distinctId: string,
	event: string,
	properties?: Record<string, unknown>,
) {
	// Validate inputs
	const trimmedDistinctId = distinctId?.trim();
	const trimmedEvent = event?.trim();

	if (!trimmedDistinctId) {
		console.error(
			"PostHog captureEvent: distinctId must be a non-empty string",
		);
		return;
	}

	if (!trimmedEvent) {
		console.error("PostHog captureEvent: event must be a non-empty string");
		return;
	}

	try {
		const client = getPostHogClient();
		await client.capture({
			distinctId: trimmedDistinctId,
			event: trimmedEvent,
			properties: {
				...(properties ?? {}),
			},
		});
	} catch (error) {
		console.error("Failed to capture PostHog event:", error);
	}
}

/**
 * Identifies a user in PostHog with their properties and traits.
 *
 * This function associates a distinct ID with user properties, enabling
 * better user analytics and personalization. Use this when a user signs up,
 * logs in, or when you have new information about them.
 *
 * @param {string} distinctId - Unique identifier for the user
 * @param {Record<string, unknown>} [properties] - User properties like name, email, plan, etc.
 *
 * @returns {Promise<void>} Promise that resolves when user is identified or error is handled
 *
 * @example
 * ```typescript
 * // Identify user at login
 * await identifyUser('user123', {
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   plan: 'premium',
 *   signup_date: '2024-01-15'
 * });
 *
 * // Update user properties
 * await identifyUser('user123', {
 *   last_login: new Date().toISOString(),
 *   feature_flags_enabled: true
 * });
 * ```
 *
 * @security Only send non-sensitive user data. Never include passwords, tokens, or PII.
 */
export async function identifyUser(
	distinctId: string,
	properties?: Record<string, unknown>,
) {
	// Validate distinctId
	const trimmedDistinctId = distinctId?.trim();
	if (!trimmedDistinctId) {
		console.warn("PostHog identifyUser: distinctId must be a non-empty string");
		return;
	}

	// Validate properties if provided
	if (properties !== undefined) {
		if (
			typeof properties !== "object" ||
			properties === null ||
			Array.isArray(properties)
		) {
			console.warn(
				"PostHog identifyUser: properties must be a plain object (Record<string, unknown>)",
			);
			return;
		}
	}

	try {
		const client = getPostHogClient();
		await client.identify({
			distinctId: trimmedDistinctId,
			properties,
		});
	} catch (error) {
		console.error("Failed to identify user in PostHog:", error);
	}
}

/**
 * Retrieves all feature flags for a user from PostHog.
 *
 * This function fetches the current state of all feature flags for a given user,
 * allowing for server-side feature flag evaluation and conditional logic.
 * Returns null if PostHog returns null or if there's an error.
 *
 * @param {string} distinctId - Unique identifier for the user
 * @param {Record<string, string>} [groups] - Optional group identifiers for group-based flags
 *
 * @returns {Promise<Record<string, boolean | string> | null>} Object containing flag keys and their values, or null if unavailable
 *
 * @example
 * ```typescript
 * // Get all flags for a user
 * const flags = await getFeatureFlags('user123');
 * if (flags && flags.new_dashboard_enabled) {
 *   // Show new dashboard
 * }
 *
 * // Get flags with group context
 * const flags = await getFeatureFlags('user123', {
 *   company: 'acme-corp',
 *   plan: 'enterprise'
 * });
 *
 * // Always check for null before using flags
 * if (flags) {
 *   const isFeatureEnabled = flags.some_feature || false;
 * }
 * ```
 */
export async function getFeatureFlags(
	distinctId: string,
	groups?: Record<string, string>,
): Promise<Record<string, boolean | string> | null> {
	try {
		const client = getPostHogClient();
		const flags = await client.getAllFlags(distinctId, groups);
		// Propagate null if PostHog returns null/undefined
		return flags ?? null;
	} catch (error) {
		console.error("Failed to get feature flags from PostHog:", error);
		return null;
	}
}

/**
 * Checks if a specific feature flag is enabled for a user.
 *
 * This is a convenience function for checking a single feature flag instead of
 * fetching all flags. It returns false by default if there's an error or if
 * the flag is not found, making it safe to use in conditional statements.
 *
 * @param {string} distinctId - Unique identifier for the user
 * @param {string} flagKey - The key/name of the specific feature flag to check
 * @param {Record<string, string>} [groups] - Optional group identifiers for group-based flags
 *
 * @returns {Promise<boolean>} True if the flag is enabled, false otherwise
 *
 * @example
 * ```typescript
 * // Simple flag check
 * const canAccessBeta = await isFeatureEnabled('user123', 'beta_features');
 * if (canAccessBeta) {
 *   // Show beta features
 * }
 *
 * // Flag check with groups
 * const hasAdvancedFeatures = await isFeatureEnabled(
 *   'user123',
 *   'advanced_features',
 *   { plan: 'enterprise' }
 * );
 * ```
 */
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

/**
 * Gracefully shuts down the PostHog client and cleans up resources.
 *
 * This function should be called when the server is shutting down to ensure
 * all pending events are flushed and connections are properly closed.
 * It's useful for cleanup in server shutdown hooks or testing teardown.
 *
 * @returns {Promise<void>} Promise that resolves when shutdown is complete
 *
 * @example
 * ```typescript
 * // In server shutdown handler
 * process.on('SIGTERM', async () => {
 *   await shutdownPostHog();
 *   process.exit(0);
 * });
 *
 * // In test teardown
 * afterAll(async () => {
 *   await shutdownPostHog();
 * });
 * ```
 */
export async function shutdownPostHog() {
	if (posthog) {
		await posthog.shutdown();
		posthog = null;
		globalThis.__posthogClient = undefined;
	}
}
