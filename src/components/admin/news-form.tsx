import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { deleteNewsAction, saveNewsAction } from "@/app/admin/actions";

type N = { id: string; title: string; slug: string; excerpt: string; bodyMd: string; coverImageUrl: string | null; campaignId: string | null; status: string };

export function NewsForm({ news, campaigns, canWrite, canPublish }: { news?: N; campaigns: Array<{ id: string; title: string }>; canWrite: boolean; canPublish: boolean }) {
  return (
    <div className="space-y-4">
      <form action={saveNewsAction.bind(null, news?.id ?? null)} className="space-y-4">
        <fieldset disabled={!canWrite} className="space-y-4">
          <div><Label htmlFor="title">Judul</Label><Input id="title" name="title" defaultValue={news?.title} required /></div>
          <div><Label htmlFor="slug">Slug</Label><Input id="slug" name="slug" defaultValue={news?.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></div>
          <div><Label htmlFor="excerpt">Kutipan</Label><Textarea id="excerpt" name="excerpt" rows={2} defaultValue={news?.excerpt} required maxLength={300} /></div>
          <div><Label htmlFor="bodyMd" hint="(Markdown)">Isi</Label><Textarea id="bodyMd" name="bodyMd" rows={10} defaultValue={news?.bodyMd} required /></div>
          <div><Label htmlFor="coverImageUrl" hint="(URL https)">Gambar sampul</Label><Input id="coverImageUrl" name="coverImageUrl" type="url" defaultValue={news?.coverImageUrl ?? ""} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="campaignId">Campaign terkait</Label>
              <Select id="campaignId" name="campaignId" defaultValue={news?.campaignId ?? ""}>
                <option value="">— Berita umum —</option>
                {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={news?.status ?? "DRAFT"}>
                <option value="DRAFT">Draft</option>
                {canPublish && <option value="PUBLISHED">Dipublikasikan</option>}
                <option value="ARCHIVED">Diarsipkan</option>
              </Select>
            </div>
          </div>
        </fieldset>
        {canWrite && <Button type="submit">Simpan</Button>}
      </form>
      {news && canWrite && (
        <form action={deleteNewsAction.bind(null, news.id)}><Button type="submit" variant="danger">Hapus berita</Button></form>
      )}
    </div>
  );
}
