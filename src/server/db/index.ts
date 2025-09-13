import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

/**
 * PostgreSQL database connection instance.
 *
 * Cached in development to prevent connection pool exhaustion during
 * hot module reloading. Uses environment variables for configuration.
 */
const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

/**
 * Drizzle ORM database instance configured with the application schema.
 *
 * This is the main database instance used throughout the application.
 * Includes all table definitions and relationships from the schema.
 * Provides type-safe database operations with excellent DX.
 *
 * @example
 * ```typescript
 * // Query users
 * const users = await db.query.users.findMany();
 *
 * // Insert a post
 * await db.insert(posts).values({ name: "Hello World", createdById: userId });
 * ```
 */
export const db = drizzle(conn, { schema });
