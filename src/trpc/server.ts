import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import { type AppRouter, createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
	const heads = new Headers(await headers());
	heads.set("x-trpc-source", "rsc");

	return createTRPCContext({
		headers: heads,
	});
});

/**
 * Cached query client factory for server-side rendering.
 *
 * Creates a new React Query client for each server request
 * to prevent cross-request data pollution.
 */
const getQueryClient = cache(createQueryClient);

/**
 * Server-side tRPC caller for React Server Components.
 *
 * Enables direct API calls from server components without
 * going through HTTP. Maintains type safety and includes
 * proper context (auth, headers, etc.).
 */
const caller = createCaller(createContext);

/**
 * tRPC utilities for server-side rendering and hydration.
 *
 * - `api`: Server-side tRPC client for React Server Components
 * - `HydrateClient`: Component to hydrate client-side cache with server data
 *
 * @example
 * ```tsx
 * // In a server component
 * const events = await api.event.getAll();
 *
 * // In your page
 * <HydrateClient>
 *   <PostsList />
 * </HydrateClient>
 * ```
 */
export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
	caller,
	getQueryClient,
);
