"use client";

import {
	Braces,
	Cloud,
	FileCode2,
	FileText,
	Folder,
	GitCompareArrows,
	type LucideIcon,
} from "lucide-react";

type SymbolKind = "bucket" | "diff" | "folder" | "snippet" | "text";

type MacSymbolProps = {
	className?: string;
	kind: SymbolKind;
	size?: "sm" | "md" | "lg";
};

const iconByKind: Record<SymbolKind, LucideIcon> = {
	bucket: Cloud,
	diff: GitCompareArrows,
	folder: Folder,
	snippet: Braces,
	text: FileText,
};

const colorByKind: Record<SymbolKind, string> = {
	bucket:
		"border-cyan-300/30 bg-cyan-400/15 text-cyan-100 shadow-[var(--shadow-elevation-1)]",
	diff: "border-blue-300/30 bg-blue-400/15 text-blue-100 shadow-[var(--shadow-elevation-1)]",
	folder:
		"border-amber-300/30 bg-amber-300/15 text-amber-100 shadow-[var(--shadow-elevation-1)]",
	snippet:
		"border-emerald-300/30 bg-emerald-400/15 text-emerald-100 shadow-[var(--shadow-elevation-1)]",
	text: "border-zinc-300/25 bg-zinc-300/10 text-zinc-100 shadow-[var(--shadow-elevation-1)]",
};

const sizeClassBySize = {
	lg: "h-12 w-12 rounded-lg",
	md: "h-9 w-9 rounded-md",
	sm: "h-7 w-7 rounded",
};

const iconSizeBySize = {
	lg: 24,
	md: 18,
	sm: 15,
};

export function MacSymbol({
	className = "",
	kind,
	size = "md",
}: MacSymbolProps) {
	const Icon = iconByKind[kind] ?? FileCode2;

	return (
		<span
			aria-hidden="true"
			className={`inline-flex shrink-0 items-center justify-center border backdrop-blur-xl ${sizeClassBySize[size]} ${colorByKind[kind]} ${className}`}
		>
			<Icon size={iconSizeBySize[size]} strokeWidth={1.8} />
		</span>
	);
}
