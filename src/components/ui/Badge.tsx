import type { HTMLAttributes } from "react";

export function Badge({
	className = "",
	...props
}: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={`inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-control)] px-2 py-0.5 font-medium text-[var(--color-text-muted)] text-xs shadow-[inset_0_1px_rgba(255,255,255,0.04)] ${className}`}
			{...props}
		/>
	);
}
