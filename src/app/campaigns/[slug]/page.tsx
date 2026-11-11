import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { Alert, Badge, ButtonLink, Card, ProgressBar, StatusBadge } from "@/components/ui";
import { Markdown } from "@/components/public/markdown";
import { CoverImage } from "@/components/public/cover-image";
import { getBrand } from "@/services/brand.service";
import { getPublicCampaign } from "@/services/campaigns.service";
import { formatDate, formatIDR, progressPercent } from "@/lib/utils/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getPublicCampaign((await params).slug);
  return c ? { title: c.title, description: c.summary } : {};
}

export default async function CampaignPage({ params }: Props) {
  const { slug } = await params;
  const [c, brand] = await Promise.all([getPublicCampaign(slug), getBrand()]);
  if (!c) notFound();
  const pct = progressPercent(c.raisedAmount, c.targetAmount);

  return (
    <div>
    <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Campaign", href: "/campaigns" }, { label: c.title }]} />
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <article>
        <CoverImage src={c.coverImageUrl} alt={c.coverImageAlt ?? `Foto sampul campaign: ${c.title}`} className="h-56 w-full rounded-xl sm:h-80" />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} />
          {c.isDemo && <Badge tone="warning">DEMO — bukan penggalangan dana nyata</Badge>}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-2 text-slate-600">{c.summary}</p>
        <div className="mt-6"><Markdown>{c.descriptionMd}</Markdown></div>

        <section aria-labelledby="h-updates" className="mt-10">
          <h2 id="h-updates" className="mb-3 text-xl font-bold">Update campaign</h2>
          {c.updates.length === 0 ? (
            <p className="text-sm text-slate-600">Belum ada update.</p>
          ) : (
            <ul className="space-y-3">
              {c.updates.map((u) => (
                <li key={u.slug} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">{formatDate(u.publishedAt)}</p>
                  <Link href={`/news/${u.slug}`} className="font-semibold hover:underline">{u.title}</Link>
                  <p className="text-sm text-slate-600">{u.excerpt}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="space-y-4">
          <div>
            <p className="text-2xl font-bold">{formatIDR(c.raisedAmount)}</p>
            <p className="text-sm text-slate-600">terkumpul dari target {formatIDR(c.targetAmount)}</p>
          </div>
          <ProgressBar percent={pct} label="Progres donasi" />
          <p className="text-sm text-slate-600">{pct}% tercapai{c.endsAt ? ` · berakhir ${formatDate(c.endsAt)}` : ""}</p>
          {c.isOpen ? (
            <ButtonLink href={`/donate/${c.slug}`} className="w-full">{brand.ctaLabel}</ButtonLink>
          ) : (
            <Alert tone="warning" title="Donasi ditutup sementara/permanen">
              Campaign ini tidak menerima donasi baru. Pembayaran yang sudah dibuat sebelumnya tetap diproses.
            </Alert>
          )}
          <p className="text-xs text-slate-500">Anda tidak perlu login untuk berdonasi.</p>
        </Card>
      </aside>
    </div>
    </div>
  );
}
