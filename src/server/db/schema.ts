import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import type { PgColumnsBuilders } from "drizzle-orm/pg-core/columns/all";
import type { AdapterAccount } from "next-auth/adapters";
import { uuidv7 } from "uuidv7";

/**
 * A helper function to create a default UUID column.
 * @param d - The Drizzle ORM column builder.
 * @returns A Drizzle ORM column builder with a default UUID v7.
 */
const defaultUUID = (d: PgColumnsBuilders) =>
	d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => uuidv7());

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
/**
 * Creates a table with the PDX-DIY prefix for multi-project schema support.
 *
 * This helper function automatically prefixes table names with "pdx-diy_"
 * to support multi-project database schemas as recommended by Drizzle ORM.
 *
 * @param name - The base name of the table (without prefix)
 * @returns A table creator function with the PDX-DIY prefix
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `pdx-diy_${name}`);

/**
 * Posts table schema for storing user-created posts.
 *
 * Each post has an auto-incrementing ID, a name, creator reference,
 * and timestamps for creation and updates. Includes indexes for
 * optimal query performance.
 *
 * @table pdx-diy_post
 */
export const posts = createTable(
	"post",
	(d) => ({
		id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
		name: d.varchar({ length: 256 }),
		createdById: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("created_by_idx").on(t.createdById),
		index("name_idx").on(t.name),
	],
);

/**
 * Events table schema for storing community events.
 *
 * TODO:
 * - make image uploads work
 * - make addresses work
 * - make WYSIWYG editor
 *   - sanitization
 *   - validation
 *   - store
 *   - de/serialization
 *
 * @table pdx-diy_event
 */
export const events = createTable("event", (d) => ({
	id: defaultUUID(d),
	title: d.varchar({ length: 255 }).notNull(),
	createdById: d.varchar({ length: 255 }).references(() => users.id),
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

/**
 * Users table schema for storing user account information.
 *
 * Supports NextAuth.js authentication with email-based identification.
 * Includes fields for user profile information and email verification.
 *
 * @table pdx-diy_user
 */
export const users = createTable("user", (d) => ({
	id: defaultUUID(d),
	name: d.varchar({ length: 255 }),
	email: d.varchar({ length: 255 }).notNull(),
	emailVerified: d
		.timestamp({
			mode: "date",
			withTimezone: true,
		})
		.default(sql`CURRENT_TIMESTAMP`),
	image: d.varchar({ length: 255 }),
}));

/**
 * Defines the relationship between users and their authentication accounts.
 *
 * A user can have multiple authentication accounts (e.g., different providers).
 * This relation enables querying user accounts through Drizzle's relational API.
 */
export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
}));

/**
 * Accounts table schema for NextAuth.js authentication providers.
 *
 * Stores OAuth account information from external providers like Google,
 * GitHub, or email-based authentication. Each account is linked to a user
 * and contains provider-specific tokens and metadata.
 *
 * @table pdx-diy_account
 */
export const accounts = createTable(
	"account",
	(d) => ({
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
		provider: d.varchar({ length: 255 }).notNull(),
		providerAccountId: d.varchar({ length: 255 }).notNull(),
		refresh_token: d.text(),
		access_token: d.text(),
		expires_at: d.integer(),
		token_type: d.varchar({ length: 255 }),
		scope: d.varchar({ length: 255 }),
		id_token: d.text(),
		session_state: d.varchar({ length: 255 }),
	}),
	(t) => [
		primaryKey({ columns: [t.provider, t.providerAccountId] }),
		index("account_user_id_idx").on(t.userId),
	],
);

/**
 * Defines the relationship between accounts and their associated user.
 *
 * Each account belongs to exactly one user. This relation enables
 * querying user information from account records.
 */
export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

/**
 * Sessions table schema for NextAuth.js session management.
 *
 * Stores active user sessions with tokens and expiration times.
 * Used to maintain user authentication state across requests.
 *
 * @table pdx-diy_session
 */
export const sessions = createTable(
	"session",
	(d) => ({
		sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [index("t_user_id_idx").on(t.userId)],
);

/**
 * Defines the relationship between sessions and their associated user.
 *
 * Each session belongs to exactly one user. This relation enables
 * querying user information from session records.
 */
export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

/**
 * Verification tokens table schema for NextAuth.js email verification.
 *
 * Stores temporary tokens used for email verification and password resets.
 * Tokens expire after a set time for security purposes.
 *
 * @table pdx-diy_verification_token
 */
export const verificationTokens = createTable(
	"verification_token",
	(d) => ({
		identifier: d.varchar({ length: 255 }).notNull(),
		token: d.varchar({ length: 255 }).notNull(),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
