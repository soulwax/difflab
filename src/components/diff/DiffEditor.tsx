"use client";

import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import {
	drawSelection,
	dropCursor,
	EditorView,
	highlightActiveLine,
	highlightActiveLineGutter,
	lineNumbers,
} from "@codemirror/view";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import {
	computeDiffStats,
	type DiffStats,
	shouldUseDiffWorker,
} from "~/lib/diff";
import { DiffViewer } from "./DiffViewer";

type DiffEditorProps = {
	baseText: string;
	documentName: string;
	headText: string;
	isSaving?: boolean;
	onBaseTextChange: (value: string) => void;
	onHeadTextChange: (value: string) => void;
	onNameChange: (value: string) => void;
	onSave: () => void;
};

type CodeMirrorPanelProps = {
	label: string;
	onChange: (value: string) => void;
	value: string;
};

function CodeMirrorPanel({ label, onChange, value }: CodeMirrorPanelProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const initialValueRef = useRef(value);
	const onChangeRef = useRef(onChange);
	const viewRef = useRef<EditorView | null>(null);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const updateListener = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onChangeRef.current(update.state.doc.toString());
			}
		});
		const view = new EditorView({
			parent: containerRef.current,
			state: EditorState.create({
				doc: initialValueRef.current,
				extensions: [
					lineNumbers(),
					highlightActiveLineGutter(),
					drawSelection(),
					dropCursor(),
					highlightActiveLine(),
					markdown(),
					javascript(),
					EditorView.lineWrapping,
					updateListener,
					EditorView.theme({
						"&": {
							height: "100%",
						},
					}),
				],
			}),
		});

		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, []);

	useEffect(() => {
		const view = viewRef.current;

		if (!view || view.state.doc.toString() === value) {
			return;
		}

		view.dispatch({
			changes: {
				from: 0,
				insert: value,
				to: view.state.doc.length,
			},
		});
	}, [value]);

	return (
		<section
			aria-label={`${label} editor`}
			className="flex min-h-0 flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
		>
			<div className="flex h-10 items-center justify-between border-[var(--color-border)] border-b bg-[var(--color-surface-2)] px-3">
				<h2 className="font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-[0.08em]">
					{label}
				</h2>
			</div>
			<div className="min-h-[280px] flex-1" ref={containerRef} />
		</section>
	);
}

export function DiffEditor({
	baseText,
	documentName,
	headText,
	isSaving = false,
	onBaseTextChange,
	onHeadTextChange,
	onNameChange,
	onSave,
}: DiffEditorProps) {
	const [stats, setStats] = useState<DiffStats>(() =>
		computeDiffStats(baseText, headText),
	);

	useEffect(() => {
		if (!shouldUseDiffWorker(baseText, headText)) {
			setStats(computeDiffStats(baseText, headText));
			return;
		}

		const worker = new Worker(
			new URL("../../workers/diff.worker.ts", import.meta.url),
			{ type: "module" },
		);

		worker.onmessage = (event: MessageEvent<DiffStats>) => {
			setStats(event.data);
		};
		worker.postMessage({ baseText, headText });

		return () => {
			worker.terminate();
		};
	}, [baseText, headText]);

	const lineSummary = useMemo(
		() =>
			`${stats.additions} additions, ${stats.deletions} deletions, ${stats.changes} unchanged`,
		[stats],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex flex-col gap-3 border-[var(--color-border)] border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="min-w-0">
					<Input
						aria-label="Diff document name"
						className="h-10 w-full min-w-0 border-transparent bg-transparent px-0 font-semibold text-xl focus:border-transparent focus:ring-0 lg:w-[420px]"
						onChange={(event) => onNameChange(event.target.value)}
						value={documentName}
					/>
					<p className="mt-1 text-[var(--color-text-muted)] text-sm">
						{lineSummary}
					</p>
				</div>
				<Button disabled={isSaving} onClick={onSave} variant="primary">
					{isSaving ? "Saving" : "Save diff"}
				</Button>
			</div>

			<div className="grid min-h-[360px] flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
				<CodeMirrorPanel
					label="Base"
					onChange={onBaseTextChange}
					value={baseText}
				/>
				<CodeMirrorPanel
					label="Head"
					onChange={onHeadTextChange}
					value={headText}
				/>
			</div>

			<DiffViewer
				baseText={baseText}
				headText={headText}
				title={documentName}
			/>
		</div>
	);
}
