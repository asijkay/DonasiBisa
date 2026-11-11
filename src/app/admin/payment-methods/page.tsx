import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, Badge, Card, PageHeading } from "@/components/ui";
import { SortableMethods } from "@/components/admin/sortable-methods";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listPaymentConfig } from "@/services/admin.service";
import { getEnv } from "@/lib/env";
import { simulatorEnabled } from "@/lib/payments/simulator";
import { toggleProviderAction } from "@/app/admin/actions";

export default async function PaymentMethodsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requirePermission("payment:read");
  const canConfigure = hasPermission(user.roles, "payment:configure");
  const providers = await listPaymentConfig();
  const sandboxEnv = getEnv().APP_ENV;
  return (
    <div className="max-w-5xl space-y-6">
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
                <SubmitButton variant={p.isEnabled ? "secondary" : "primary"}>{p.isEnabled ? "Nonaktifkan" : "Aktifkan"}</SubmitButton>
              </form>
            )}
          </div>
          <SortableMethods
            provider={p.provider}
            canConfigure={canConfigure}
            methods={p.methods.map((m) => ({ id: m.id, channelCode: m.channelCode, displayName: m.displayName, description: m.description, isEnabled: m.isEnabled }))}
          />
        </Card>
      ))}
    </div>
  );
}
