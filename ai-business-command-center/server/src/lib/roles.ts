export type AppRole = "user" | "admin" | "owner";

const UNLIMITED_ROLES = new Set<AppRole>(["admin", "owner"]);

export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "admin" || role === "owner") {
    return role;
  }

  return "user";
}

export function isUnlimitedRole(
  role: string | null | undefined,
): boolean {
  return UNLIMITED_ROLES.has(normalizeRole(role));
}
