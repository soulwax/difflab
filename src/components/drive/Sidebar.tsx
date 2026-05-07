"use client";

import { FolderTree } from "~/components/drive/FolderTree";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import type { RouterOutputs } from "~/trpc/react";

type FolderTreeOutput = RouterOutputs["folders"]["getTree"];

type SidebarProps = {
	activeFolderId: string | null;
	data?: FolderTreeOutput;
	folderName: string;
	isCreatingFolder?: boolean;
	onCreateDiff: () => void;
	onCreateFolder: () => void;
	onFolderNameChange: (value: string) => void;
	onSelectFolder: (folderId: string | null) => void;
};

export function Sidebar({
	activeFolderId,
	data,
	folderName,
	isCreatingFolder = false,
	onCreateDiff,
	onCreateFolder,
	onFolderNameChange,
	onSelectFolder,
}: SidebarProps) {
	return (
		<aside className="flex h-full w-full flex-col border-[var(--color-border)] border-r bg-[var(--color-surface)]">
			<div className="space-y-2 border-[var(--color-border)] border-b p-3">
				<Button
					className="w-full justify-start"
					onClick={onCreateDiff}
					variant="primary"
				>
					New diff
				</Button>
				<form
					className="flex gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						onCreateFolder();
					}}
				>
					<Input
						aria-label="New folder name"
						className="min-w-0 flex-1"
						onChange={(event) => onFolderNameChange(event.target.value)}
						placeholder="Folder name"
						value={folderName}
					/>
					<Button
						aria-label="Create folder"
						disabled={isCreatingFolder || folderName.trim().length === 0}
						type="submit"
					>
						+
					</Button>
				</form>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				<FolderTree
					activeFolderId={activeFolderId}
					folders={data?.folders ?? []}
					onSelectFolder={onSelectFolder}
				/>
			</div>

			<div className="border-[var(--color-border)] border-t p-3 text-[var(--color-text-muted)] text-xs">
				{data?.documents.length ?? 0} documents
			</div>
		</aside>
	);
}
