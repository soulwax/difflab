import { eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { user } from "~/server/db/schema";

export async function ensureFirstSuperadmin(userId: string) {
	await db.transaction(async (tx) => {
		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtext('difflab:first-superadmin'))`,
		);

		const [existingSuperadmin] = await tx
			.select({ id: user.id })
			.from(user)
			.where(eq(user.role, "superadmin"))
			.limit(1);

		if (existingSuperadmin) {
			return;
		}

		await tx
			.update(user)
			.set({
				role: "superadmin",
				updatedAt: new Date(),
			})
			.where(eq(user.id, userId));
	});
}
