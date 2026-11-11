# DonasiBisa — Platform Donasi Online

Platform donasi satu organisasi: campaign (nominal bebas / paket nominal), checkout guest, pembayaran Midtrans & Xendit (sekali bayar), notifikasi email/WhatsApp, donor dashboard + bukti donasi PDF, dan panel admin berbasis RBAC.

Spesifikasi lengkap ada di [`markdown_docs/`](markdown_docs/) (PRD, TRD, ERD, SETUP). Kontrak antar modul: [`docs/CONTRACTS.md`](docs/CONTRACTS.md).

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Drizzle ORM + PostgreSQL (Neon) · Auth.js v5 (Google) · Upstash Redis/QStash (opsional) · Nodemailer · Fonnte · pdf-lib · Vitest.

## Prasyarat
- Node.js **>= 20.19** (lihat `.nvmrc`; `nvm use`)
- Docker (untuk Postgres lokal) atau Postgres/Neon sendiri

## Instalasi & menjalankan

```bash
npm install
cp .env.example .env.local        # lalu isi sesuai kebutuhan
docker compose up -d              # Postgres di localhost:5433
npm run db:migrate                # terapkan migrasi
npm run db:seed                   # brand placeholder, provider, template, data DEMO
npm run dev                       # http://localhost:3000
```

Tanpa kredensial apa pun aplikasi tetap bisa dicoba end-to-end di mode development:

| Layanan | Jika kredensial kosong |
|---|---|
| Midtrans / Xendit | **Simulator gateway lokal** (`PAYMENT_SIMULATOR=true`, hanya `APP_ENV=development`). Adapter asli, verifikasi signature, dan settlement tetap berjalan; tombol "Bayar" di `/dev/pay/...` mengirim webhook bertanda tangan. |
| Google login | Wajib: isi `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (lihat bagian Google SSO). Login dev tanpa Google sudah dihapus. |
| Redis / QStash | Cache & rate limit in-memory; job dijalankan inline. Jadwal lokal: `npm run jobs:run`. |
| Email / WhatsApp | Dikirim sebagai `SKIPPED (CHANNEL_DISABLED)` di log notifikasi (preview isi tersimpan di dev). |

**Menjadi Super Admin:** isi `ADMIN_EMAIL_ALLOWLIST` (mis. `admin@example.com`), login Google dengan email itu, lalu buka `/admin`.

### Alur demo cepat
1. Buka `/` → campaign `[DEMO]` → **Donasi** → isi form → pilih metode.
2. Di halaman simulator klik **Bayar berhasil** (atau "2×" untuk menguji webhook ganda).
3. `/payment/<kode>` menampilkan SUCCEEDED dari database; progres campaign bertambah sekali.
4. Login Google (email sama dengan donasi) → `/account` → unduh PDF.

## Cara mengaktifkan Google SSO (belum ada kredensial)
1. [Google Cloud Console](https://console.cloud.google.com) → buat/pilih project → **APIs & Services → OAuth consent screen** (External, scope `openid`, `email`, `profile`; tambahkan akun Anda sebagai *Test user* selama mode testing).
2. **Credentials → Create Credentials → OAuth client ID → Web application**.
   - Authorized JavaScript origins: `http://localhost:3000` (+ URL preview/produksi)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (+ `https://DOMAIN/api/auth/callback/google`)
3. Isi `.env.local`: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` (`openssl rand -base64 32`), `ADMIN_EMAIL_ALLOWLIST`.
4. Restart `npm run dev`. Tombol "Masuk dengan Google" aktif.

## Mengaktifkan gateway sungguhan
1. Isi `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY` dan/atau `XENDIT_SECRET_KEY`/`XENDIT_WEBHOOK_TOKEN`, set flag `PAYMENTS_*_ENABLED=true`, dan `PAYMENT_SIMULATOR=false`.
2. Daftarkan webhook (URL harus publik/HTTPS, mis. Vercel Preview atau ngrok):
   - Midtrans: `https://DOMAIN/api/webhooks/midtrans`
   - Xendit: `https://DOMAIN/api/webhooks/xendit` (+ callback token yang sama dengan `XENDIT_WEBHOOK_TOKEN`)
