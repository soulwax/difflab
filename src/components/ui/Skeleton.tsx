import type { HTMLAttributes } from "react";

export function Skeleton({
	className = "",
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`animate-pulse rounded bg-[color:rgba(255,255,255,0.08)] ${className}`}
			{...props}
		/>
	);
}
