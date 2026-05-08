import { TRPCError } from "@trpc/server";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { canManageUsers, type UserRole, userRoleValues } from "~/lib/rbac";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { user } from "~/server/db/schema";
import { ensureFirstSuperadmin } from "~/server/rbac";

export const updateUserRoleSchema = z.object({
	role: z.enum(userRoleValues),
	userId: z.string().min(1),
});

function assertCanAssignRole({
	actorId,
	actorRole,
	targetId,
	targetRole,
	nextRole,
}: {
	actorId: string;
	actorRole: UserRole;
	nextRole: UserRole;
	targetId: string;
	targetRole: UserRole;
}) {
	if (!canManageUsers(actorRole)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}

	if (actorRole === "superadmin") {
		if (targetId === actorId && nextRole !== "superadmin") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Transfer superadmin before changing your own role.",
			});
		}

		return;
	}

	if (nextRole === "admin" || nextRole === "superadmin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the superadmin can grant admin roles.",
		});
	}

	if (targetRole === "admin" || targetRole === "superadmin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Admins cannot modify admins or the superadmin.",
		});
	}
}

export const adminRouter = createTRPCRouter({
	getAccess: protectedProcedure.query(async ({ ctx }) => {
		await ensureFirstSuperadmin(ctx.session.user.id);

		const [actor] = await ctx.db
			.select({ role: user.role })
			.from(user)
			.where(eq(user.id, ctx.session.user.id))
			.limit(1);

		const role = actor?.role ?? "user";

		return {
			canManageUsers: canManageUsers(role),
			role,
		};
	}),

	listUsers: protectedProcedure.query(async ({ ctx }) => {
		await ensureFirstSuperadmin(ctx.session.user.id);

		const [actor] = await ctx.db
			.select({ role: user.role })
			.from(user)
			.where(eq(user.id, ctx.session.user.id))
			.limit(1);

		if (!actor || !canManageUsers(actor.role)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}

		return ctx.db
			.select({
				createdAt: user.createdAt,
				email: user.email,
				emailVerified: user.emailVerified,
				id: user.id,
				image: user.image,
				name: user.name,
				role: user.role,
				updatedAt: user.updatedAt,
			})
			.from(user)
			.orderBy(asc(user.role), asc(user.email));
	}),

	updateUserRole: protectedProcedure
		.input(updateUserRoleSchema)
		.mutation(async ({ ctx, input }) => {
			await ensureFirstSuperadmin(ctx.session.user.id);

			return ctx.db.transaction(async (tx) => {
				await tx.execute(
					sql`select pg_advisory_xact_lock(hashtext('difflab:role-update'))`,
				);

				const [actor] = await tx
					.select({ id: user.id, role: user.role })
					.from(user)
					.where(eq(user.id, ctx.session.user.id))
					.limit(1);

				const [target] = await tx
					.select({
						email: user.email,
						id: user.id,
						name: user.name,
						role: user.role,
					})
					.from(user)
					.where(eq(user.id, input.userId))
					.limit(1);

				if (!actor || !target) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				assertCanAssignRole({
					actorId: actor.id,
					actorRole: actor.role,
					nextRole: input.role,
					targetId: target.id,
					targetRole: target.role,
				});

				if (input.role === "superadmin") {
					await tx
						.update(user)
						.set({ role: "admin", updatedAt: new Date() })
						.where(eq(user.role, "superadmin"));
				}

				const [updated] = await tx
					.update(user)
					.set({ role: input.role, updatedAt: new Date() })
					.where(eq(user.id, input.userId))
					.returning({
						email: user.email,
						id: user.id,
						name: user.name,
						role: user.role,
						updatedAt: user.updatedAt,
					});

				if (!updated) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				return updated;
			});
		}),
});
