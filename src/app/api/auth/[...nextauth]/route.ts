import { handlers } from "~/server/auth";

/**
 * NextAuth.js API route handlers for authentication.
 *
 * Handles all authentication-related HTTP requests including:
 * - Sign in/out flows
 * - OAuth callbacks
 * - Session management
 * - CSRF protection
 *
 * The [...nextauth] dynamic route catches all auth-related paths
 * under /api/auth/ and routes them to the appropriate handlers.
 *
 * @see https://next-auth.js.org/configuration/initialization#route-handlers-app
 */
export const { GET, POST } = handlers;
