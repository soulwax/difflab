"use client";

import {
	ArrowDownAZ,
	CalendarClock,
	Grid2X2,
	List,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { MacSymbol } from "~/components/drive/MacSymbol";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import type { RouterOutputs } from "~/trpc/react";

type Document = RouterOutputs["folders"]["getTree"]["documents"][number];
type Folder = RouterOutputs["folders"]["getTree"]["folders"][number];

type FileGridProps = {
	activeFolderId: string | null;
	documents: Document[];
	folders: Folder[];
	onOpenDocument: (document: Document) => void;
	onSelectFolder: (folderId: string | null) => void;
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

function documentKind(document: Document) {
	return document.type === "diff" ? "diff" : document.type;
}

export function FileGrid({
	activeFolderId,
	documents,
	folders,
	onOpenDocument,
	onSelectFolder,
}: FileGridProps) {
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<"name" | "updated">("updated");
	const [view, setView] = useState<"grid" | "list">("grid");
	const visibleFolders = useMemo(
		() =>
			folders
				.filter((folder) =>
					activeFolderId
						? folder.parentId === activeFolderId
						: folder.parentId === null,
				)
				.filter((folder) =>
					folder.name.toLowerCase().includes(query.trim().toLowerCase()),
				)
				.sort((left, right) => left.name.localeCompare(right.name)),
		[activeFolderId, folders, query],
	);
	const visibleDocuments = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		const filtered = documents.filter((document) =>
			document.name.toLowerCase().includes(normalizedQuery),
		);

		return filtered.sort((left, right) => {
			if (sort === "name") {
				return left.name.localeCompare(right.name);
			}

			return (
				new Date(right.updatedAt ?? right.createdAt).getTime() -
				new Date(left.updatedAt ?? left.createdAt).getTime()
			);
		});
	}, [documents, query, sort]);
	const hasItems = visibleFolders.length > 0 || visibleDocuments.length > 0;

	return (
		<section className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-elevation-1)] backdrop-blur-xl">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="font-semibold text-[var(--color-text)] text-lg">
							Bucket filesystem
						</h2>
						<p className="text-[var(--color-text-muted)] text-sm">
							{visibleFolders.length} folders, {visibleDocuments.length} files
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="relative min-w-0 sm:w-72">
							<Search
								aria-hidden="true"
								className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
								size={15}
								strokeWidth={1.8}
							/>
							<Input
								aria-label="Search bucket filesystem"
								className="w-full bg-[var(--color-control-strong)] pl-9"
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search files and folders"
								value={query}
							/>
						</div>
						<div className="flex rounded border border-[var(--color-border)] bg-[var(--color-control)] p-0.5">
							<Button
								aria-label="Sort by recently updated"
								aria-pressed={sort === "updated"}
								className="h-7 border-transparent px-2"
								icon={<CalendarClock aria-hidden="true" size={14} />}
								onClick={() => setSort("updated")}
								variant={sort === "updated" ? "secondary" : "ghost"}
							>
								<span className="sr-only">Recent</span>
							</Button>
							<Button
								aria-label="Sort by name"
								aria-pressed={sort === "name"}
								className="h-7 border-transparent px-2"
								icon={<ArrowDownAZ aria-hidden="true" size={14} />}
								onClick={() => setSort("name")}
								variant={sort === "name" ? "secondary" : "ghost"}
							>
								<span className="sr-only">Name</span>
							</Button>
						</div>
					</div>
				</div>
				<div className="flex w-fit rounded border border-[var(--color-border)] bg-[var(--color-control)] p-0.5">
					<Button
						aria-label="Grid view"
						aria-pressed={view === "grid"}
						className="h-7 border-transparent px-2"
						icon={<Grid2X2 aria-hidden="true" size={14} />}
						onClick={() => setView("grid")}
						variant={view === "grid" ? "secondary" : "ghost"}
					>
						<span className="sr-only">Grid</span>
					</Button>
					<Button
						aria-label="List view"
						aria-pressed={view === "list"}
						className="h-7 border-transparent px-2"
						icon={<List aria-hidden="true" size={14} />}
						onClick={() => setView("list")}
						variant={view === "list" ? "secondary" : "ghost"}
					>
						<span className="sr-only">List</span>
					</Button>
				</div>
			</div>

			{hasItems ? (
				<div
					className={
						view === "grid"
							? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
							: "flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevation-1)]"
					}
				>
					{visibleFolders.map((folder) => (
						<button
							className={
								view === "grid"
									? "group flex min-h-32 flex-col justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-elevation-1)] backdrop-blur-xl transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-elevation-2)]"
									: "group flex items-center justify-between border-[var(--color-border)] border-b bg-transparent px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-surface-hover)]"
							}
							key={folder.id}
							onClick={() => onSelectFolder(folder.id)}
							type="button"
						>
							<div className="flex min-w-0 items-center gap-3">
								<MacSymbol kind="folder" size={view === "grid" ? "lg" : "md"} />
								<div className="min-w-0">
									<h3 className="truncate font-medium text-[var(--color-text)]">
										{folder.name}
									</h3>
									<p className="mt-1 text-[var(--color-text-muted)] text-xs">
										Folder
									</p>
								</div>
							</div>
							<Badge className={view === "grid" ? "mt-4 w-fit" : "ml-4"}>
								folder
							</Badge>
						</button>
					))}
					{visibleDocuments.map((document) => (
						<button
							className={
								view === "grid"
									? "group flex min-h-32 flex-col justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-elevation-1)] backdrop-blur-xl transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-elevation-2)]"
									: "group flex items-center justify-between border-[var(--color-border)] border-b bg-transparent px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-surface-hover)]"
							}
							key={document.id}
							onClick={() => onOpenDocument(document)}
							type="button"
						>
							<div className="flex min-w-0 items-center gap-3">
								<MacSymbol
									kind={documentKind(document)}
									size={view === "grid" ? "lg" : "md"}
								/>
								<div className="min-w-0">
									<h3 className="truncate font-medium text-[var(--color-text)]">
										{document.name}
									</h3>
									<p className="mt-1 text-[var(--color-text-muted)] text-xs">
										Updated {formatDate(document.updatedAt)}
									</p>
								</div>
							</div>
							<Badge className={view === "grid" ? "mt-4 w-fit" : "ml-4"}>
								{document.type}
							</Badge>
						</button>
					))}
				</div>
			) : (
				<div className="grid min-h-[360px] place-items-center rounded-lg border border-[var(--color-border)] border-dashed bg-[var(--color-surface)] shadow-[var(--shadow-elevation-1)] backdrop-blur-xl">
					<div className="max-w-sm text-center">
						<MacSymbol className="mx-auto" kind="bucket" size="lg" />
						<h2 className="mt-4 font-medium text-[var(--color-text)]">
							{query ? "No matching items" : "This bucket path is empty"}
						</h2>
						<p className="mt-2 text-[var(--color-text-muted)] text-sm">
							{query
								? "Try a different search term."
								: "Create a diff or add a folder to start building your drive."}
						</p>
					</div>
				</div>
			)}
		</section>
	);
}
