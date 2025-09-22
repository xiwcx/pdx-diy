import Link from "next/link";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";

/**
 * Server component that renders the event detail page for a single event.
 *
 * Fetches the event by ID from the server-side API and renders the title,
 * creation date, and an optional updated date. If the event does not exist,
 * this component triggers a 404 via `notFound()`.
 *
 * Props:
 * - `params` — a Promise that resolves to an object containing the route `id` (Next.js 15 route param).
 *
 * Accessibility:
 * - Uses a semantic `<main>` landmark and an `h1` for the event title.
 * - The back navigation is a keyboard-focusable link; ensure any surrounding layout preserves skip-link and focus order.
 *
 * @param params - Promise resolving to `{ id: string }`, the route parameters for the page.
 * @returns The server-rendered JSX for the event detail page; triggers a 404 response when the event is not found.
 *
 * @example
 * ```tsx
 * // Rendered automatically at the route "/events/[id]".
 * <EventDetailPage params={Promise.resolve({ id: '123' })} />
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
