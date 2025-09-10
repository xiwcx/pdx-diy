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
export const createTable = pgTableCreator((name) => `pdx-diy_${name}`);

/**
 * TODO:
 *
 * - make image uploads work
 * - make addresses work
 * - make WYSIWYG editor
 *   - sanitization
 *   - validation
 *   - store
 *   - de/serialization
 */
export const events = createTable("event", (d) => ({
	id: defaultUUID(d),
	title: d.varchar({ length: 255 }).notNull(),
	createdById: d.varchar({ length: 255 }).references(() => users.id),
	heroImageId: d.varchar({ length: 255 }).references(() => assets.id),
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [events.createdById],
		references: [users.id],
	}),
	heroImage: one(assets, {
		fields: [events.heroImageId],
		references: [assets.id],
	}),
}));

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

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	events: many(events),
	uploadedAssets: many(assets),
}));

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

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

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

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verification_token",
	(d) => ({
		identifier: d.varchar({ length: 255 }).notNull(),
		token: d.varchar({ length: 255 }).notNull(),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const assets = createTable("asset", (d) => ({
	id: defaultUUID(d),
	// R2 object key (the path/name in the bucket)
	objectKey: d.varchar({ length: 500 }).notNull(),
	// Original filename from upload
	originalName: d.varchar({ length: 255 }).notNull(),
	// MIME type
	mimeType: d.varchar({ length: 100 }).notNull(),
	// File size in bytes
	size: d.bigint({ mode: "number" }).notNull(),
	// Image dimensions
	width: d.integer(),
	height: d.integer(),
	// R2 bucket name
	bucketName: d.varchar({ length: 100 }).notNull(),
	// Public URL for accessing the asset
	publicUrl: d.varchar({ length: 1000 }),
	// Description (optional)
	description: d.varchar({ length: 1000 }),
	// Upload metadata
	uploadedById: d.varchar({ length: 255 }).references(() => users.id),
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
	uploadedBy: one(users, {
		fields: [assets.uploadedById],
		references: [users.id],
	}),
	eventsAsHeroImage: many(events),
}));
