import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { CreateEventForm } from "./_components/create-event-form";

export default async function CreateEventPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin?callbackUrl=%2Fevents%2Fcreate");
	}

	return (
		<main>
			<h1>Create Event</h1>
			<CreateEventForm />
		</main>
	);
}
