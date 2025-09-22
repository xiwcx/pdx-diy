import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Resend from "next-auth/providers/resend";

import { env } from "~/env";
import { db } from "~/server/db";
import {
	accounts,
	sessions,
	users,
	verificationTokens,
} from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			// ...other properties
			// role: UserRole;
		} & DefaultSession["user"];
	}

	// interface User {
	//   // ...other properties
	//   // role: UserRole;
	// }
}

const maxAge = 14 * 24 * 60 * 60; // 14 days

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * Uses environment-based strategy selection:
 * - Test/Development: Database sessions (easier testing)
 * - Production: JWT sessions (better performance)
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		Resend({
			apiKey: env.AUTH_RESEND_KEY,
			from: env.AUTH_RESEND_FROM, // Using Resend's test domain
			// For development testing, you can only send to your own email
			// For production, verify a domain at resend.com/domains
		}),
		/**
		 * Magic links are now the primary authentication method.
		 * To add more providers, refer to the NextAuth.js docs:
		 * @see https://next-auth.js.org/providers/
		 */
	],
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),
	session: {
		strategy: process.env.NODE_ENV === "production" ? "jwt" : "database",
		maxAge,
	},
	// JWT configuration only for production
	...(process.env.NODE_ENV === "production" && {
		jwt: { maxAge },
	}),
	callbacks: {
		// JWT callback only for production
		...(process.env.NODE_ENV === "production" && {
			jwt: async ({ token, user }) => {
				if (user) token.sub = String(user.id);
				return token;
			},
		}),
		// Session callback handles both database and JWT strategies
		session: ({ session, token, user }) => {
			// For database strategy (test/development), user is provided
			if (user) {
				return {
					...session,
					user: {
						...session.user,
						id: user.id,
					},
				};
			}
			// For JWT strategy (production), token is provided
			if (token) {
				// Safely derive user ID from available sources
				const userId = token.sub ?? (token as { id?: string }).id;
				if (userId) {
					return {
						...session,
						user: {
							...session.user,
							id: String(userId),
						},
					};
				}
			}
			return session;
		},
	},
} satisfies NextAuthConfig;
