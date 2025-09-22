import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { CreateEventForm } from "./_components/create-event-form";

/**
 * Next.js app-router page component that renders the "Create Event" UI for authenticated users.
 *
 * If there is no active session, the function redirects the user to `/api/auth/signin`. When
 * authenticated, it returns the page markup containing an accessible top-level heading and the
 * CreateEventForm component.
 *
 * Accessibility:
 * - Uses a single `h1` as the page landmark for screen readers.
 * - Ensure CreateEventForm fields provide labels and appropriate ARIA attributes.
 *
 * Usage:
 * - This is a route-level default export; no direct imports are required when used as
 *   `src/app/events/create/page.tsx`. Navigate to `/events/create` in the app to access the page.
 *
 * @returns A promise resolving to the page's JSX content.
 */
export default async function CreateEventPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	return (
		<main>
			<h1>Create Event</h1>
			<CreateEventForm />
		</main>
	);
}
