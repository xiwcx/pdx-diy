import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { events } from "~/server/db/schema";
import { eventSchema } from "~/shared/schemas/event";

export const eventRouter = createTRPCRouter({
	/**
	 * Creates a new event with the provided title.
	 * Requires authentication and associates the event with the current user.
	 */
	create: protectedProcedure
		.input(eventSchema)
		.mutation(async ({ ctx, input }) => {
			const [event] = await ctx.db
				.insert(events)
				.values({
					title: input.title,
					createdById: ctx.session.user.id,
				})
				.returning();

			return event;
		}),

	/**
	 * Retrieves all events from the database.
	 * Public endpoint that returns all events without filtering.
	 */
	getMany: publicProcedure.query(async ({ ctx }) => {
		const events = await ctx.db.query.events.findMany();
		return events;
	}),

	/**
	 * Retrieves a specific event by its ID.
	 * Returns null if the event is not found.
	 */
	getById: publicProcedure
		// to-do: validate the id is a valid uuid7, maybe migrate to zod 4
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.db.query.events.findFirst({
				where: (events, { eq }) => eq(events.id, input.id),
			});
			return event;
		}),
});
