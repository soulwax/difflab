import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { readTextContent } from "~/lib/storage";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { documents } from "~/server/db/schema";

export const shareDocumentSchema = z.object({
	documentId: z.string().uuid(),
});

export const getPublicDiffSchema = z.object({
	id: z.string().uuid(),
});

export const shareRouter = createTRPCRouter({
	getPublicDiff: publicProcedure
		.input(getPublicDiffSchema)
		.query(async ({ ctx, input }) => {
			const document = await ctx.db.query.documents.findFirst({
				where: (table, { and: andBy, eq: eqBy, isNull: isNullBy }) =>
					andBy(
						eqBy(table.id, input.id),
						eqBy(table.isPublic, true),
						isNullBy(table.deletedAt),
					),
			});

			if (!document || document.type !== "diff") {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const snapshots = await ctx.db.query.documents.findMany({
				where: (table, { inArray }) =>
					inArray(
						table.id,
						[document.baseSnapshotId, document.headSnapshotId].filter(
							(id): id is string => id !== null,
						),
					),
			});
			const baseSnapshot = snapshots.find(
				(snapshot) => snapshot.id === document.baseSnapshotId,
			);
			const headSnapshot = snapshots.find(
				(snapshot) => snapshot.id === document.headSnapshotId,
			);

			return {
				document,
				baseContent: baseSnapshot ? await readTextContent(baseSnapshot) : "",
				headContent: headSnapshot ? await readTextContent(headSnapshot) : "",
			};
		}),

	makePrivate: protectedProcedure
		.input(shareDocumentSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				const [updated] = await tx
					.update(documents)
					.set({ isPublic: false, updatedAt: new Date() })
					.where(
						and(
							eq(documents.id, input.documentId),
							eq(documents.userId, ctx.session.user.id),
							isNull(documents.deletedAt),
						),
					)
					.returning();

				if (!updated) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				return updated;
			}),
		),

	makePublic: protectedProcedure
		.input(shareDocumentSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				const [updated] = await tx
					.update(documents)
					.set({ isPublic: true, updatedAt: new Date() })
					.where(
						and(
							eq(documents.id, input.documentId),
							eq(documents.userId, ctx.session.user.id),
							isNull(documents.deletedAt),
						),
					)
					.returning();

				if (!updated) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				return {
					document: updated,
					url: `${env.NEXT_PUBLIC_APP_URL}/share/${updated.id}`,
				};
			}),
		),
});
