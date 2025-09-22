"use client";

import { useForm } from "@tanstack/react-form";
import { eventSchema } from "~/shared/schemas/event";
import { api } from "~/trpc/react";

/**
 * A client-side React form component for creating a new event with a single "title" field.
 *
 * Renders a controlled input for the event title, validates the value (both in-field and on submit
 * using the shared `eventSchema`), and calls the `api.event.create` TRPC mutation when a valid
 * title is submitted. On success the form is reset and a success alert is shown; on failure an
 * error alert is shown and the error is logged to console.
 *
 * Accessibility:
 * - The title input is associated with a `<label htmlFor="title">` and uses `id="title"`.
 * - The input is marked `required`; validation errors are presented inline (text in the DOM).
 *
 * Side effects:
 * - Performs a network mutation via TRPC (`api.event.create.useMutation()`).
 * - Uses browser `alert()` for success/failure messages and logs errors to the console.
 *
 * Usage example:
 * ```tsx
 * import { CreateEventForm } from "./create-event-form";
 *
 * export default function Page() {
 *   return <CreateEventForm />;
 * }
 * ```
 *
 * @returns A JSX element containing the event creation form.
 */
export function CreateEventForm() {
	const createEvent = api.event.create.useMutation();

	const form = useForm({
		defaultValues: {
			title: "",
		},
		onSubmit: async ({ value }) => {
			// Validate using the shared schema
			const validation = eventSchema.safeParse(value);
			if (!validation.success) {
				alert("Please enter a valid title");
				return;
			}

			try {
				await createEvent.mutateAsync(validation.data);
				// Reset form on success
				form.reset();
				alert("Event created successfully!");
			} catch (error) {
				console.error("Failed to create event:", error);
				alert("Failed to create event. Please try again.");
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div>
				<label htmlFor="title">Event Title</label>
				<form.Field
					name="title"
					validators={{
						onChange: ({ value }) =>
							!value || value.length === 0 ? "Title is required" : undefined,
					}}
				>
					{(field) => (
						<>
							<input
								id="title"
								name="title"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								required
							/>
							{field.state.meta.errors && (
								<div style={{ color: "red" }}>
									{field.state.meta.errors.join(", ")}
								</div>
							)}
						</>
					)}
				</form.Field>
			</div>

			<button
				type="submit"
				disabled={form.state.isSubmitting || createEvent.isPending}
			>
				{form.state.isSubmitting || createEvent.isPending
					? "Creating..."
					: "Create Event"}
			</button>
		</form>
	);
}
