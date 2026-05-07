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
		"border-sky-300/35 bg-sky-400/15 text-sky-200 shadow-[inset_0_1px_rgba(255,255,255,0.22)]",
	diff: "border-violet-300/35 bg-violet-400/15 text-violet-200 shadow-[inset_0_1px_rgba(255,255,255,0.22)]",
	folder:
		"border-blue-300/35 bg-blue-400/15 text-blue-200 shadow-[inset_0_1px_rgba(255,255,255,0.22)]",
	snippet:
		"border-emerald-300/35 bg-emerald-400/15 text-emerald-200 shadow-[inset_0_1px_rgba(255,255,255,0.22)]",
	text: "border-zinc-300/30 bg-zinc-400/10 text-zinc-200 shadow-[inset_0_1px_rgba(255,255,255,0.18)]",
};

const sizeClassBySize = {
	lg: "h-12 w-12 rounded-xl",
	md: "h-9 w-9 rounded-lg",
	sm: "h-7 w-7 rounded-md",
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
			className={`relative inline-flex shrink-0 items-center justify-center border ${sizeClassBySize[size]} ${colorByKind[kind]} ${className}`}
		>
			<span className="absolute inset-x-1 top-1 h-px rounded-full bg-white/25" />
			<Icon size={iconSizeBySize[size]} strokeWidth={1.8} />
		</span>
	);
}
