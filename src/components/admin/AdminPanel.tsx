"use client";

import { Crown, ShieldCheck, UserCog, Users } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { roleLabels, type UserRole, userRoleValues } from "~/lib/rbac";
import { api, type RouterOutputs } from "~/trpc/react";

type AdminUser = RouterOutputs["admin"]["listUsers"][number];

type AdminPanelProps = {
	currentUserId: string;
	role: UserRole;
};

function formatDate(date: Date | string) {
	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(date));
}

function canEditTarget({
	currentUserId,
	role,
	target,
}: {
	currentUserId: string;
	role: UserRole;
	target: AdminUser;
}) {
	if (role === "superadmin") {
		return target.id !== currentUserId;
	}

	return target.role === "user" || target.role === "team";
}

function selectableRoles(
	role: UserRole,
	target: AdminUser,
	currentUserId: string,
) {
	if (target.id === currentUserId && target.role === "superadmin") {
		return ["superadmin"] satisfies UserRole[];
	}

	if (role === "superadmin") {
		return userRoleValues;
	}

	if (target.role === "user" || target.role === "team") {
		return ["user", "team"] satisfies UserRole[];
	}

	return [target.role];
}

export function AdminPanel({ currentUserId, role }: AdminPanelProps) {
	const utils = api.useUtils();
	const usersQuery = api.admin.listUsers.useQuery();
	const updateRoleMutation = api.admin.updateUserRole.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.admin.getAccess.invalidate(),
				utils.admin.listUsers.invalidate(),
			]);
		},
	});

	return (
		<section className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-elevation-1)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-center gap-3">
					<span className="flex h-9 w-9 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-control)] text-[var(--color-primary)]">
						{role === "superadmin" ? (
							<Crown aria-hidden="true" size={18} />
						) : (
							<ShieldCheck aria-hidden="true" size={18} />
						)}
					</span>
					<div>
						<h2 className="font-semibold text-[var(--color-text)] text-lg">
							Access control
						</h2>
						<p className="text-[var(--color-text-muted)] text-sm">
							Signed in as {roleLabels[role]}
						</p>
					</div>
				</div>
				<Badge className="w-fit">
					<Users aria-hidden="true" className="mr-1.5" size={13} />
					{usersQuery.data?.length ?? 0} users
				</Badge>
			</div>

			<div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevation-1)] backdrop-blur-xl">
				<div className="grid grid-cols-[1fr_130px_160px] gap-3 border-[var(--color-border)] border-b bg-[var(--color-control)] px-4 py-2 font-medium text-[var(--color-text-muted)] text-xs">
					<span>User</span>
					<span>Role</span>
					<span>Joined</span>
				</div>

				{usersQuery.isLoading ? (
					<div className="px-4 py-6 text-[var(--color-text-muted)] text-sm">
						Loading users...
					</div>
				) : (
					<div className="divide-y divide-[var(--color-border)]">
						{(usersQuery.data ?? []).map((target) => {
							const editable = canEditTarget({
								currentUserId,
								role,
								target,
							});

							return (
								<div
									className="grid grid-cols-[1fr_130px_160px] items-center gap-3 px-4 py-3"
									key={target.id}
								>
									<div className="flex min-w-0 items-center gap-3">
										<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-control)] text-[var(--color-text-muted)]">
											<UserCog aria-hidden="true" size={15} />
										</span>
										<div className="min-w-0">
											<div className="truncate font-medium text-[var(--color-text)] text-sm">
												{target.name}
												{target.id === currentUserId ? " (you)" : ""}
											</div>
											<div className="truncate text-[var(--color-text-muted)] text-xs">
												{target.email}
											</div>
										</div>
									</div>

									<select
										aria-label={`Role for ${target.name}`}
										className="h-8 rounded border border-[var(--color-border)] bg-[var(--color-control)] px-2 text-[var(--color-text)] text-sm outline-none transition focus:border-[var(--color-primary)] focus:bg-[var(--color-control-strong)]"
										disabled={!editable || updateRoleMutation.isPending}
										onChange={(event) =>
											updateRoleMutation.mutate({
												role: event.target.value as UserRole,
												userId: target.id,
											})
										}
										value={target.role}
									>
										{selectableRoles(role, target, currentUserId).map(
											(option) => (
												<option key={option} value={option}>
													{roleLabels[option]}
												</option>
											),
										)}
									</select>

									<div className="truncate text-[var(--color-text-muted)] text-xs">
										{formatDate(target.createdAt)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</section>
	);
}
