import { Button, Card, Input, Label, PageHeading, Textarea } from "@/components/ui";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { getBrand } from "@/services/brand.service";
import { saveBrandAction } from "@/app/admin/actions";

export default async function BrandPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requirePermission("brand:configure");
  const b = await getBrand();
  const colors: Array<[string, string, string]> = [["primaryColor", "Warna utama", b.primaryColor], ["secondaryColor", "Warna sekunder", b.secondaryColor], ["accentColor", "Warna aksen", b.accentColor], ["backgroundColor", "Warna latar", b.backgroundColor]];
  return (
    <div className="max-w-3xl">
      <PageHeading title="Konfigurasi brand" />
      <Flash {...(await searchParams)} />
      <Card>
        <form action={saveBrandAction} className="space-y-4">
          <div><Label htmlFor="brandName">Nama brand/organisasi</Label><Input id="brandName" name="brandName" defaultValue={b.brandName} required /></div>
          <div><Label htmlFor="tagline">Tagline</Label><Input id="tagline" name="tagline" defaultValue={b.tagline ?? ""} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="logoUrl" hint="(URL https)">Logo</Label><Input id="logoUrl" name="logoUrl" type="url" defaultValue={b.logoUrl ?? ""} /></div>
            <div><Label htmlFor="faviconUrl" hint="(URL https)">Favicon</Label><Input id="faviconUrl" name="faviconUrl" type="url" defaultValue={b.faviconUrl ?? ""} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {colors.map(([name, label, value]) => (<div key={name}><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type="color" defaultValue={value} className="h-11 p-1" /></div>))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="contactEmail">Email kontak</Label><Input id="contactEmail" name="contactEmail" type="email" defaultValue={b.contactEmail ?? ""} /></div>
            <div><Label htmlFor="contactWhatsapp">WhatsApp kontak</Label><Input id="contactWhatsapp" name="contactWhatsapp" defaultValue={b.contactWhatsapp ?? ""} /></div>
          </div>
          <div><Label htmlFor="address">Alamat / keterangan organisasi</Label><Textarea id="address" name="address" rows={2} defaultValue={b.address ?? ""} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="website">Website</Label><Input id="website" name="website" type="url" defaultValue={b.website ?? ""} /></div>
            <div><Label htmlFor="ctaLabel">Label CTA donasi</Label><Input id="ctaLabel" name="ctaLabel" defaultValue={b.ctaLabel} required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["instagram", "facebook", "x", "youtube", "tiktok"].map((k) => (<div key={k}><Label htmlFor={`social_${k}`}>{k}</Label><Input id={`social_${k}`} name={`social_${k}`} defaultValue={b.socialLinks[k] ?? ""} /></div>))}
          </div>
          <div><Label htmlFor="footerText">Teks footer</Label><Input id="footerText" name="footerText" defaultValue={b.footerText ?? ""} /></div>
          <Button type="submit">Simpan</Button>
        </form>
      </Card>
    </div>
  );
}
