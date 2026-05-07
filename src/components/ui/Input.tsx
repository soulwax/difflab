import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({
	className = "",
	...props
}: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={`h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] text-sm outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(91,140,255,0.2)] ${className}`}
			{...props}
		/>
	);
}

export function Textarea({
	className = "",
	...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			className={`min-h-32 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] text-sm outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(91,140,255,0.2)] ${className}`}
			{...props}
		/>
	);
}
