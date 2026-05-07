import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import { DifflabApp } from "./_components/difflab-app";

export default async function Home() {
	const session = await getSession();

	return (
		<HydrateClient>
			<DifflabApp user={session?.user ?? null} />
		</HydrateClient>
	);
}