3. Di `/admin/payment-methods` sesuaikan kode channel dengan yang aktif di akun merchant, lalu aktifkan provider. Provider tidak bisa diaktifkan jika kredensial belum ada.
4. Uji: pending, settlement, deny, expire, dan webhook ganda.

> **Belum diverifikasi terhadap sandbox asli:** adapter Midtrans & Xendit ditulis mengikuti dokumentasi resmi (Snap `POST /snap/v1/transactions`, Xendit `POST /v3/payment_requests`, header `api-version`), tetapi tanpa kredensial hanya diuji lewat simulator dan unit test signature/token. Verifikasi bentuk payload sandbox sebelum go-live.

## Background job (QStash)
Setelah deploy dan `QSTASH_*` terisi, buat schedule ke:

| Endpoint | Cron (UTC) |
|---|---|
| `/api/internal/jobs/campaign-lifecycle` | `*/5 * * * *` |
| `/api/internal/jobs/expire-payments` | `*/10 * * * *` |
| `/api/internal/jobs/notifications` (body `{"sweep":true}`) | `*/15 * * * *` |

Semua route job menolak request tanpa signature QStash (401).

## Perintah
```bash
npm run lint | typecheck | test | build
npm run db:generate    # buat migrasi baru dari perubahan schema
npm run db:migrate     # terapkan migrasi (pakai DATABASE_URL_DIRECT bila ada)
npm run db:seed        # idempoten
npm run jobs:run       # jalankan job lifecycle/expire/retry secara lokal
```
`npm test` membutuhkan Postgres lokal (`docker compose up -d`); database `donasibisa_test` dibuat otomatis. Override: `TEST_DATABASE_URL`, `TEST_DATABASE_ADMIN_URL`.

## Pengujian
- **Unit:** validasi nominal open/closed, aturan & state machine campaign, mapping status Midtrans/Xendit, monotonicity status, verifikasi signature/token, RBAC, render & escape template, util.
- **Integrasi (Postgres nyata):** settlement (sekali hitung, webhook ganda, event bersamaan, tidak bisa turun status, amount mismatch, late success, auto-close target, lifecycle), pembuatan donasi (idempotency, preset, status campaign), pembuatan pembayaran (provider dimock), tautan donor.
- Playwright E2E **belum** disertakan (lihat "Keputusan terbuka").

## Deploy ke Vercel
Workflow `.github/workflows/deploy.yml` men-deploy tanpa Vercel GitHub App (repo di akun GitHub A, project Vercel di akun B). Tambahkan secret di GitHub → Settings → Secrets and variables → Actions: `VERCEL_TOKEN` (buat di Vercel → Account Settings → Tokens), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (dari `.vercel/project.json` setelah `vercel link`). Tanpa secret, workflow melewati deploy. Push ke `main` = production, PR = preview.

## Desain & landing page
Palet **60-30-10**: terang = 60% putih, 30% biru (`#0064db`), 10% coral (`#ff6b57`); gelap = 60% hitam, 30% biru, 10% putih tegas (CTA putih). Token ada di `src/app/globals.css` (`--accent-eff`, `--on-accent`, `--blue-ink`); warna brand tetap bisa diubah di `/admin/brand`. Landing (`src/app/page.tsx`, `components/public/landing-sections.tsx`) memuat hero, kategori, campaign pilihan, statistik nyata (dari database, tidak dikarang), cara kerja, kepercayaan, berita, FAQ, dan CTA. Campaign punya kategori (`PENDIDIKAN|KESEHATAN|BENCANA|SOSIAL|LAINNYA`) dan halaman `/campaigns?kategori=`. Foto ilustrasi dari Wikimedia Commons (domain publik/CC0), kredit di `docs/IMAGE-CREDITS.md` dan `/kredit-foto`. **Deploy: jalankan `npm run db:migrate` ke database production sebelum merge (ada kolom `category` baru).**

