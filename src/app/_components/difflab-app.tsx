"use client";

import {
	Cloud,
	GitCompareArrows,
	Grid2X2,
	LogIn,
	LogOut,
	Moon,
	Share2,
	Sun,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DiffEditor } from "~/components/diff/DiffEditor";
import { FileGrid } from "~/components/drive/FileGrid";
import { MacSymbol } from "~/components/drive/MacSymbol";
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
		const response = await authClient.signIn.social({
			callbackURL: "/",
			provider: "github",
		});

		if (response.data?.url) {
			window.location.href = response.data.url;
		}
	}

	async function signOut() {
		await authClient.signOut();
		window.location.href = "/";
	}

	const activeFolder = treeQuery.data?.folders.find(
		(folder) => folder.id === activeFolderId,
	);
	const activeBreadcrumb = activeFolder?.name ?? "My Drive";

	return (
		<main
			className="grid h-screen min-h-[720px] grid-cols-1 bg-transparent text-[var(--color-text)] lg:grid-cols-[280px_1fr]"
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
				<header className="flex h-14 shrink-0 items-center justify-between border-[var(--color-border)] border-b bg-[var(--color-surface)] px-4 shadow-[var(--shadow-elevation-1)] backdrop-blur-2xl">
					<div className="flex min-w-0 items-center gap-3">
						<button
							aria-label="Start a new diff"
							className="flex h-8 w-8 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-control)] text-[var(--color-primary)] shadow-[var(--shadow-elevation-1)] transition hover:bg-[var(--color-control-strong)]"
							onClick={newDiff}
							type="button"
						>
							<GitCompareArrows
								aria-hidden="true"
								size={18}
								strokeWidth={1.9}
							/>
						</button>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<h1 className="truncate font-semibold text-sm">Diff Lab</h1>
								<Badge>{activeBreadcrumb}</Badge>
							</div>
							<div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[var(--color-text-muted)] text-xs">
								<Cloud aria-hidden="true" size={12} />
								<span className="truncate">difflab-storage</span>
								<span aria-hidden="true">/</span>
								<span className="truncate">
									{mode === "diff" ? "Diff workspace" : activeBreadcrumb}
								</span>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							aria-label={mode === "drive" ? "Open editor" : "Open drive"}
							aria-pressed={mode === "drive"}
							icon={
								mode === "drive" ? (
									<GitCompareArrows aria-hidden="true" size={15} />
								) : (
									<Grid2X2 aria-hidden="true" size={15} />
								)
							}
							onClick={() => setMode(mode === "drive" ? "diff" : "drive")}
							variant="ghost"
						>
							<span className="hidden sm:inline">
								{mode === "drive" ? "Editor" : "Drive"}
							</span>
						</Button>
						<Button
							aria-label="Toggle theme"
							icon={
								theme === "dark" ? (
									<Sun aria-hidden="true" size={15} />
								) : (
									<Moon aria-hidden="true" size={15} />
								)
							}
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							variant="ghost"
						>
							<span className="sr-only">
								{theme === "dark" ? "Light" : "Dark"}
							</span>
						</Button>
						{user ? (
							<>
								{selectedDocumentId && (
									<Button
										disabled={makePublicMutation.isPending}
										icon={<Share2 aria-hidden="true" size={15} />}
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
								<Button
									aria-label="Sign out"
									icon={<LogOut aria-hidden="true" size={15} />}
									onClick={signOut}
									variant="ghost"
								>
									<span className="hidden sm:inline">Sign out</span>
								</Button>
							</>
						) : (
							<Button
								icon={<LogIn aria-hidden="true" size={15} />}
								onClick={signInWithGithub}
								variant="primary"
							>
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
							<div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-elevation-2)] backdrop-blur-xl">
								<MacSymbol className="mx-auto" kind="bucket" size="lg" />
								<h2 className="font-semibold text-[var(--color-text)]">
									Sign in to open your Drive
								</h2>
								<p className="mt-2 text-[var(--color-text-muted)] text-sm">
									GitHub OAuth keeps your saved diffs and folders synced.
								</p>
								<Button
									className="mt-5 w-full"
									icon={<LogIn aria-hidden="true" size={15} />}
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
							activeFolderId={activeFolderId}
							documents={documentsInFolder}
							folders={treeQuery.data?.folders ?? []}
							onOpenDocument={openDocument}
							onSelectFolder={(folderId) => {
								setActiveFolderId(folderId);
								setMode("drive");
							}}
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
