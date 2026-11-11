import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import type { CampaignRow } from "@/services/campaigns.service";
import { saveCampaignAction } from "@/app/admin/actions";

/** datetime-local value in Asia/Jakarta. */
function toLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const s = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta", dateStyle: "short", timeStyle: "short" }).format(d);
  return s.replace(" ", "T");
}

export function CampaignForm({ campaign, options, canWrite }: { campaign?: CampaignRow; options?: Array<{ amount: number; label: string | null }>; canWrite: boolean }) {
  const action = saveCampaignAction.bind(null, campaign?.id ?? null);
  return (
    <form action={action} className="space-y-4">
      <fieldset disabled={!canWrite} className="space-y-4">
        <div><Label htmlFor="title">Judul</Label><Input id="title" name="title" defaultValue={campaign?.title} required /></div>
        <div><Label htmlFor="slug" hint="(huruf kecil, angka, tanda hubung)">Slug</Label><Input id="slug" name="slug" defaultValue={campaign?.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></div>
        <div><Label htmlFor="summary">Ringkasan</Label><Textarea id="summary" name="summary" rows={2} defaultValue={campaign?.summary} required maxLength={300} /></div>
        <div><Label htmlFor="descriptionMd" hint="(Markdown)">Deskripsi</Label><Textarea id="descriptionMd" name="descriptionMd" rows={8} defaultValue={campaign?.descriptionMd} required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="targetAmount">Target (Rp)</Label><Input id="targetAmount" name="targetAmount" inputMode="numeric" defaultValue={campaign?.targetAmount} required /></div>
          <div>
            <Label htmlFor="amountMode">Mode nominal</Label>
            <Select id="amountMode" name="amountMode" defaultValue={campaign?.amountMode ?? "OPEN_AMOUNT"}>
              <option value="OPEN_AMOUNT">Nominal bebas</option>
              <option value="CLOSED_AMOUNT">Paket nominal (preset)</option>
            </Select>
          </div>
          <div><Label htmlFor="startsAt" hint="(WIB)">Mulai</Label><Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={toLocal(campaign?.startsAt)} /></div>
          <div><Label htmlFor="endsAt" hint="(WIB)">Berakhir</Label><Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={toLocal(campaign?.endsAt)} /></div>
        </div>
        <div><Label htmlFor="coverImageUrl" hint="(URL https)">Gambar sampul</Label><Input id="coverImageUrl" name="coverImageUrl" type="url" defaultValue={campaign?.coverImageUrl ?? ""} /></div>
        <div>
          <Label htmlFor="amountOptions" hint="(satu per baris: nominal|label — untuk mode paket nominal)">Pilihan nominal</Label>
          <Textarea id="amountOptions" name="amountOptions" rows={4} defaultValue={(options ?? []).map((o) => `${o.amount}${o.label ? `|${o.label}` : ""}`).join("\n")} placeholder={"25000|Paket Hemat\n50000|Paket Berbagi"} />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="autoCloseOnTarget" defaultChecked={campaign?.autoCloseOnTarget ?? true} className="h-4 w-4" /> Tutup otomatis saat target tercapai</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={campaign?.isFeatured ?? false} className="h-4 w-4" /> Campaign unggulan</label>
        </div>
      </fieldset>
      {canWrite && <Button type="submit">Simpan</Button>}
    </form>
  );
}
