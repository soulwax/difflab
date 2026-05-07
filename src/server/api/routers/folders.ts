import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { documents, folders } from "~/server/db/schema";

export const folderIdSchema = z.string().uuid();

export const createFolderSchema = z.object({
	name: z.string().trim().min(1).max(255),
	parentId: folderIdSchema.nullish(),
});

export const renameFolderSchema = z.object({
	id: folderIdSchema,
	name: z.string().trim().min(1).max(255),
});

export const moveFolderSchema = z.object({
	id: folderIdSchema,
	newParentId: folderIdSchema.nullish(),
});

export const deleteFolderSchema = z.object({
	id: folderIdSchema,
});

export const foldersRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createFolderSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				const [created] = await tx
					.insert(folders)
					.values({
						name: input.name,
						parentId: input.parentId ?? null,
						userId: ctx.session.user.id,
					})
					.returning();

				return created;
			}),
		),

	delete: protectedProcedure
		.input(deleteFolderSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				const allFolders = await tx.query.folders.findMany({
					where: (table, { and: andBy, eq: eqBy, isNull: isNullBy }) =>
						andBy(
							eqBy(table.userId, ctx.session.user.id),
							isNullBy(table.deletedAt),
						),
				});

				if (!allFolders.some((folder) => folder.id === input.id)) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				const idsToDelete = new Set<string>([input.id]);
				let changed = true;

				while (changed) {
					changed = false;

					for (const folder of allFolders) {
						if (folder.parentId && idsToDelete.has(folder.parentId)) {
							const sizeBefore = idsToDelete.size;
							idsToDelete.add(folder.id);
							changed = sizeBefore !== idsToDelete.size;
						}
					}
				}

				const ids = [...idsToDelete];

				await tx
					.update(documents)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(documents.userId, ctx.session.user.id),
							inArray(documents.folderId, ids),
						),
					);

				const deletedFolders = await tx
					.update(folders)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(folders.userId, ctx.session.user.id),
							inArray(folders.id, ids),
						),
					)
					.returning();

				return deletedFolders;
			}),
		),

	getTree: protectedProcedure.query(async ({ ctx }) => {
		const [folderRows, documentRows] = await Promise.all([
			ctx.db.query.folders.findMany({
				orderBy: (table, { asc }) => [asc(table.name)],
				where: (table, { and: andBy, eq: eqBy, isNull: isNullBy }) =>
					andBy(
						eqBy(table.userId, ctx.session.user.id),
						isNullBy(table.deletedAt),
					),
			}),
			ctx.db.query.documents.findMany({
				orderBy: (table, { desc }) => [desc(table.updatedAt)],
				where: (table, { and: andBy, eq: eqBy, isNull: isNullBy }) =>
					andBy(
						eqBy(table.userId, ctx.session.user.id),
						isNullBy(table.deletedAt),
					),
			}),
		]);

		return {
			documents: documentRows,
			folders: folderRows,
		};
	}),

	move: protectedProcedure
		.input(moveFolderSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				if (input.id === input.newParentId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A folder cannot be moved into itself.",
					});
				}

				const [updated] = await tx
					.update(folders)
					.set({ parentId: input.newParentId ?? null, updatedAt: new Date() })
					.where(
						and(
							eq(folders.id, input.id),
							eq(folders.userId, ctx.session.user.id),
							isNull(folders.deletedAt),
						),
					)
					.returning();

				if (!updated) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				return updated;
			}),
		),

	rename: protectedProcedure
		.input(renameFolderSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.db.transaction(async (tx) => {
				const [updated] = await tx
					.update(folders)
					.set({ name: input.name, updatedAt: new Date() })
					.where(
						and(
							eq(folders.id, input.id),
							eq(folders.userId, ctx.session.user.id),
							isNull(folders.deletedAt),
						),
					)
					.returning();

				if (!updated) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				return updated;
			}),
		),
});
