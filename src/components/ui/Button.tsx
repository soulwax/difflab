import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	icon?: ReactNode;
	variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
	danger: "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15",
	ghost:
		"border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
	primary:
		"border-[var(--color-primary)] bg-[var(--color-primary)] text-[#001b2e] shadow-[var(--shadow-elevation-1)] hover:bg-[var(--color-primary-hover)]",
	secondary:
		"border-[var(--color-border)] bg-[var(--color-control)] text-[var(--color-text)] shadow-[inset_0_1px_rgba(255,255,255,0.06)] hover:bg-[var(--color-control-strong)]",
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
			className={`inline-flex h-8 items-center justify-center gap-2 rounded px-3 font-medium text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
			type="button"
			{...props}
		>
			{icon}
			{children}
		</button>
	);
}
