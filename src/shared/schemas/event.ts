import { z } from "zod";

export const eventSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(120, "Title is too long")
		.refine((s) => !/[\r\n\t]/.test(s), {
			message: "Title must be a single line",
		}),
});
