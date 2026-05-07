import type { HTMLAttributes } from "react";

export function Badge({
	className = "",
	...props
}: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={`inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-medium text-[var(--color-text-muted)] text-xs ${className}`}
			{...props}
		/>
	);
}
