"use client";

import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

type DiffViewerProps = {
	baseText: string;
	headText: string;
	title?: string;
};

export function DiffViewer({ baseText, headText, title }: DiffViewerProps) {
	return (
		<section
			aria-label={title ?? "Text diff output"}
			className="diff-viewer overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
		>
			<ReactDiffViewer
				compareMethod={DiffMethod.WORDS}
				disableWorker={false}
				leftTitle="Base"
				newValue={headText}
				oldValue={baseText}
				rightTitle="Head"
				showDiffOnly={false}
				splitView
				styles={{
					codeFoldGutter: { background: "var(--color-surface-2)" },
					codeFold: { background: "var(--color-surface-2)" },
					contentText: { color: "var(--color-text)" },
					diffContainer: { background: "var(--color-surface)" },
					diffAdded: { background: "var(--color-diff-add)" },
					diffRemoved: { background: "var(--color-diff-remove)" },
					emptyGutter: { background: "var(--color-surface)" },
					gutter: {
						background: "var(--color-surface-2)",
						color: "var(--color-text-muted)",
					},
					line: { color: "var(--color-text)" },
					marker: { color: "var(--color-text-muted)" },
					titleBlock: {
						background: "var(--color-surface-2)",
						borderBottom: "1px solid var(--color-border)",
						color: "var(--color-text-muted)",
					},
					variables: {
						dark: {
							addedBackground: "var(--color-diff-add)",
							addedColor: "var(--color-diff-add-text)",
							addedGutterBackground: "var(--color-diff-add)",
							addedGutterColor: "var(--color-diff-add-text)",
							diffViewerBackground: "var(--color-surface)",
							diffViewerColor: "var(--color-text)",
							gutterBackground: "var(--color-surface-2)",
							gutterColor: "var(--color-text-muted)",
							removedBackground: "var(--color-diff-remove)",
							removedColor: "var(--color-diff-remove-text)",
							removedGutterBackground: "var(--color-diff-remove)",
							removedGutterColor: "var(--color-diff-remove-text)",
							wordAddedBackground:
								"color-mix(in srgb, var(--color-diff-add-text) 30%, transparent)",
							wordRemovedBackground:
								"color-mix(in srgb, var(--color-diff-remove-text) 30%, transparent)",
						},
					},
					wordAdded: {
						background:
							"color-mix(in srgb, var(--color-diff-add-text) 30%, transparent)",
					},
					wordRemoved: {
						background:
							"color-mix(in srgb, var(--color-diff-remove-text) 30%, transparent)",
					},
				}}
				summary={title}
				useDarkTheme
			/>
		</section>
	);
}
