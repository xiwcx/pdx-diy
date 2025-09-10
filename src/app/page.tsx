import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";
import { captureEvent } from "~/server/posthog";

export default async function Home() {
	const session = await auth();

	// Track page visit in PostHog
	await captureEvent(
		session?.user?.id ?? 'anonymous',
		'home_page_visited',
		{
			is_authenticated: !!session,
			user_name: session?.user?.name,
		}
	);

	return (
		<HydrateClient>
			<main>
				<div>
					<h1>
						PDX DIY
					</h1>

					<div>
						<p>
							Welcome to PDX DIY
						</p>

						<Link href="/events/create">Create event</Link>

						<div>
							<p>
								{session && <span>Logged in as {session.user?.name}</span>}
							</p>
							<Link
								href={session ? "/api/auth/signout" : "/api/auth/signin"}
							>
								{session ? "Sign out" : "Sign in"}
							</Link>
						</div>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
