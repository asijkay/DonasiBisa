import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { Alert, Badge, ButtonLink, Card, ProgressBar, StatusBadge } from "@/components/ui";
import { Markdown } from "@/components/public/markdown";
import { CoverImage } from "@/components/public/cover-image";
import { getBrand } from "@/services/brand.service";
import { getPublicCampaign, type CampaignDetailDTO } from "@/services/campaigns.service";
import { daysLeft, formatDate, formatIDR, progressPercent } from "@/lib/utils/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const c = await getPublicCampaign(slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.summary,
    alternates: { canonical: `/campaigns/${slug}` },
    openGraph: { title: c.title, description: c.summary, type: "article", images: c.coverImageUrl ? [{ url: c.coverImageUrl, alt: c.coverImageAlt ?? c.title }] : undefined },
    twitter: { card: c.coverImageUrl ? "summary_large_image" : "summary" },
  };
}

/** Copy for a campaign that cannot take donations, chosen by its real status (never a "sementara/permanen" template). */
function closedCopy(status: CampaignDetailDTO["status"]): { title: string; body: string } {
  switch (status) {
    case "PAUSED":
      return { title: "Donasi dijeda sementara", body: "Campaign ini belum menerima donasi baru. Pembayaran yang sudah dibuat sebelumnya tetap diproses." };
    case "COMPLETED":
      return { title: "Campaign selesai", body: "Terima kasih para donatur. Campaign ini tidak menerima donasi baru; pembayaran yang sudah dibuat sebelumnya tetap diproses." };
    case "CLOSED":
      return { title: "Donasi ditutup", body: "Campaign ini tidak menerima donasi baru. Pembayaran yang sudah dibuat sebelumnya tetap diproses." };
    default:
      return { title: "Donasi belum tersedia", body: "Campaign ini sedang tidak menerima donasi baru." };
  }
}

export default async function CampaignPage({ params }: Props) {
  const { slug } = await params;
  const [c, brand] = await Promise.all([getPublicCampaign(slug), getBrand()]);
  if (!c) notFound();
  const pct = progressPercent(c.raisedAmount, c.targetAmount);
  const left = c.isOpen ? daysLeft(c.endsAt) : null;
  const closed = closedCopy(c.status);

  const summary = (
    <div className="space-y-4">
      <div>
        <p className="text-2xl font-bold">{formatIDR(c.raisedAmount)}</p>
        <p className="text-sm text-slate-600">terkumpul dari target {formatIDR(c.targetAmount)}</p>
      </div>
      <ProgressBar percent={pct} label="Progres donasi" />
      <p className="text-sm text-slate-600">
        <span data-testid="donor-count" className="font-semibold text-slate-900">{c.donorCount.toLocaleString("id-ID")}</span> donatur · {pct}% tercapai
        {left !== null ? ` · sisa ${left} hari` : c.endsAt ? ` · berakhir ${formatDate(c.endsAt)}` : ""}
      </p>
      {c.isDemo && <p className="text-xs text-slate-500">Angka pada campaign demo adalah data contoh, bukan donasi nyata.</p>}
    </div>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Campaign", href: "/campaigns" }, { label: c.title }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <article>
          <figure>
            <CoverImage src={c.coverImageUrl} alt={c.coverImageAlt ?? `Foto sampul campaign: ${c.title}`} sizes="(min-width: 1024px) 720px, 100vw" priority className="h-56 w-full rounded-2xl sm:h-80" />
            {c.isDemo && c.coverImageUrl && <figcaption className="mt-2 text-xs text-slate-500">Foto ilustrasi · sumber di halaman <Link className="underline" href="/kredit-foto">Kredit foto</Link></figcaption>}
          </figure>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {c.isOpen ? <Badge tone="success">{left !== null ? `Aktif · sisa ${left} hari` : "Aktif"}</Badge> : <StatusBadge status={c.status} />}
            {c.isDemo && <Badge tone="warning">DEMO — bukan penggalangan dana nyata</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{c.title}</h1>
          <p className="mt-2 text-slate-600">{c.summary}</p>

          {/* Below lg the donation summary sits right under the title instead of after the whole story. */}
          <div className="mt-6 lg:hidden">
            <Card className="space-y-4">
              {summary}
              {!c.isOpen && (
                <>
                  <Alert tone="warning" title={closed.title}>{closed.body}</Alert>
                  <ButtonLink href="/campaigns" variant="secondary" className="w-full">Lihat campaign lainnya</ButtonLink>
                </>
              )}
            </Card>
          </div>

          <div className="mt-6"><Markdown>{c.descriptionMd}</Markdown></div>

          <section aria-labelledby="h-updates" className="mt-10">
            <h2 id="h-updates" className="mb-4 text-xl font-bold">Update campaign</h2>
            {c.updates.length === 0 ? (
              <p className="text-sm text-slate-600">Belum ada update.</p>
            ) : (
              <ul className="space-y-4">
                {c.updates.map((u) => (
                  <li key={u.slug} className="rounded-2xl border border-slate-200 bg-card p-4">
                    <p className="text-xs text-slate-500">{formatDate(u.publishedAt)}</p>
                    <Link href={`/news/${u.slug}`} className="font-semibold hover:underline">{u.title}</Link>
                    <p className="text-sm text-slate-600">{u.excerpt}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <Card className="space-y-4">
            {summary}
            {c.isOpen ? (
              <>
                <ButtonLink href={`/donate/${c.slug}`} className="w-full">{brand.ctaLabel}</ButtonLink>
                <p className="text-xs text-slate-500">Anda tidak perlu login untuk berdonasi.</p>
              </>
            ) : (
              <>
                <Alert tone="warning" title={closed.title}>{closed.body}</Alert>
                <ButtonLink href="/campaigns" variant="secondary" className="w-full">Lihat campaign lainnya</ButtonLink>
              </>
            )}
          </Card>
        </aside>
      </div>

      {c.isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-card/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <p className="min-w-0 text-sm"><span className="block truncate font-bold text-slate-900">{formatIDR(c.raisedAmount)}</span><span className="text-xs text-slate-600">{pct}% dari target</span></p>
            <ButtonLink href={`/donate/${c.slug}`} className="shrink-0">{brand.ctaLabel}</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
