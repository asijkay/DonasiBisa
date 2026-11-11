import { Button, Card, Input, Label, PageHeading, Textarea, Badge } from "@/components/ui";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listTemplates } from "@/services/admin.service";
import { EVENT_LABELS, type EventKey } from "@/lib/notifications/templates";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/validation/schemas";
import { saveTemplateAction } from "@/app/admin/actions";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requirePermission("notification:read");
  const canEdit = hasPermission(user.roles, "notification:configure");
  const templates = await listTemplates();
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeading title="Template notifikasi" />
      <Flash {...(await searchParams)} />
      <p className="text-sm text-slate-600">Placeholder yang didukung: {TEMPLATE_PLACEHOLDERS.map((p) => (<code key={p} className="mr-1 rounded bg-slate-100 px-1">{`{{${p}}}`}</code>))}. Nilai di-escape otomatis pada HTML.</p>
      {templates.map((t) => (
        <Card key={t.id}>
          <form action={saveTemplateAction.bind(null, t.id)} className="space-y-3">
            <div className="flex items-center gap-2"><h2 className="font-bold">{EVENT_LABELS[t.templateKey as EventKey] ?? t.templateKey}</h2><Badge tone="info">{t.channel === "EMAIL" ? "Email" : "WhatsApp"}</Badge></div>
            {t.channel === "EMAIL" && <div><Label htmlFor={`s-${t.id}`}>Subjek</Label><Input id={`s-${t.id}`} name="subject" defaultValue={t.subject ?? ""} disabled={!canEdit} /></div>}
            <div><Label htmlFor={`b-${t.id}`}>Isi (teks)</Label><Textarea id={`b-${t.id}`} name="bodyText" rows={5} defaultValue={t.bodyText} disabled={!canEdit} /></div>
            {t.channel === "EMAIL" && <div><Label htmlFor={`h-${t.id}`}>Isi (HTML, opsional)</Label><Textarea id={`h-${t.id}`} name="bodyHtml" rows={4} defaultValue={t.bodyHtml ?? ""} disabled={!canEdit} /></div>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={t.isActive} disabled={!canEdit} className="h-4 w-4" /> Aktif</label>
            {canEdit && <Button type="submit">Simpan</Button>}
          </form>
        </Card>
      ))}
    </div>
  );
}
