import {
	QueryClient,
	defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

/**
 * Creates a React Query client configured for tRPC and SSR.
 *
 * Optimized for server-side rendering with SuperJSON serialization
 * and appropriate stale time settings to prevent unnecessary refetches
 * during hydration.
 *
 * @returns A configured QueryClient instance
 *
 * @example
 * ```typescript
 * const queryClient = createQueryClient();
 *
 * // Use in React Query Provider
 * <QueryClientProvider client={queryClient}>
 *   <App />
 * </QueryClientProvider>
 * ```
 */
export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				// With SSR, we usually want to set some default staleTime
				// above 0 to avoid refetching immediately on the client
				staleTime: 30 * 1000,
			},
			dehydrate: {
				serializeData: SuperJSON.serialize,
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
			hydrate: {
				deserializeData: SuperJSON.deserialize,
			},
		},
	});
