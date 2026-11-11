import type { Role } from "@/db/schema";

export type Permission =
  | "campaign:read" | "campaign:write" | "campaign:publish"
  | "news:read" | "news:write" | "news:publish"
  | "payment:read" | "payment:configure"
  | "transaction:read" | "transaction:annotate"
  | "donor:read"
  | "notification:read" | "notification:configure"
  | "brand:configure"
  | "admin:manage";

const ALL: Permission[] = [
  "campaign:read", "campaign:write", "campaign:publish",
  "news:read", "news:write", "news:publish",
  "payment:read", "payment:configure",
  "transaction:read", "transaction:annotate",
  "donor:read",
  "notification:read", "notification:configure",
  "brand:configure",
  "admin:manage",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: ALL,
  CAMPAIGN_ADMIN: ["campaign:read", "campaign:write", "campaign:publish", "news:read", "transaction:read"],
  FINANCE_ADMIN: ["payment:read", "transaction:read", "transaction:annotate", "donor:read", "notification:read", "campaign:read"],
  CONTENT_ADMIN: ["news:read", "news:write", "news:publish", "campaign:read"],
};

export function permissionsFor(roles: readonly Role[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r] ?? []) set.add(p);
  return set;
}

export function hasPermission(roles: readonly Role[], permission: Permission): boolean {
  return permissionsFor(roles).has(permission);
}
