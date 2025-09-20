import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { events } from "~/server/db/schema";
import { eventSchema } from "~/shared/schemas/event";

export const eventRouter = createTRPCRouter({
	create: protectedProcedure
		.input(eventSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.insert(events).values({
				title: input.title,
				createdById: ctx.session.user.id,
			});
		}),

	getMany: publicProcedure.query(async ({ ctx }) => {
		const events = await ctx.db.query.events.findMany();
		return events;
	}),

	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.db.query.events.findFirst({
				where: (events, { eq }) => eq(events.id, input.id),
			});
			return event;
		}),
});
