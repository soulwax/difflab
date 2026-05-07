"use client";

import { useEffect, useMemo, useState } from "react";

import { DiffEditor } from "~/components/diff/DiffEditor";
import { FileGrid } from "~/components/drive/FileGrid";
import { Sidebar } from "~/components/drive/Sidebar";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Skeleton } from "~/components/ui/Skeleton";
import { authClient } from "~/server/better-auth/client";
import { api, type RouterOutputs } from "~/trpc/react";

type SessionUser = {
	email: string;
	image?: string | null;
	name: string;
};

type DifflabAppProps = {
	user: SessionUser | null;
};

type DriveDocument = RouterOutputs["folders"]["getTree"]["documents"][number];

const EMPTY_DIFF = {
	base: "function sum(a, b) {\n  return a + b;\n}\n",
	head: "function sum(a, b) {\n  const total = a + b;\n  return total;\n}\n",
};

export function DifflabApp({ user }: DifflabAppProps) {
	const utils = api.useUtils();
	const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
	const [baseText, setBaseText] = useState(EMPTY_DIFF.base);
	const [documentName, setDocumentName] = useState("Untitled diff");
	const [folderName, setFolderName] = useState("");
	const [headText, setHeadText] = useState(EMPTY_DIFF.head);
	const [mode, setMode] = useState<"diff" | "drive">("diff");
	const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
		null,
	);
	const [shareUrl, setShareUrl] = useState<string | null>(null);
	const [theme, setTheme] = useState<"dark" | "light">("dark");

	const treeQuery = api.folders.getTree.useQuery(undefined, {
		enabled: Boolean(user),
	});
	const selectedDocumentQuery = api.documents.getById.useQuery(
		{ id: selectedDocumentId ?? "00000000-0000-0000-0000-000000000000" },
		{ enabled: Boolean(user && selectedDocumentId) },
	);
	const createFolderMutation = api.folders.create.useMutation({
		onSuccess: async () => {
			setFolderName("");
			await utils.folders.getTree.invalidate();
		},
	});
	const createDocumentMutation = api.documents.create.useMutation({
		onSuccess: async (document) => {
			await utils.folders.getTree.invalidate();
			setSelectedDocumentId(document?.id ?? null);
			setShareUrl(null);
		},
	});
	const makePublicMutation = api.share.makePublic.useMutation({
		onSuccess: async (result) => {
			setShareUrl(result.url);
			await navigator.clipboard?.writeText(result.url);
			await utils.folders.getTree.invalidate();
		},
	});

	const documentsInFolder = useMemo(
		() =>
			(treeQuery.data?.documents ?? []).filter((document) =>
				activeFolderId
					? document.folderId === activeFolderId
					: document.folderId === null,
			),
		[activeFolderId, treeQuery.data?.documents],
	);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [theme]);

	useEffect(() => {
		const document = selectedDocumentQuery.data;

		if (!document) {
			return;
		}

		setDocumentName(document.name);
		setBaseText(document.baseContent ?? document.content ?? "");
		setHeadText(document.headContent ?? "");
		setMode("diff");
		setShareUrl(
			document.isPublic
				? `${window.location.origin}/share/${document.id}`
				: null,
		);
	}, [selectedDocumentQuery.data]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
				event.preventDefault();
				saveDiff();
			}

			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				newDiff();
			}
		};

		window.addEventListener("keydown", onKeyDown);

		return () => window.removeEventListener("keydown", onKeyDown);
	});

	function newDiff() {
		setBaseText("");
		setDocumentName("Untitled diff");
		setHeadText("");
		setMode("diff");
		setSelectedDocumentId(null);
		setShareUrl(null);
	}

	function openDocument(document: DriveDocument) {
		setSelectedDocumentId(document.id);
	}

	function saveDiff() {
		if (!user || createDocumentMutation.isPending) {
			return;
		}

		createDocumentMutation.mutate({
			baseContent: baseText,
			folderId: activeFolderId,
			headContent: headText,
			name: documentName.trim() || "Untitled diff",
			type: "diff",
		});
	}

	function createFolder() {
		if (!user || folderName.trim().length === 0) {
			return;
		}

		createFolderMutation.mutate({
			name: folderName.trim(),
			parentId: activeFolderId,
		});
	}

	async function signInWithGithub() {
		await authClient.signIn.social({
			callbackURL: "/",
			provider: "github",
		});
	}

	async function signOut() {
		await authClient.signOut();
		window.location.href = "/";
	}

	const activeFolder = treeQuery.data?.folders.find(
		(folder) => folder.id === activeFolderId,
	);

	return (
		<main
			className="grid h-screen min-h-[720px] grid-cols-1 bg-[var(--color-bg)] text-[var(--color-text)] lg:grid-cols-[280px_1fr]"
			id="main-content"
		>
			<div className="hidden min-h-0 lg:block">
				<Sidebar
					activeFolderId={activeFolderId}
					data={treeQuery.data}
					folderName={folderName}
					isCreatingFolder={createFolderMutation.isPending}
					onCreateDiff={newDiff}
					onCreateFolder={createFolder}
					onFolderNameChange={setFolderName}
					onSelectFolder={(folderId) => {
						setActiveFolderId(folderId);
						setMode("drive");
					}}
				/>
			</div>

			<section className="flex min-w-0 flex-col">
				<header className="flex h-14 shrink-0 items-center justify-between border-[var(--color-border)] border-b bg-[var(--color-surface)] px-4">
					<div className="flex min-w-0 items-center gap-3">
						<button
							className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] font-semibold text-[var(--color-primary)]"
							onClick={newDiff}
							type="button"
						>
							d
						</button>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<h1 className="truncate font-semibold text-sm">difflab</h1>
								<Badge>{activeFolder?.name ?? "My Drive"}</Badge>
							</div>
							<p className="truncate text-[var(--color-text-muted)] text-xs">
								{mode === "diff" ? "Diff workspace" : "Drive"}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							aria-pressed={mode === "drive"}
							onClick={() => setMode(mode === "drive" ? "diff" : "drive")}
							variant="ghost"
						>
							{mode === "drive" ? "Editor" : "Drive"}
						</Button>
						<Button
							aria-label="Toggle theme"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							variant="ghost"
						>
							{theme === "dark" ? "Light" : "Dark"}
						</Button>
						{user ? (
							<>
								{selectedDocumentId && (
									<Button
										disabled={makePublicMutation.isPending}
										onClick={() =>
											makePublicMutation.mutate({
												documentId: selectedDocumentId,
											})
										}
										variant="secondary"
									>
										Share
									</Button>
								)}
								<Button onClick={signOut} variant="ghost">
									Sign out
								</Button>
							</>
						) : (
							<Button onClick={signInWithGithub} variant="primary">
								Sign in with GitHub
							</Button>
						)}
					</div>
				</header>

				{shareUrl && (
					<div className="border-[var(--color-border)] border-b bg-[var(--color-surface-2)] px-4 py-2 text-[var(--color-text-muted)] text-sm">
						Public link copied:{" "}
						<a className="text-[var(--color-primary)]" href={shareUrl}>
							{shareUrl}
						</a>
					</div>
				)}

				<div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
					{!user ? (
						<div className="grid min-h-full place-items-center">
							<div className="w-full max-w-sm rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
								<h2 className="font-semibold text-[var(--color-text)]">
									Sign in to open your Drive
								</h2>
								<p className="mt-2 text-[var(--color-text-muted)] text-sm">
									GitHub OAuth keeps your saved diffs and folders synced.
								</p>
								<Button
									className="mt-5 w-full"
									onClick={signInWithGithub}
									variant="primary"
								>
									Continue with GitHub
								</Button>
							</div>
						</div>
					) : treeQuery.isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-10 w-64" />
							<Skeleton className="h-80 w-full" />
						</div>
					) : mode === "drive" ? (
						<FileGrid
							documents={documentsInFolder}
							onOpenDocument={openDocument}
						/>
					) : (
						<DiffEditor
							baseText={baseText}
							documentName={documentName}
							headText={headText}
							isSaving={createDocumentMutation.isPending}
							onBaseTextChange={setBaseText}
							onHeadTextChange={setHeadText}
							onNameChange={setDocumentName}
							onSave={saveDiff}
						/>
					)}
				</div>
			</section>
		</main>
	);
}
