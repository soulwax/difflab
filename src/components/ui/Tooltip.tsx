import type { ReactNode } from "react";

type TooltipProps = {
	children: ReactNode;
	label: string;
};

export function Tooltip({ children, label }: TooltipProps) {
	return (
		<span className="group relative inline-flex">
			{children}
			<span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-[var(--color-text)] text-xs opacity-0 shadow-lg transition group-hover:opacity-100">
				{label}
			</span>
		</span>
	);
}