## Aset brand
Logo bawaan ada di `public/brand/` (`logo-light|dark` PNG 1600px + `@1x` + WebP, `icon-192|512`, `icon-maskable-512`, `apple-touch-icon`, `placeholder`). Favicon/ikon memakai konvensi Next (`src/app/favicon.ico` 16/32/48, `icon.png`, `apple-icon.png`, `opengraph-image.png`, `manifest.ts`). Varian terang/gelap dipilih otomatis lewat `prefers-color-scheme`; jika `Logo URL` diisi di `/admin/brand`, gambar itu menggantikan logo bawaan. Ikon saja dipakai sebagai favicon dan placeholder foto profil/gambar (`Avatar`, `CoverImage`).

## Struktur
```
src/app/            halaman publik, /account, /admin, /api (donations, webhooks, receipts, public, internal/jobs, dev)
src/services/       logika bisnis (campaigns, donations, payments, notifications, news, brand, admin, donors, audit)
src/lib/payments/   kontrak adapter, status-mapper, providers/{midtrans,xendit}, simulator (dev)
src/lib/auth/       Auth.js, RBAC (permissions.ts), guard sesi
src/lib/notifications, cache, qstash, pdf, validation, utils
src/db/             schema Drizzle, migrasi, seed
tests/              Vitest
```

## Catatan keamanan
- Status **SUCCEEDED hanya** dari webhook terverifikasi atau cek status server-to-server; redirect/query string tidak pernah dipercaya. Halaman success membaca DB.
- Settlement: satu transaksi DB, row lock, update donation bersyarat `status='PENDING'` → `raised_amount` naik sekali; event ganda di-dedupe `(provider, external_event_id)`; amount/currency harus cocok dengan data internal.
- Secret hanya di env (tidak pernah di DB/browser). Log & payload disanitasi (`sanitizePayload`).
- RBAC dicek di server untuk setiap halaman dan server action; donor biasa mendapat 404 di `/admin`. Receipt & detail transaksi: kepemilikan dicek di query (404 bila bukan pemilik).
- Markdown disanitasi (`rehype-sanitize`); URL gambar/redirect harus HTTPS; security headers di `next.config.ts`.
- Rate limit pada create donation / payment / status; WhatsApp hanya jika consent snapshot `true`.
- Simulator gateway **hanya** aktif saat `APP_ENV=development` (route mengembalikan 404 selain itu). **Pastikan `APP_ENV=production` di Vercel.**

## Keputusan terbuka / BLOCKED
- **BLOCKED:** kredensial Google OAuth, Midtrans, Xendit, Neon, Upstash, SMTP, Fonnte (lihat tabel fallback di atas).
- Brand, logo, warna, kontak, kebijakan privasi/syarat layanan final, kebijakan refund.
- Refund terkonfirmasi provider hanya mengubah status; `raised_amount` sengaja tidak dikurangi (ERD: agregat hanya naik) — putuskan kebijakan rekonsiliasi.
- Kode channel Xendit v3 (mis. `BCA_VIRTUAL_ACCOUNT`) dan `enabled_payments` Midtrans perlu disesuaikan dengan akun merchant.
- Upload gambar: MVP memakai URL HTTPS.
- Penyimpangan dari TRD: tanpa shadcn/ui CLI (komponen Tailwind sendiri), tanpa React Hook Form (form native + validasi server Zod), mutasi admin memakai Server Actions (bukan `/api/admin/*`), HTTP adapter alih-alih SDK `midtrans-client`/`xendit-node` (lebih sedikit dependency, mudah disimulasikan), Playwright ditunda.

## Tema
Tombol tema (perangkat / terang / gelap) ada di header; default mengikuti pengaturan perangkat dan pilihan disimpan di browser. Breadcrumb dan tombol kembali (`PageNav`) ada di semua halaman publik, akun, dan admin.
