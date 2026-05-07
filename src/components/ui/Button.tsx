import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	icon?: ReactNode;
	variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
	danger: "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15",
	ghost:
		"border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
	primary:
		"border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:brightness-110",
	secondary:
		"border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:border-[color:rgba(255,255,255,0.16)]",
};

export function Button({
	children,
	className = "",
	icon,
	variant = "secondary",
	...props
}: ButtonProps) {
	return (
		<button
			className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 font-medium text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
			type="button"
			{...props}
		>
			{icon}
			{children}
		</button>
	);
}
