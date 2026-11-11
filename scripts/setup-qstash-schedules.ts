import { Client } from "@upstash/qstash";

/**
 * Creates (idempotently) the Upstash QStash cron schedules that call our signed internal job routes.
 * Usage: APP_URL=https://donasibisa.vercel.app QSTASH_TOKEN=... npm run qstash:schedules
 * Cron is evaluated in UTC by QStash.
 */
const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const token = process.env.QSTASH_TOKEN;
if (!appUrl.startsWith("https://")) throw new Error("APP_URL must be the public https URL of the deployment");
if (!token) throw new Error("QSTASH_TOKEN is required");

const SCHEDULES: Array<{ path: string; cron: string; body?: unknown; note: string }> = [
  { path: "/api/internal/jobs/campaign-lifecycle", cron: "*/5 * * * *", note: "tutup campaign (tanggal/target) tiap 5 menit" },
  { path: "/api/internal/jobs/expire-payments", cron: "*/10 * * * *", note: "rekonsiliasi & kedaluwarsa pembayaran tiap 10 menit" },
  { path: "/api/internal/jobs/notifications", cron: "*/15 * * * *", body: { sweep: true }, note: "ulangi notifikasi gagal tiap 15 menit" },
];

async function main(): Promise<void> {
  const client = new Client({ token });
  const existing = await client.schedules.list();
  for (const s of SCHEDULES) {
    const destination = `${appUrl}${s.path}`;
    const same = existing.filter((e) => e.destination === destination);
    if (same.some((e) => e.cron === s.cron)) {
      console.log(`= sudah ada  ${s.cron.padEnd(13)} ${destination}`);
      continue;
    }
    for (const old of same) await client.schedules.delete(old.scheduleId); // cron changed → replace
    const created = await client.schedules.create({
      destination,
      cron: s.cron,
      body: JSON.stringify(s.body ?? {}),
      headers: { "Content-Type": "application/json" },
      retries: 2,
    });
    console.log(`+ dibuat     ${s.cron.padEnd(13)} ${destination}  (${s.note}) id=${created.scheduleId}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
