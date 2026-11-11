import { eq, sql } from "drizzle-orm";
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
import { DEMO_CAMPAIGNS, DEMO_NEWS } from "./demo-data";
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
      footerText: "© 2026 DonasiBisa. Seluruh hak cipta dilindungi.",
    })
    .onConflictDoNothing();

  // 2. Providers: disabled by default. Only in dev with the simulator are they enabled for convenience.
  const enableForDev = simulatorEnabled();
  const providerDefs = [
    { provider: "MIDTRANS" as const, sortOrder: 1, channels: [["other_qris", "QRIS"], ["gopay", "GoPay"], ["bca_va", "BCA Virtual Account"]] },
    { provider: "XENDIT" as const, sortOrder: 2, channels: [["QRIS", "QRIS"], ["DANA", "DANA"], ["BCA_VIRTUAL_ACCOUNT", "BCA Virtual Account"]] },
  ];
  // Fix-up (runs BEFORE the insert below): Midtrans Snap calls QRIS "other_qris"; rename the old seeded code.
  await db.execute(sql`update payment_method_configs set channel_code = 'other_qris' where channel_code = 'qris' and provider_id = (select id from payment_providers where provider = 'MIDTRANS')`);

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
  // Demo content: automatic outside production; in production only when explicitly requested.
  if (env.APP_ENV !== "production" || process.env.SEED_DEMO === "true") await seedDemo();
  console.log("Seed complete.");
}

/** Replaces older generic demo rows (only those with no donations) and upserts the realistic demo set. */
async function seedDemo(): Promise<void> {
  await db.execute(sql`delete from campaigns c where c.is_demo = true and c.slug in ('demo-nominal-bebas','demo-nominal-paket','demo-bencana','demo-draft') and not exists (select 1 from donations d where d.campaign_id = c.id)`);
  await db.execute(sql`delete from news_posts where slug like 'demo-%'`);

  for (const c of DEMO_CAMPAIGNS) {
    const endsAt = c.endsInDays ? new Date(Date.now() + c.endsInDays * 86_400_000) : null;
    const closed = c.status === "COMPLETED";
    const values = {
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      descriptionMd: c.description,
      category: c.category,
      targetAmount: c.target,
      raisedAmount: c.raised, // demo rows only: fictional progress for presentations
      amountMode: c.amountMode,
      status: c.status,
      closeReason: closed ? ("TARGET_REACHED" as const) : null,
      isFeatured: c.featured,
      isDemo: true,
      coverImageUrl: c.cover,
      endsAt,
      publishedAt: new Date(Date.now() - 20 * 86_400_000),
    };
    const [existing] = await db.select({ id: campaigns.id, isDemo: campaigns.isDemo }).from(campaigns).where(eq(campaigns.slug, c.slug));
    let id: string;
    if (existing) {
      if (!existing.isDemo) continue; // never touch a real campaign that happens to share a slug
      await db.update(campaigns).set({ ...values, updatedAt: new Date() }).where(eq(campaigns.id, existing.id));
      id = existing.id;
    } else {
      [{ id }] = await db.insert(campaigns).values(values).returning({ id: campaigns.id });
    }
    if (c.presets) {
      await db.delete(campaignAmountOptions).where(eq(campaignAmountOptions.campaignId, id));
      await db.insert(campaignAmountOptions).values(c.presets.map(([amount, label], i) => ({ campaignId: id, amount, label, sortOrder: i })));
    }
  }

  for (const n of DEMO_NEWS) {
    const [c] = n.campaignSlug ? await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, n.campaignSlug)) : [undefined];
    const publishedAt = new Date(Date.now() - n.daysAgo * 86_400_000);
    const values = { slug: n.slug, title: n.title, excerpt: n.excerpt, bodyMd: n.body, campaignId: c?.id ?? null, status: "PUBLISHED" as const, publishedAt };
    const [exists] = await db.select({ id: newsPosts.id }).from(newsPosts).where(eq(newsPosts.slug, n.slug));
    if (exists) await db.update(newsPosts).set({ ...values, updatedAt: new Date() }).where(eq(newsPosts.id, exists.id));
    else await db.insert(newsPosts).values(values);
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
