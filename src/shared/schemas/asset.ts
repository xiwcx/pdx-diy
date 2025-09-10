import { z } from "zod";

export const assetSchema = z.object({
	fileName: z.string().min(1),
	mimeType: z.string().min(1),
	fileSize: z.number().positive(),
	width: z.number().positive().optional(),
	height: z.number().positive().optional(),
	description: z.string().max(1000).optional(),
});

export const assetConfirmUploadSchema = assetSchema.extend({
	objectKey: z.string().min(1),
});
