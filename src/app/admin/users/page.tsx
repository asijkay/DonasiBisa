import { SubmitButton } from "@/components/ui/submit-button";
import { Badge, Card, Input, Label, PageHeading, Select, Table, Td, Th } from "@/components/ui";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { listAdminUsers } from "@/services/admin.service";
import { ROLES } from "@/db/schema";
import { grantRoleAction, revokeRoleAction } from "@/app/admin/actions";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requirePermission("admin:manage");
  const users = await listAdminUsers();
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeading title="Pengguna admin" />
      <Flash {...(await searchParams)} />
      <Card>
        <form action={grantRoleAction} className="flex flex-wrap items-end gap-3">
          <div><Label htmlFor="email">Email pengguna (sudah pernah login)</Label><Input id="email" name="email" type="email" required className="min-w-64" /></div>
          <div><Label htmlFor="role">Role</Label><Select id="role" name="role">{ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}</Select></div>
          <SubmitButton>Berikan role</SubmitButton>
        </form>
      </Card>
      <Table>
        <thead><tr><Th>Pengguna</Th><Th>Role</Th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <Td>{u.name ?? "-"}<br /><span className="text-xs text-slate-500">{u.email}</span></Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  {u.roles.length === 0 && <span className="text-xs text-slate-500">Donatur (tanpa akses admin)</span>}
                  {u.roles.map((r) => (
                    <form key={r} action={revokeRoleAction.bind(null, u.id, r)} className="flex items-center gap-1">
                      <Badge tone="info">{r}</Badge>
                      <button type="submit" className="text-xs text-red-700 hover:underline" aria-label={`Cabut ${r} dari ${u.email}`}>cabut</button>
                    </form>
                  ))}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
