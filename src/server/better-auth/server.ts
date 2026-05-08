import { headers } from "next/headers";
import { cache } from "react";
import { ensureFirstSuperadmin } from "~/server/rbac";
import { auth } from ".";

export const getSession = cache(async () => {
	const session = await auth.api.getSession({ headers: await headers() });

	if (session?.user.id) {
		await ensureFirstSuperadmin(session.user.id);
	}

	return session;
});
