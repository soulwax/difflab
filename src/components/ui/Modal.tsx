"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
	children: ReactNode;
	onClose: () => void;
	open: boolean;
	title: string;
};

export function Modal({ children, onClose, open, title }: ModalProps) {
	if (!open) {
		return null;
	}

	return (
		<div
			aria-modal="true"
			className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4"
			role="dialog"
		>
			<div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
				<div className="flex items-center justify-between border-[var(--color-border)] border-b px-4 py-3">
					<h2 className="font-medium text-[var(--color-text)] text-sm">
						{title}
					</h2>
					<Button aria-label="Close dialog" onClick={onClose} variant="ghost">
						×
					</Button>
				</div>
				<div className="p-4">{children}</div>
			</div>
		</div>
	);
}
