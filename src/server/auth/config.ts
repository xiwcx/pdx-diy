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
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	// JWT configuration only for production
	...(process.env.NODE_ENV === "production" && {
		jwt: {
			maxAge: 30 * 24 * 60 * 60, // 30 days
		},
	}),
	callbacks: {
		// JWT callback only for production
		...(process.env.NODE_ENV === "production" && {
			jwt: async ({ token, user }) => {
				// If user is provided (during sign in), add user data to token
				if (user) {
					token.id = user.id;
				}
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
				return {
					...session,
					user: {
						...session.user,
						id: token.id as string,
					},
				};
			}
			return session;
		},
	},
} satisfies NextAuthConfig;
