export const userRoleValues = ["user", "team", "admin", "superadmin"] as const;

export type UserRole = (typeof userRoleValues)[number];

export const roleLabels: Record<UserRole, string> = {
	admin: "Admin",
	superadmin: "Superadmin",
	team: "Team",
	user: "User",
};

const roleRank: Record<UserRole, number> = {
	admin: 2,
	superadmin: 3,
	team: 1,
	user: 0,
};

export function canManageUsers(role: UserRole) {
	return role === "admin" || role === "superadmin";
}

export function isAtLeastRole(role: UserRole, minimumRole: UserRole) {
	return roleRank[role] >= roleRank[minimumRole];
}
