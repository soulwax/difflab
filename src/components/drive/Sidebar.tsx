"use client";

import { FolderPlus, GitCompareArrows, Plus, Server } from "lucide-react";

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
			<div className="space-y-3 border-[var(--color-border)] border-b p-3">
				<div className="flex items-center gap-2 px-1 text-[var(--color-text-muted)] text-xs">
					<Server aria-hidden="true" size={14} strokeWidth={1.8} />
					<span className="truncate">difflab-storage</span>
				</div>
				<Button
					className="w-full justify-start"
					icon={<GitCompareArrows aria-hidden="true" size={16} />}
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
						icon={
							folderName.trim().length > 0 ? (
								<FolderPlus aria-hidden="true" size={15} />
							) : (
								<Plus aria-hidden="true" size={15} />
							)
						}
						type="submit"
					>
						<span className="sr-only">Create folder</span>
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
