import { z } from "zod";
import {
	createDocumentStorageKey,
	getPresignedDownloadUrl,
	getPresignedUploadUrl,
} from "~/lib/storage";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const getPresignedUploadUrlSchema = z.object({
	contentType: z.string().min(1),
	fileName: z.string().min(1),
});

export const getPresignedDownloadUrlSchema = z.object({
	storageKey: z.string().min(1),
});

export const storageRouter = createTRPCRouter({
	getPresignedDownloadUrl: protectedProcedure
		.input(getPresignedDownloadUrlSchema)
		.query(async ({ input }) => ({
			url: await getPresignedDownloadUrl(input.storageKey),
		})),

	getPresignedUploadUrl: protectedProcedure
		.input(getPresignedUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const storageKey = createDocumentStorageKey({
				documentId: crypto.randomUUID(),
				userId: ctx.session.user.id,
			});

			return {
				storageKey,
				url: await getPresignedUploadUrl({
					contentType: input.contentType,
					storageKey,
				}),
			};
		}),
});
