"use client";

import { ChevronDown, HardDrive } from "lucide-react";

import { MacSymbol } from "~/components/drive/MacSymbol";
import type { RouterOutputs } from "~/trpc/react";

type Folder = RouterOutputs["folders"]["getTree"]["folders"][number];

type FolderTreeProps = {
	activeFolderId: string | null;
	folders: Folder[];
	onSelectFolder: (folderId: string | null) => void;
};

function FolderNode({
	activeFolderId,
	depth,
	folder,
	folders,
	onSelectFolder,
}: FolderTreeProps & { depth: number; folder: Folder }) {
	const children = folders.filter((child) => child.parentId === folder.id);
	const isActive = activeFolderId === folder.id;

	return (
		<li>
			<button
				aria-current={isActive ? "page" : undefined}
				className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition ${
					isActive
						? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
						: "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
				}`}
				onClick={() => onSelectFolder(folder.id)}
				style={{ paddingLeft: `${8 + depth * 14}px` }}
				type="button"
			>
				<span className="flex h-4 w-4 items-center justify-center">
					{children.length > 0 && (
						<ChevronDown aria-hidden="true" size={13} strokeWidth={2} />
					)}
				</span>
				<MacSymbol kind="folder" size="sm" />
				<span className="truncate">{folder.name}</span>
				{children.length > 0 && (
					<span className="ml-auto rounded-full bg-[var(--color-surface)] px-1.5 text-[10px] text-[var(--color-text-muted)]">
						{children.length}
					</span>
				)}
			</button>
			{children.length > 0 && (
				<ul>
					{children.map((child) => (
						<FolderNode
							activeFolderId={activeFolderId}
							depth={depth + 1}
							folder={child}
							folders={folders}
							key={child.id}
							onSelectFolder={onSelectFolder}
						/>
					))}
				</ul>
			)}
		</li>
	);
}

export function FolderTree({
	activeFolderId,
	folders,
	onSelectFolder,
}: FolderTreeProps) {
	const rootFolders = folders.filter((folder) => folder.parentId === null);
	const rootActive = activeFolderId === null;

	return (
		<nav aria-label="Folders">
			<button
				aria-current={rootActive ? "page" : undefined}
				className={`mb-1 flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition ${
					rootActive
						? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
						: "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
				}`}
				onClick={() => onSelectFolder(null)}
				type="button"
			>
				<HardDrive aria-hidden="true" size={15} strokeWidth={1.9} />
				<span className="truncate">My Drive</span>
			</button>
			<ul className="space-y-0.5">
				{rootFolders.map((folder) => (
					<FolderNode
						activeFolderId={activeFolderId}
						depth={0}
						folder={folder}
						folders={folders}
						key={folder.id}
						onSelectFolder={onSelectFolder}
					/>
				))}
			</ul>
		</nav>
	);
}
