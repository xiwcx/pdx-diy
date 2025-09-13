"use client";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchStreamLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import type { AppRouter } from "~/server/api/root";
import { createQueryClient } from "./query-client";

/**
 * Singleton query client for browser-side caching.
 * Prevents unnecessary query client recreation in the browser.
 */
let clientQueryClientSingleton: QueryClient | undefined = undefined;

/**
 * Gets or creates a React Query client with SSR-optimized behavior.
 *
 * Server-side: Always creates a new client to prevent cross-request pollution.
 * Client-side: Uses singleton pattern to maintain cache across navigations.
 *
 * @returns A React Query client instance
 */
const getQueryClient = () => {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return createQueryClient();
	}
	// Browser: use singleton pattern to keep the same query client
	clientQueryClientSingleton ??= createQueryClient();

	return clientQueryClientSingleton;
};

/**
 * tRPC React client for making type-safe API calls from React components.
 *
 * Provides hooks for queries, mutations, and subscriptions with full
 * TypeScript integration and React Query caching.
 *
 * @example
 * ```typescript
 * // In a React component
 * const { data: posts } = api.post.getLatest.useQuery();
 * const createPost = api.post.create.useMutation();
 * ```
 */
export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * tRPC React provider component that sets up the tRPC client and React Query.
 *
 * Configures the tRPC client with proper error handling, logging, and
 * SuperJSON transformation. Must wrap the application to enable tRPC hooks.
 *
 * @param props - Component props
 * @param props.children - Child components that will have access to tRPC
 *
 * @example
 * ```tsx
 * <TRPCReactProvider>
 *   <App />
 * </TRPCReactProvider>
 * ```
 */
export function TRPCReactProvider(props: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	const [trpcClient] = useState(() =>
		api.createClient({
			links: [
				loggerLink({
					enabled: (op) =>
						process.env.NODE_ENV === "development" ||
						(op.direction === "down" && op.result instanceof Error),
				}),
				httpBatchStreamLink({
					transformer: SuperJSON,
					url: `${getBaseUrl()}/api/trpc`,
					headers: () => {
						const headers = new Headers();
						headers.set("x-trpc-source", "nextjs-react");
						return headers;
					},
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<api.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</api.Provider>
		</QueryClientProvider>
	);
}

/**
 * Determines the base URL for tRPC API calls based on the environment.
 *
 * Client-side: Uses the current window location origin
 * Vercel production: Uses the VERCEL_URL environment variable
 * Development: Falls back to localhost with configurable port
 *
 * @returns The base URL for API requests
 */
function getBaseUrl() {
	if (typeof window !== "undefined") return window.location.origin;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
