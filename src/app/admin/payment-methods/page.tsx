import { Alert, Badge, Button, Card, Input, PageHeading } from "@/components/ui";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listPaymentConfig } from "@/services/admin.service";
import { getEnv } from "@/lib/env";
import { simulatorEnabled } from "@/lib/payments/simulator";
import { toggleProviderAction, updateMethodAction } from "@/app/admin/actions";

export default async function PaymentMethodsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requirePermission("payment:read");
  const canConfigure = hasPermission(user.roles, "payment:configure");
  const providers = await listPaymentConfig();
  const sandboxEnv = getEnv().APP_ENV;
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeading title="Metode pembayaran" />
      <Flash {...(await searchParams)} />
      {simulatorEnabled() && <Alert tone="warning" title="Simulator gateway aktif (DEV)">Provider memakai simulator lokal, bukan Midtrans/Xendit sungguhan. Kredensial rahasia tidak pernah ditampilkan atau disimpan di database.</Alert>}
      {providers.map((p) => (
        <Card key={p.id} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{p.provider === "MIDTRANS" ? "Midtrans" : "Xendit"}</h2>
              <Badge tone={p.isEnabled ? "success" : "neutral"}>{p.isEnabled ? "Aktif" : "Nonaktif"}</Badge>
              <Badge tone={p.credentialsConfigured ? "info" : "warning"}>{p.credentialsConfigured ? "Kredensial terpasang" : "Kredensial belum diatur"}</Badge>
              <Badge>{p.environment === "SANDBOX" ? "Sandbox" : "Production"} · {sandboxEnv}</Badge>
            </div>
            {canConfigure && (
              <form action={toggleProviderAction.bind(null, p.provider, !p.isEnabled)}>
                <Button type="submit" variant={p.isEnabled ? "secondary" : "primary"}>{p.isEnabled ? "Nonaktifkan" : "Aktifkan"}</Button>
              </form>
            )}
          </div>
          <div className="space-y-2">
            {p.methods.map((m) => (
              <form key={m.id} action={updateMethodAction.bind(null, m.id)} className="grid items-end gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_80px_auto_auto]">
                <div><span className="text-xs text-slate-500">Kode channel</span><p className="font-mono text-sm">{m.channelCode}</p></div>
                <label className="text-xs text-slate-500">Nama tampilan<Input name="displayName" defaultValue={m.displayName} disabled={!canConfigure} /></label>
                <label className="text-xs text-slate-500">Urutan<Input name="sortOrder" type="number" defaultValue={m.sortOrder} disabled={!canConfigure} /></label>
                <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="isEnabled" defaultChecked={m.isEnabled} disabled={!canConfigure} className="h-4 w-4" /> Aktif</label>
                {canConfigure && <Button type="submit" variant="secondary">Simpan</Button>}
                <input type="hidden" name="description" value={m.description ?? ""} />
              </form>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
