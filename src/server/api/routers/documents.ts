import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { readTextContent, storeTextContent } from "~/lib/storage";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { documents, documentVersions } from "~/server/db/schema";

export const documentTypeSchema = z.enum(["text", "diff", "snippet"]);

export const getDocumentsSchema = z.object({
	folderId: z.string().uuid().nullish(),
});

export const getDocumentByIdSchema = z.object({
	id: z.string().uuid(),
});

export const createDocumentSchema = z
	.object({
		baseContent: z.string().optional(),
		content: z.string().optional(),
		folderId: z.string().uuid().nullish(),
		headContent: z.string().optional(),
		name: z.string().trim().min(1).max(255),
		type: documentTypeSchema.default("text"),
	})
	.superRefine((value, ctx) => {
		if (value.type === "diff") {
			if (value.baseContent === undefined || value.headContent === undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Diff documents need baseContent and headContent.",
					path: ["baseContent"],
				});
			}

			return;
		}

		if (value.content === undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Text documents need content.",
				path: ["content"],
			});
		}
	});

export const updateDocumentSchema = z.object({
	baseContent: z.string().optional(),
	content: z.string().optional(),
	headContent: z.string().optional(),
	id: z.string().uuid(),
	isPublic: z.boolean().optional(),
	name: z.string().trim().min(1).max(255).optional(),
});

export const deleteDocumentSchema = z.object({
	id: z.string().uuid(),
});

export const getDocumentVersionsSchema = z.object({
	documentId: z.string().uuid(),
});

async function hydrateDocumentContent<
	TDocument extends {
		baseSnapshotId: string | null;
		contentInline: string | null;
		headSnapshotId: string | null;
		id: string;
		storageKey: string | null;
		type: "text" | "diff" | "snippet";
	},
>(document: TDocument) {
	return {
		...document,
		content: await readTextContent({
			contentInline: document.contentInline,
			storageKey: document.storageKey,
		}),
	};
}

export const documentsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createDocumentSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				if (input.type === "diff") {
					const baseDocumentId = crypto.randomUUID();
					const headDocumentId = crypto.randomUUID();
					const diffDocumentId = crypto.randomUUID();
					const baseStoredContent = await storeTextContent({
						content: input.baseContent ?? "",
						documentId: baseDocumentId,
						userId: ctx.session.user.id,
					});
					const headStoredContent = await storeTextContent({
						content: input.headContent ?? "",
						documentId: headDocumentId,
						userId: ctx.session.user.id,
					});

					await tx.insert(documents).values([
						{
							...baseStoredContent,
							folderId: input.folderId ?? null,
							id: baseDocumentId,
							name: `${input.name} base`,
							type: "text",
							userId: ctx.session.user.id,
						},
						{
							...headStoredContent,
							folderId: input.folderId ?? null,
							id: headDocumentId,
							name: `${input.name} head`,
							type: "text",
							userId: ctx.session.user.id,
						},
					]);

					const [created] = await tx
						.insert(documents)
						.values({
							baseSnapshotId: baseDocumentId,
							folderId: input.folderId ?? null,
							headSnapshotId: headDocumentId,
							id: diffDocumentId,
							name: input.name,
							type: "diff",
							userId: ctx.session.user.id,
						})
						.returning();

					return created;
				}

				const documentId = crypto.randomUUID();
				const storedContent = await storeTextContent({
					content: input.content ?? "",
					documentId,
					userId: ctx.session.user.id,
				});
				const [created] = await tx
					.insert(documents)
					.values({
						...storedContent,
						folderId: input.folderId ?? null,
						id: documentId,
						name: input.name,
						type: input.type,
						userId: ctx.session.user.id,
					})
					.returning();

				return created;
			}),
		),

	delete: protectedProcedure
		.input(deleteDocumentSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				const [deleted] = await tx
					.update(documents)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(documents.id, input.id),
							eq(documents.userId, ctx.session.user.id),
						),
					)
					.returning();

				if (!deleted) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				return deleted;
			}),
		),

	getAll: protectedProcedure
		.input(getDocumentsSchema)
		.query(async ({ ctx, input }) =>
			ctx.db.query.documents.findMany({
				orderBy: (table, { desc: descBy }) => [descBy(table.updatedAt)],
				where: (table, { and: andBy, eq: eqBy, isNull: isNullBy }) =>
					andBy(
						eqBy(table.userId, ctx.session.user.id),
						input.folderId
							? eqBy(table.folderId, input.folderId)
							: isNullBy(table.folderId),
						isNullBy(table.deletedAt),
					),
			}),
		),

	getById: protectedProcedure
		.input(getDocumentByIdSchema)
		.query(async ({ ctx, input }) => {
			const document = await ctx.db.query.documents.findFirst({
				where: (table, { and: andBy, eq: eqBy, isNull: isNullBy }) =>
					andBy(
						eqBy(table.id, input.id),
						eqBy(table.userId, ctx.session.user.id),
						isNullBy(table.deletedAt),
					),
			});

			if (!document) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const hydrated = await hydrateDocumentContent(document);

			if (document.type !== "diff") {
				return {
					...hydrated,
					baseContent: null,
					headContent: null,
				};
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
				...hydrated,
				baseContent: baseSnapshot ? await readTextContent(baseSnapshot) : "",
				headContent: headSnapshot ? await readTextContent(headSnapshot) : "",
			};
		}),

	getVersions: protectedProcedure
		.input(getDocumentVersionsSchema)
		.query(async ({ ctx, input }) => {
			const document = await ctx.db.query.documents.findFirst({
				where: (table, { and: andBy, eq: eqBy }) =>
					andBy(
						eqBy(table.id, input.documentId),
						eqBy(table.userId, ctx.session.user.id),
					),
			});

			if (!document) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return ctx.db.query.documentVersions.findMany({
				orderBy: [desc(documentVersions.createdAt)],
				where: eq(documentVersions.documentId, input.documentId),
			});
		}),

	update: protectedProcedure
		.input(updateDocumentSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				const existing = await tx.query.documents.findFirst({
					where: (table, { and: andBy, eq: eqBy, isNull: isNullBy }) =>
						andBy(
							eqBy(table.id, input.id),
							eqBy(table.userId, ctx.session.user.id),
							isNullBy(table.deletedAt),
						),
				});

				if (!existing) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				if (input.content !== undefined) {
					await tx.insert(documentVersions).values({
						contentInline: existing.contentInline,
						documentId: existing.id,
						storageKey: existing.storageKey,
					});
				}

				const storedContent =
					input.content !== undefined
						? await storeTextContent({
								content: input.content,
								documentId: existing.id,
								userId: ctx.session.user.id,
							})
						: {};

				const [updated] = await tx
					.update(documents)
					.set({
						...storedContent,
						isPublic: input.isPublic,
						name: input.name,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(documents.id, input.id),
							eq(documents.userId, ctx.session.user.id),
							isNull(documents.deletedAt),
						),
					)
					.returning();

				return updated;
			}),
		),
});
