import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/session";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{user.roles.join(" · ").replaceAll("_", " ")}</p>
        <AdminNav user={user} />
      </aside>
      <div className="min-w-0"><AdminBreadcrumbs />{children}</div>
    </div>
  );
}
