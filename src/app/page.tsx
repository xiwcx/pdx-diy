import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

/**
 * Home page component displaying the PDX DIY event list and navigation.
 *
 * This is the main landing page that shows all events in a simple list format.
 * Each event displays title and creation date, and is clickable to navigate
 * to the event detail page.
 *
 * @returns The home page JSX element
 *
 * @example
 * ```tsx
 * // This page is automatically rendered at the root route "/"
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
