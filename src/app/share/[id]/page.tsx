import Link from "next/link";
import { notFound } from "next/navigation";

import { DiffViewer } from "~/components/diff/DiffViewer";
import { api, HydrateClient } from "~/trpc/server";

type SharePageProps = {
	params: Promise<{ id: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
	const { id } = await params;
	const sharedDiff = await api.share.getPublicDiff({ id }).catch(() => null);

	if (!sharedDiff) {
		notFound();
	}

	return (
		<HydrateClient>
			<main
				className="min-h-screen bg-[var(--color-bg)] px-4 py-6 text-[var(--color-text)] lg:px-8"
				id="main-content"
			>
				<div className="mx-auto flex max-w-7xl flex-col gap-4">
					<header className="flex items-center justify-between border-[var(--color-border)] border-b pb-4">
						<div>
							<Link
								className="font-semibold text-[var(--color-primary)] text-sm"
								href="/"
							>
								difflab
							</Link>
							<h1 className="mt-2 font-semibold text-2xl">
								{sharedDiff.document.name}
							</h1>
							<p className="mt-1 text-[var(--color-text-muted)] text-sm">
								Public read-only diff
							</p>
						</div>
					</header>

					<DiffViewer
						baseText={sharedDiff.baseContent}
						headText={sharedDiff.headContent}
						title={sharedDiff.document.name}
					/>
				</div>
			</main>
		</HydrateClient>
	);
}
