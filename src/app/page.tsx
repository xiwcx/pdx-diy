import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

/**
 * Server-rendered home page that lists PDX DIY events and provides navigation for creating events and signing in/out.
 *
 * Renders a hydrated TRPC client state and displays:
 * - Header with site title and a "Create event" link.
 * - Authentication status when a session exists and a sign-in/sign-out link.
 * - An "Events" section that shows either a fallback message when no events exist or a list of events linking to each event's detail page. Each event shows its title and creation date.
 *
 * Notes:
 * - This is an async server component: it awaits the authenticated session and event list before rendering.
 * - No props.
 *
 * Accessibility considerations:
 * - Headings are used for document structure (h1 for the page title, h2 for the events section, h3 for each event).
 * - Links are used for navigation to create an event, authentication endpoints, and individual event pages; ensure surrounding UI provides sufficient focus styles and descriptive link text in the app's global stylesheet or a11y utilities.
 *
 * @returns The JSX element for the home page.
 *
 * @example
 * ```tsx
 * // Rendered automatically at the root route ("/")
 * <Home />
 * ```
 */
export default async function Home() {
	const session = await auth();
	const events = await api.event.getMany();

	return (
		<HydrateClient>
			<main>
				<div>
					<h1>PDX DIY</h1>

					<div>
						<Link href="/events/create">Create event</Link>

						<div>
							{session ? (
								<p>
									<span>Logged in as {session.user?.name}</span>
								</p>
							) : null}

							<Link href={session ? "/api/auth/signout" : "/api/auth/signin"}>
								{session ? "Sign out" : "Sign in"}
							</Link>
						</div>
					</div>

					<div>
						<h2>Events</h2>
						{events.length === 0 ? (
							<p>No events yet. Create the first one!</p>
						) : (
							<ul>
								{events.map((event) => (
									<li key={event.id}>
										<Link href={`/events/${event.id}`}>
											<div>
												<h3>{event.title}</h3>
												<p>Created: {event.createdAt.toLocaleDateString()}</p>
											</div>
										</Link>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
