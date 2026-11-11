import { and, eq } from "drizzle-orm";
import { closeDb, db } from "./index";
import {
  brandConfig,
  campaignAmountOptions,
  campaigns,
  newsPosts,
  notificationTemplates,
  paymentMethodConfigs,
  paymentProviders,
} from "./schema";
import { DEFAULT_TEMPLATES } from "@/lib/notifications/templates";
import { getEnv } from "@/lib/env";
import { simulatorEnabled } from "@/lib/payments/simulator";

/** Idempotent seed. Re-running never duplicates rows or overwrites admin edits. */
async function seed(): Promise<void> {
  const env = getEnv();

  // 1. Brand placeholder (neutral; replace in /admin/brand).
  await db
    .insert(brandConfig)
    .values({
      brandName: "DonasiBisa",
      primaryColor: "#0064db",
      secondaryColor: "#062246",
      accentColor: "#ff6b57",
      tagline: "Berbagi kebaikan, satu donasi pada satu waktu.",
      footerText: "© DonasiBisa.",
      contactEmail: "halo@example.com",
    })
    .onConflictDoNothing();

  // 2. Providers: disabled by default. Only in dev with the simulator are they enabled for convenience.
  const enableForDev = simulatorEnabled();
  const providerDefs = [
    { provider: "MIDTRANS" as const, sortOrder: 1, channels: [["qris", "QRIS"], ["gopay", "GoPay"], ["bca_va", "BCA Virtual Account"]] },
    { provider: "XENDIT" as const, sortOrder: 2, channels: [["QRIS", "QRIS"], ["DANA", "DANA"], ["BCA_VIRTUAL_ACCOUNT", "BCA Virtual Account"]] },
  ];
  for (const def of providerDefs) {
    await db.insert(paymentProviders).values({ provider: def.provider, sortOrder: def.sortOrder, isEnabled: enableForDev, environment: "SANDBOX" }).onConflictDoNothing();
    const [p] = await db.select().from(paymentProviders).where(eq(paymentProviders.provider, def.provider));
    let i = 0;
    for (const [code, name] of def.channels) {
      await db
        .insert(paymentMethodConfigs)
        .values({ providerId: p.id, channelCode: code, displayName: `${name}`, isEnabled: enableForDev, sortOrder: i++ })
        .onConflictDoNothing();
    }
  }

  // 3. Notification templates.
  for (const t of DEFAULT_TEMPLATES) {
    await db.insert(notificationTemplates).values({ templateKey: t.templateKey, channel: t.channel, subject: t.subject ?? null, bodyText: t.bodyText, bodyHtml: t.bodyHtml ?? null }).onConflictDoNothing();
  }

  // 4. Demo content — clearly labelled; never seeded in production.
  if (env.APP_ENV !== "production") await seedDemo();
  console.log("Seed complete.");
}

async function seedDemo(): Promise<void> {
  type Cat = "PENDIDIKAN" | "KESEHATAN" | "BENCANA" | "SOSIAL" | "LAINNYA";
  const demoCampaigns: Array<{ slug: string; title: string; amountMode: "OPEN_AMOUNT" | "CLOSED_AMOUNT"; status: "PUBLISHED" | "DRAFT"; featured: boolean; target: number; category: Cat; cover: string | null }> = [
    { slug: "demo-nominal-bebas", title: "[DEMO] Beasiswa Anak Sekolah (nominal bebas)", amountMode: "OPEN_AMOUNT", status: "PUBLISHED", featured: true, target: 10_000_000, category: "PENDIDIKAN", cover: "/images/landing/education.webp" },
    { slug: "demo-nominal-paket", title: "[DEMO] Layanan Kesehatan Ibu & Anak (paket nominal)", amountMode: "CLOSED_AMOUNT", status: "PUBLISHED", featured: true, target: 5_000_000, category: "KESEHATAN", cover: "/images/landing/health.webp" },
    { slug: "demo-bencana", title: "[DEMO] Bantuan Darurat Bencana", amountMode: "OPEN_AMOUNT", status: "PUBLISHED", featured: true, target: 25_000_000, category: "BENCANA", cover: "/images/landing/disaster.webp" },
    { slug: "demo-draft", title: "[DEMO] Campaign Draft (tidak tampil publik)", amountMode: "OPEN_AMOUNT", status: "DRAFT", featured: false, target: 1_000_000, category: "SOSIAL", cover: "/images/landing/community.webp" },
  ];
  for (const c of demoCampaigns) {
    const [existing] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, c.slug));
    if (existing) {
      // Backfill presentation fields on previously seeded demo rows (never touches amounts/status).
      await db.update(campaigns).set({ category: c.category, coverImageUrl: c.cover, title: c.title }).where(eq(campaigns.id, existing.id));
      continue;
    }
    const [row] = await db
      .insert(campaigns)
      .values({
        category: c.category,
        coverImageUrl: c.cover,
        slug: c.slug,
        title: c.title,
        summary: "Contoh campaign untuk demo. Bukan penggalangan dana nyata dan tidak terverifikasi.",
        descriptionMd: "## Data demo\n\nCampaign ini hanya **contoh** untuk menguji alur donasi. Tidak ada penerima manfaat nyata dan dana tidak disalurkan.\n\n- Tidak terverifikasi\n- Hapus sebelum go-live",
        targetAmount: c.target,
        amountMode: c.amountMode,
        status: c.status,
        isFeatured: c.featured,
        isDemo: true,
        publishedAt: c.status === "PUBLISHED" ? new Date() : null,
      })
      .returning();
    if (c.amountMode === "CLOSED_AMOUNT") {
      await db.insert(campaignAmountOptions).values([
        { campaignId: row.id, amount: 25_000, label: "Paket Hemat", sortOrder: 0 },
        { campaignId: row.id, amount: 50_000, label: "Paket Berbagi", sortOrder: 1 },
        { campaignId: row.id, amount: 100_000, label: "Paket Peduli", sortOrder: 2 },
      ]);
    }
  }
  const [paket] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, "demo-nominal-paket"));
  const news = [
    { slug: "demo-berita-umum-1", title: "[DEMO] Selamat datang di platform donasi", campaignId: null as string | null },
    { slug: "demo-berita-umum-2", title: "[DEMO] Cara kerja donasi online", campaignId: null as string | null },
    { slug: "demo-update-paket", title: "[DEMO] Update campaign paket nominal", campaignId: paket?.id ?? null },
  ];
  for (const n of news) {
    const [exists] = await db.select({ id: newsPosts.id }).from(newsPosts).where(and(eq(newsPosts.slug, n.slug)));
    if (exists) continue;
    await db.insert(newsPosts).values({
      slug: n.slug,
      title: n.title,
      excerpt: "Konten contoh untuk demo, bukan berita nyata.",
      bodyMd: "Ini adalah **konten demo**. Ganti dengan berita sebenarnya melalui panel admin.",
      campaignId: n.campaignId,
      status: "PUBLISHED",
      publishedAt: new Date(),
    });
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
