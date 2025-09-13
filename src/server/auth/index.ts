import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

/**
 * NextAuth.js configuration with handlers and authentication functions.
 *
 * Provides authentication functionality using Resend email provider
 * with Drizzle ORM adapter for data persistence.
 */
const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

/**
 * Cached authentication function for React Server Components.
 *
 * Optimized for React Server Components by caching the authentication
 * result across the request lifecycle to prevent multiple database calls.
 *
 * @returns Promise resolving to the current session or null if not authenticated
 *
 * @example
 * ```typescript
 * const session = await auth();
 * if (session?.user) {
 *   console.log("User is authenticated:", session.user.email);
 * }
 * ```
 */
const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
