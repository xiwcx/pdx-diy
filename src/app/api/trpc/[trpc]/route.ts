import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
	return createTRPCContext({
		headers: req.headers,
	});
};

/**
 * HTTP handler for tRPC API requests.
 *
 * Configures the tRPC fetch adapter to handle both GET and POST requests
 * to the /api/trpc endpoint. Includes development error logging for
 * better debugging experience.
 *
 * @param req - The incoming Next.js request object
 * @returns tRPC fetch handler response
 */
const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError:
			env.NODE_ENV === "development"
				? ({ path, error }) => {
						console.error(
							`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
						);
					}
				: undefined,
	});

/**
 * Next.js API route handlers for tRPC.
 *
 * Exports the same handler for both GET and POST HTTP methods
 * to support all tRPC operation types (queries, mutations, subscriptions).
 */
export { handler as GET, handler as POST };
