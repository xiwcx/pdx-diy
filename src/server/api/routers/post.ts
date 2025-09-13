import { z } from "zod";

import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { posts } from "~/server/db/schema";

/**
 * Post router containing CRUD operations for posts.
 *
 * This router provides authenticated endpoints for creating posts,
 * retrieving the latest post, and accessing protected content.
 * All operations require user authentication for security.
 *
 * @example
 * ```typescript
 * // Create a new post
 * const result = await api.post.create.mutate({ name: "My Post" });
 *
 * // Get the latest post
 * const latestPost = await api.post.getLatest.query();
 * ```
 */
export const postRouter = createTRPCRouter({
	/**
	 * Creates a new post with the provided name.
	 *
	 * Requires authentication. The post will be associated with the
	 * currently authenticated user as the creator.
	 *
	 * @param input - Object containing the post name (min 1 character)
	 * @returns Promise that resolves when the post is created
	 *
	 * @throws {TRPCError} UNAUTHORIZED if user is not authenticated
	 * @throws {TRPCError} BAD_REQUEST if name is empty or invalid
	 */
	create: protectedProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.insert(posts).values({
				name: input.name,
				createdById: ctx.session.user.id,
			});
		}),

	/**
	 * Retrieves the most recently created post.
	 *
	 * Requires authentication. Returns the latest post ordered by creation date,
	 * or null if no posts exist.
	 *
	 * @returns Promise resolving to the latest post object or null if none exist
	 *
	 * @throws {TRPCError} UNAUTHORIZED if user is not authenticated
	 */
	getLatest: protectedProcedure.query(async ({ ctx }) => {
		const post = await ctx.db.query.posts.findFirst({
			orderBy: (posts, { desc }) => [desc(posts.createdAt)],
		});

		return post ?? null;
	}),

	/**
	 * Returns a secret message for authenticated users only.
	 *
	 * This is a demonstration endpoint that requires authentication
	 * to access. Used to verify that authentication is working properly.
	 *
	 * @returns Promise resolving to a secret message string
	 *
	 * @throws {TRPCError} UNAUTHORIZED if user is not authenticated
	 */
	getSecretMessage: protectedProcedure.query(() => {
		return "you can now see this secret message!";
	}),
});
