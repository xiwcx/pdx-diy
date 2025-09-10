"use client";

import { useForm } from "@tanstack/react-form";
import { api } from "~/trpc/react";
import { eventSchema } from "~/shared/schemas/event";

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
