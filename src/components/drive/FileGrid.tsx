"use client";

import { useState } from "react";

import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import type { RouterOutputs } from "~/trpc/react";

type Document = RouterOutputs["folders"]["getTree"]["documents"][number];

type FileGridProps = {
	documents: Document[];
	onOpenDocument: (document: Document) => void;
};

function formatDate(date: Date | string | null) {
	if (!date) {
		return "No date";
	}

	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(date));
}

export function FileGrid({ documents, onOpenDocument }: FileGridProps) {
	const [view, setView] = useState<"grid" | "list">("grid");

	if (documents.length === 0) {
		return (
			<div className="grid min-h-[320px] place-items-center rounded-md border border-[var(--color-border)] border-dashed">
				<div className="max-w-sm text-center">
					<h2 className="font-medium text-[var(--color-text)]">
						No documents here
					</h2>
					<p className="mt-2 text-[var(--color-text-muted)] text-sm">
						Create a diff or add a folder to start building your drive.
					</p>
				</div>
			</div>
		);
	}

	return (
		<section className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-[var(--color-text)] text-lg">
					Files
				</h2>
				<div className="flex rounded-md border border-[var(--color-border)] p-1">
					<Button
						aria-pressed={view === "grid"}
						className="h-7 border-transparent px-2"
						onClick={() => setView("grid")}
						variant={view === "grid" ? "secondary" : "ghost"}
					>
						Grid
					</Button>
					<Button
						aria-pressed={view === "list"}
						className="h-7 border-transparent px-2"
						onClick={() => setView("list")}
						variant={view === "list" ? "secondary" : "ghost"}
					>
						List
					</Button>
				</div>
			</div>

			<div
				className={
					view === "grid"
						? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
						: "flex flex-col overflow-hidden rounded-md border border-[var(--color-border)]"
				}
			>
				{documents.map((document) => (
					<button
						className={
							view === "grid"
								? "group flex min-h-32 flex-col justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:border-[color:rgba(91,140,255,0.5)]"
								: "group flex items-center justify-between border-[var(--color-border)] border-b bg-[var(--color-surface)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-surface-2)]"
						}
						key={document.id}
						onClick={() => onOpenDocument(document)}
						type="button"
					>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span aria-hidden="true">
									{document.type === "diff" ? "↔" : "¶"}
								</span>
								<h3 className="truncate font-medium text-[var(--color-text)]">
									{document.name}
								</h3>
							</div>
							<p className="mt-2 text-[var(--color-text-muted)] text-xs">
								Updated {formatDate(document.updatedAt)}
							</p>
						</div>
						<Badge className={view === "grid" ? "mt-4 w-fit" : "ml-4"}>
							{document.type}
						</Badge>
					</button>
				))}
			</div>
		</section>
	);
}
