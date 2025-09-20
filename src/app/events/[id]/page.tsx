import Link from "next/link";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";

/**
 * Event detail page component displaying a single event's information.
 *
 * Shows the full details of an event including title, creation date,
 * and provides navigation back to the event list.
 *
 * @param params - Route parameters containing the event ID (must be awaited in Next.js 15)
 * @returns The event detail page JSX element or 404 if event not found
 *
 * @example
 * ```tsx
 * // Automatically rendered at route "/events/[id]"
 * <EventDetailPage params={Promise.resolve({ id: "123" })} />
 * ```
 */
export default async function EventDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const event = await api.event.getById({ id });

	if (!event) {
		notFound();
	}

	return (
		<main>
			<div>
				<Link href="/">← Back to events</Link>

				<h1>{event.title}</h1>

				<p>Created: {event.createdAt.toLocaleDateString()}</p>

				{event.updatedAt && (
					<p>Updated: {event.updatedAt.toLocaleDateString()}</p>
				)}
			</div>
		</main>
	);
}
