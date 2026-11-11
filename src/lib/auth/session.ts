import "server-only";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@/db/schema";
import { auth } from "./auth";
import { hasPermission, type Permission } from "./permissions";

export type SessionUser = { id: string; name?: string | null; email?: string | null; image?: string | null; roles: Role[] };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image, roles: session.user.roles ?? [] };
}

/** Page guard for the donor area. */
export async function requireUser(callbackUrl = "/account"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** Page guard for admin modules: authentication + server-side permission check. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.roles.length === 0) notFound(); // donors must not learn that /admin exists
  if (!hasPermission(user.roles, permission)) redirect("/admin?forbidden=1");
  return user;
}

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.roles.length === 0) notFound();
  return user;
}

/** For server actions / route handlers: throws instead of redirecting. */
export class AuthzError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
  }
}

export async function assertPermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthzError("Unauthorized", 401);
  if (!hasPermission(user.roles, permission)) throw new AuthzError("Forbidden", 403);
  return user;
}
