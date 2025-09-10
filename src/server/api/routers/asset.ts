import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { env } from "~/env.js";
import { captureEvent } from "~/server/posthog";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { assets } from "~/server/db/schema";
import { assetSchema, assetConfirmUploadSchema } from "~/shared/schemas/asset";

// Initialize S3 client for R2
const r2Client = new S3Client({
	region: "auto",
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

export const assetRouter = createTRPCRouter({
	// Generate presigned URL for direct upload to R2
	generateUploadUrl: protectedProcedure
		.input(assetSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session.user.id;
				const objectKey = `uploads/${userId}/${uuidv7()}-${input.fileName}`;

				const command = new PutObjectCommand({
					Bucket: env.R2_BUCKET_NAME,
					Key: objectKey,
					ContentType: input.mimeType,
					ContentLength: input.fileSize,
				});

				const presignedUrl = await getSignedUrl(r2Client, command, {
					expiresIn: 3600, // 1 hour
				});

				await captureEvent(userId, "asset_upload_url_generated", {
					fileName: input.fileName,
					mimeType: input.mimeType,
					fileSize: input.fileSize,
					objectKey,
				});

				return {
					success: true,
					data: {
						presignedUrl,
						objectKey,
						publicUrl: `${env.R2_PUBLIC_URL}/${objectKey}`,
					},
				};
			} catch (error) {
				await captureEvent(ctx.session.user.id, "asset_upload_url_error", {
					error: error instanceof Error ? error.message : "Unknown error",
					fileName: input.fileName,
				});

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate upload URL",
					cause: error,
				});
			}
		}),

	// Confirm upload and save to database
	confirmUpload: protectedProcedure
		.input(assetConfirmUploadSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session.user.id;

				// Save asset to database
				const [asset] = await ctx.db
					.insert(assets)
					.values({
						objectKey: input.objectKey,
						originalName: input.fileName,
						mimeType: input.mimeType,
						size: input.fileSize,
						width: input.width,
						height: input.height,
						description: input.description,
						bucketName: env.R2_BUCKET_NAME,
						publicUrl: `${env.R2_PUBLIC_URL}/${input.objectKey}`,
						uploadedById: userId,
					})
					.returning();

				if (!asset) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create asset record",
					});
				}

				await captureEvent(userId, "asset_upload_confirmed", {
					assetId: asset.id,
					fileName: input.fileName,
					mimeType: input.mimeType,
					fileSize: input.fileSize,
					objectKey: input.objectKey,
				});

				return {
					success: true,
					data: {
						assetId: asset.id,
						publicUrl: asset.publicUrl,
						objectKey: asset.objectKey,
					},
				};
			} catch (error) {
				await captureEvent(ctx.session.user.id, "asset_upload_confirm_error", {
					error: error instanceof Error ? error.message : "Unknown error",
					objectKey: input.objectKey,
				});

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to confirm upload",
					cause: error,
				});
			}
		}),
});
