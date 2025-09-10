import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { events } from "~/server/db/schema";
import { eventSchema } from "~/shared/schemas/event";
import { captureEvent } from "~/server/posthog";

export const eventRouter = createTRPCRouter({
	create: protectedProcedure
		.input(eventSchema)
		.mutation(async ({ ctx, input }) => {
			const [event] = await ctx.db
				.insert(events)
				.values({
					title: input.title,
					createdById: ctx.session.user.id,
					heroImageId: input.heroImageId,
				})
				.returning();

			if (!event) {
				throw new Error("Failed to create event");
			}

			// Track event creation in PostHog
			await captureEvent(ctx.session.user.id, "event_created", {
				event_id: event.id,
				event_title: input.title,
				user_id: ctx.session.user.id,
				has_hero_image: !!input.heroImageId,
			});

			return event;
		}),

	getMany: publicProcedure.query(async ({ ctx }) => {
		const events = await ctx.db.query.events.findMany();

		// Track event listing in PostHog
		await captureEvent("anonymous", "events_listed", {
			event_count: events.length,
		});

		return events;
	}),
});
