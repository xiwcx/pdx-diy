"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { api } from "~/trpc/react";
import { eventSchema } from "~/shared/schemas/event";
import { ImageUploadForm } from "~/app/_components/image-upload-form";

export function CreateEventForm() {
	const createEvent = api.event.create.useMutation();
	const [heroImageId, setHeroImageId] = useState<string | null>(null);
	const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			title: "",
			heroImageId: "",
		},
		onSubmit: async ({ value }) => {
			// Validate using the shared schema
			const validation = eventSchema.safeParse({
				...value,
				heroImageId: heroImageId || undefined,
			});
			if (!validation.success) {
				alert("Please enter a valid title");
				return;
			}

			try {
				await createEvent.mutateAsync(validation.data);
				// Reset form on success
				form.reset();
				setHeroImageId(null);
				setHeroImageUrl(null);
				alert("Event created successfully!");
			} catch (error) {
				console.error("Failed to create event:", error);
				alert("Failed to create event. Please try again.");
			}
		},
	});

	const handleImageUploadSuccess = (assetId: string, publicUrl: string) => {
		setHeroImageId(assetId);
		setHeroImageUrl(publicUrl);
	};

	const handleImageUploadError = (error: string) => {
		console.error("Image upload failed:", error);
		alert(`Image upload failed: ${error}`);
	};

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

			<div style={{ marginTop: "20px" }}>
				<label htmlFor="hero-image">Hero Image (optional)</label>
				{heroImageUrl ? (
					<div style={{ marginTop: "10px" }}>
						<img
							src={heroImageUrl}
							alt="Hero preview"
							style={{
								maxWidth: "300px",
								maxHeight: "200px",
								objectFit: "cover",
								borderRadius: "4px",
								border: "1px solid #ccc",
							}}
						/>
						<div style={{ marginTop: "8px" }}>
							<button
								type="button"
								onClick={() => {
									setHeroImageId(null);
									setHeroImageUrl(null);
								}}
								style={{
									padding: "4px 8px",
									backgroundColor: "#dc3545",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: "pointer",
								}}
							>
								Remove Image
							</button>
						</div>
					</div>
				) : (
					<div style={{ marginTop: "10px" }}>
						<ImageUploadForm
							asChild
							onSuccess={handleImageUploadSuccess}
							onError={handleImageUploadError}
						/>
					</div>
				)}
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
