import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

/**
 * Home page component displaying the PDX DIY welcome message and authentication status.
 *
 * This is the main landing page that shows a welcome message and provides
 * authentication controls. Displays the logged-in user's name if authenticated,
 * otherwise shows a sign-in link.
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

	return (
		<HydrateClient>
			<main>
				<div>
					<h1>PDX DIY</h1>

					<div>
						<p>Welcome to PDX DIY</p>

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
				</div>
			</main>
		</HydrateClient>
	);
}
