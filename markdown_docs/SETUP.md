# Setup Guide — Donasi Online Hackathon

Panduan ini menyiapkan repository, layanan eksternal, database, auth, payment, notification, cron, testing, dan deployment. Gunakan **sandbox/test mode** selama hackathon.

## 0. Prasyarat

- Node.js versi LTS yang didukung oleh Next.js versi yang dipilih.
- pnpm.
- Git dan akun GitHub.
- Akun Neon, Upstash, Vercel.
- Akun Google Cloud untuk OAuth.
- Akun Midtrans Sandbox dan Xendit test mode.
- Akun Gmail yang dapat menggunakan OAuth2 atau App Password.
- Akun Fonnte dan device WhatsApp yang telah terhubung.
- Domain publik atau Vercel Preview URL untuk webhook testing.

```bash
node -v
pnpm -v
git --version
```

## 1. Create Repository and Next.js App

Jika belum punya project:

```bash
pnpm create next-app@latest donasi-online
cd donasi-online
```

Pilih:
- TypeScript: yes
- ESLint: yes
- Tailwind CSS: yes
- `src/` directory: yes
- App Router: yes
- Import alias: `@/*`

Inisialisasi Git jika belum otomatis:

```bash
git init
git add .
git commit -m "chore: bootstrap Next.js app"
```

Buat repository GitHub, lalu:

```bash
git remote add origin <GITHUB_REPOSITORY_URL>
git branch -M main
git push -u origin main
```

## 2. Install Dependencies

```bash
pnpm add drizzle-orm postgres
pnpm add next-auth @auth/drizzle-adapter
pnpm add @upstash/redis @upstash/ratelimit @upstash/qstash
pnpm add midtrans-client xendit-node
pnpm add nodemailer zod react-hook-form @hookform/resolvers
pnpm add react-markdown remark-gfm rehype-sanitize
pnpm add pdf-lib date-fns lucide-react
pnpm add -D drizzle-kit tsx eslint eslint-config-next @types/nodemailer vitest @playwright/test prettier
```

Buat komponen UI:

```bash
pnpm dlx shadcn@latest init
```

Tambahkan komponen sesuai kebutuhan, misalnya:

```bash
pnpm dlx shadcn@latest add button card input textarea select checkbox dialog dropdown-menu table badge tabs skeleton sonner
```

Pilih satu library PDF saja. Daftar di atas menggunakan `pdf-lib`.

## 3. Create External Services

### 3.1 Neon PostgreSQL

1. Buat project Neon.
2. Buat branch development khusus hackathon.
3. Buat database dan role aplikasi.
4. Ambil connection string pooled untuk runtime dan direct/unpooled jika akan dipakai migrasi.
5. Simpan sebagai `DATABASE_URL` dan `DATABASE_URL_DIRECT`.
6. Jangan commit connection string ke Git.

Contoh format placeholder:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require"
DATABASE_URL_DIRECT="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require"
```

Gunakan URL yang diberikan Neon Console; jangan menebak hostname/username.

### 3.2 Upstash Redis

1. Buat database Redis di Upstash.
2. Pilih region dekat deployment/database bila tersedia.
3. Copy REST URL dan REST token.
4. Simpan ke environment variables.

```env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

Redis untuk cache/rate limit saja; data transaksi tetap di Neon.

### 3.3 Upstash QStash

1. Aktifkan QStash pada dashboard Upstash.
2. Copy token dan current/next signing key.
3. Pastikan aplikasi sudah memiliki public URL untuk job destination.
4. Set schedule setelah endpoint deploy dan signature verification diuji.

```env
QSTASH_TOKEN="..."
QSTASH_CURRENT_SIGNING_KEY="..."
QSTASH_NEXT_SIGNING_KEY="..."
```

QStash cron default dievaluasi dalam UTC. Pertimbangkan timezone saat membuat jadwal.

### 3.4 Midtrans Sandbox

1. Buat/akses Merchant Administration Portal (MAP) Sandbox.
2. Ambil Server Key dan Client Key dari environment Sandbox.
3. Gunakan `isProduction: false`.
4. Implementasi Snap Redirect atau Snap JS; rekomendasi MVP: backend membuat Snap transaction dan menyimpan `redirect_url`.
5. Setelah deploy, konfigurasi Payment Notification URL ke:

```text
https://YOUR_PUBLIC_DOMAIN/api/webhooks/midtrans
```

6. Tes status pending, settlement/capture, deny, expire, dan duplicate notification.
7. Jangan mengaktifkan production key sebelum pengujian menyeluruh.

```env
MIDTRANS_SERVER_KEY="SB-Mid-server-..."
MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
MIDTRANS_IS_PRODUCTION="false"
PAYMENTS_MIDTRANS_ENABLED="true"
```

Midtrans melakukan webhook server-to-server. Gunakan signature verification atau mekanisme verifikasi resmi SDK; jangan menganggap browser redirect sebagai konfirmasi pembayaran.

### 3.5 Xendit Test Mode

1. Masuk ke Xendit Dashboard dan pastikan test mode aktif.
2. Buat/ambil Secret API Key test mode.
3. Pastikan metode/channel yang dibutuhkan tersedia pada akun tersebut.
4. Implementasikan Payment Request API dengan tipe satu kali bayar (`PAY`) dan channel code yang dipilih.
5. Atur webhook/callback untuk endpoint:

```text
https://YOUR_PUBLIC_DOMAIN/api/webhooks/xendit
```

6. Atur callback verification token dan masukkan token yang sama ke `XENDIT_WEBHOOK_TOKEN`.
7. Tes webhook valid, invalid token, duplicate event, pending, success, failure, dan expiry.

```env
XENDIT_SECRET_KEY="xnd_development_..."
XENDIT_WEBHOOK_TOKEN="..."
PAYMENTS_XENDIT_ENABLED="true"
```

Jangan simpan credential Xendit ke tabel payment provider config. Hanya simpan status provider/channel aktif.

### 3.6 Google OAuth / Auth.js

1. Buka Google Cloud Console.
2. Buat project atau pilih project hackathon.
3. Configure OAuth consent screen.
4. Tambahkan scope minimum `openid`, `email`, `profile`.
5. Untuk mode testing, tambahkan akun Google developer sebagai Test User.
6. Buat OAuth Client ID untuk Web Application.
7. Authorized JavaScript origins:
   - `http://localhost:3000`
   - URL preview/production yang digunakan.
8. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR_PUBLIC_DOMAIN/api/auth/callback/google`
9. Simpan Client ID dan Client Secret.
10. Buat `AUTH_SECRET` dengan generator aman.

```bash
openssl rand -base64 32
```

```env
AUTH_SECRET="..."
AUTH_GOOGLE_ID="...apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="..."
ADMIN_EMAIL_ALLOWLIST="admin@example.com"
```

`ADMIN_EMAIL_ALLOWLIST` adalah daftar email Google terverifikasi yang boleh memperoleh Super Admin saat pertama login. Jangan menerima role admin dari form/browser.

### 3.7 Gmail + Nodemailer

Untuk hackathon, gunakan Gmail SMTP dengan App Password hanya jika Google Account mengizinkannya dan 2-Step Verification aktif. Jangan gunakan password utama Gmail. OAuth2 lebih tepat untuk integrasi baru. Gmail memiliki limit pengiriman dan dapat memblokir pola aktivitas mencurigakan; gunakan provider transactional khusus ketika volume meningkat.

Pilihan A — App Password:
1. Aktifkan 2-Step Verification.
2. Buat App Password untuk Mail.
3. Simpan password itu sebagai `SMTP_APP_PASSWORD`.

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="youraccount@gmail.com"
SMTP_APP_PASSWORD="..."
EMAIL_FROM_NAME="Nama Platform"
EMAIL_FROM_ADDRESS="youraccount@gmail.com"
```

Pilihan B — OAuth2:
- Gunakan OAuth client dan refresh token sesuai panduan Nodemailer Gmail OAuth2.
- Simpan refresh token dan client secret hanya di server environment.

Jangan mengirim email langsung dari browser. Email dipanggil melalui notification dispatcher/job.

### 3.8 Fonnte WhatsApp

1. Buat akun Fonnte.
2. Hubungkan device WhatsApp sesuai petunjuk Fonnte.
3. Pastikan status device connected/ready.
4. Ambil API token.
5. Uji pengiriman dari Fonnte dashboard/API ke nomor tim.
6. Set `FONNTE_TOKEN`.

```env
FONNTE_TOKEN="..."
NOTIFICATIONS_WHATSAPP_ENABLED="true"
```

Request Fonnte dilakukan dari backend ke API send message. Jangan expose token ke frontend. Gunakan nomor yang diberikan consent untuk menerima notifikasi transaksi.

## 4. Environment Variables

Buat `.env.example` dan salin sebagai `.env.local`:

```env
# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEFAULT_TIMEZONE="Asia/Jakarta"

# Neon PostgreSQL
DATABASE_URL=""
DATABASE_URL_DIRECT=""

# Auth.js / Google
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
ADMIN_EMAIL_ALLOWLIST="admin@example.com"

# Midtrans
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
PAYMENTS_MIDTRANS_ENABLED="false"

# Xendit
XENDIT_SECRET_KEY=""
XENDIT_WEBHOOK_TOKEN=""
PAYMENTS_XENDIT_ENABLED="false"

# Upstash Redis
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Upstash QStash
QSTASH_TOKEN=""
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""

# Gmail / Nodemailer
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER=""
SMTP_APP_PASSWORD=""
EMAIL_FROM_NAME="Nama Platform"
EMAIL_FROM_ADDRESS=""
NOTIFICATIONS_EMAIL_ENABLED="false"

# Fonnte
FONNTE_TOKEN=""
NOTIFICATIONS_WHATSAPP_ENABLED="false"

# App settings
MIN_DONATION_AMOUNT="10000"
MAX_DONATION_AMOUNT="100000000"
DONATION_CURRENCY="IDR"
```

Rules:
- `.env.local` wajib masuk `.gitignore`.
- Tidak ada secret yang memakai `NEXT_PUBLIC_`.
- Environment Vercel Local/Preview/Production harus dipisah.
- Setelah mengubah Vercel env, redeploy agar deployment baru menggunakan konfigurasi terbaru.

## 5. Configure Drizzle and Database

1. Buat schema sesuai [`ERD.md`](./ERD.md).
2. Buat `drizzle.config.ts`.
3. Tambahkan script:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Pastikan ESLint config meng-extend konfigurasi Next.js yang sesuai dengan versi yang dipasang.

Contoh `drizzle.config.ts` untuk migration dengan direct connection URL:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
  strict: true,
  verbose: true,
});
```

Pastikan `schema/index.ts` mengekspor semua tabel. Runtime app memakai `DATABASE_URL` pooled; migration memakai direct URL.

4. Generate migration:

```bash
pnpm db:generate
```

5. Review SQL migration, lalu apply ke Neon development:

```bash
pnpm db:migrate
```

6. Jalankan seed:

```bash
pnpm db:seed
```

Seed harus idempotent dan membuat:
- Brand config placeholder.
- Provider rows Midtrans/Xendit disabled by default.
- Channel config default sesuai keputusan implementasi (disabled sampai dites).
- Notification templates default.
- Optional sample campaign/news untuk demo.

Role Super Admin diberikan saat Google account allowlisted login; jangan seed user dengan password statis.

## 6. Implement Auth.js

1. Buat Auth.js config menggunakan Google provider dan Drizzle adapter.
2. Gunakan schema `users`, `accounts`, `sessions`, dan tabel terkait dari versi adapter yang dipakai.
3. Expose handler di `src/app/api/auth/[...nextauth]/route.ts`.
4. Buat `auth()` helper untuk Server Components/Route Handlers.
5. Implement `requireUser`, `requireAdmin`, dan `requirePermission`.
6. Saat user Google login:
   - Pastikan email tersedia dan verified.
   - Cari donor dengan normalized email.
   - Jika donor belum terhubung dan email verified cocok, tautkan donor.user_id ke user.
   - Jangan otomatis menyatukan data berdasarkan email yang tidak verified.
7. Uji donor biasa tidak dapat membuka `/admin`.

## 7. Configure Payment Webhooks

### Local development

Webhook provider memerlukan URL publik. Opsi:
- Deploy Vercel Preview dan gunakan preview URL pada dashboard provider; atau
- Jalankan tunnel HTTPS (misalnya ngrok) ke `localhost:3000` untuk tes lokal.

Jangan menganggap localhost dapat menerima webhook dari internet.

### Midtrans

Set Notification URL:

```text
https://YOUR_PUBLIC_DOMAIN/api/webhooks/midtrans
```

Lalu tes:
- Token/transaction creation berhasil.
- Browser redirect pending/success tidak menandai DB paid.
- Notification signature valid diterima.
- Signature invalid ditolak.
- Notification duplicate tidak menggandakan raised amount.

### Xendit

Set payment webhook URL:

```text
https://YOUR_PUBLIC_DOMAIN/api/webhooks/xendit
```

Masukkan callback verification token sesuai dashboard Xendit. Pastikan endpoint memeriksa header `x-callback-token`, reference, amount, currency, dan status event.

## 8. Configure QStash

Setelah app sudah deploy di URL publik:

1. Buat route internal job untuk notification, payment expiry, dan campaign lifecycle.
2. Gunakan QStash SDK signature verification pada route.
3. Uji request tanpa signature harus ditolak.
4. Buat schedule melalui QStash dashboard/SDK.

Schedule awal:

| Endpoint | Cron |
|---|---|
| `/api/internal/jobs/campaign-lifecycle` | `*/5 * * * *` |
| `/api/internal/jobs/expire-payments` | `*/10 * * * *` |

QStash cron default UTC. Simpan schedule ID di catatan operasional agar dapat dihentikan/diedit. Jangan membuat schedule sebelum destination endpoint tersedia.

## 9. Configure Cache and Rate Limits

1. Buat Redis client dengan `Redis.fromEnv()` atau konstruktor env.
2. Implement key constants.
3. Cache hanya data publik yang aman.
4. Invalidate cache saat campaign/news/brand berubah.
5. Invalidate campaign aggregate cache setelah payment success.
6. Rate limit create donation, payment create dan status polling.
7. Jangan rate-limit webhook provider dengan limiter pengunjung.

## 10. Run Locally

```bash
pnpm dev
```

Buka `http://localhost:3000` dan jalankan lint/typecheck/test:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Pastikan tidak ada warning build yang menyebabkan route payment/webhook berjalan di Edge Runtime jika SDK membutuhkan Node.js runtime. Set `export const runtime = "nodejs"` untuk route yang memakai SDK Node-only.

## 11. Deploy to Vercel

1. Push repository ke GitHub.
2. Import repository pada Vercel.
3. Set framework Next.js.
4. Tambahkan environment variables untuk Preview terlebih dahulu.
5. Deploy Preview.
6. Atur Google OAuth redirect URI Preview jika login diuji di Preview.
7. Daftarkan webhook URL Preview pada provider sandbox.
8. Jalankan migrations ke Neon development/preview.
9. Smoke test semua route penting.
10. Setelah lolos, atur production environment secara terpisah.

Jangan menggunakan production secret di preview deployment.

## 12. Seed / Demo Data

Minimal siapkan:
- 1 akun Super Admin dari allowlist.
- 1 campaign `OPEN_AMOUNT` published.
- 1 campaign `CLOSED_AMOUNT` published dengan tiga preset.
- 1 campaign draft untuk diuji visibility.
- 2 berita umum dan 1 update campaign.
- 2 provider config; enabled hanya provider yang telah lulus test.
- Payment channel config menyesuaikan channel yang aktif di akun merchant.

Sample copy harus ditandai sebagai demo dan tidak boleh mengesankan campaign nyata/terverifikasi.

## 13. Smoke Test Checklist

### Public
- [ ] Homepage terbuka di mobile dan desktop.
- [ ] Campaign published tampil.
- [ ] Draft/paused/closed tidak menerima donasi baru.
- [ ] News published tampil, draft tidak tampil.

### Donation
- [ ] Guest checkout tanpa login berhasil.
- [ ] Open amount dapat memasukkan nominal valid.
- [ ] Closed amount hanya menerima preset aktif.
- [ ] Double click tidak membuat transaksi ganda.
- [ ] Nominal tidak dapat dimanipulasi via browser.

### Payments
- [ ] Provider/channel disabled tidak tampil.
- [ ] Payment checkout dibuat dari server.
- [ ] Pending belum menambah campaign raised amount.
- [ ] Invalid webhook ditolak.
- [ ] Verified webhook membuat status sukses.
- [ ] Duplicate webhook tidak menggandakan raised amount/notifikasi.
- [ ] Status sukses tidak kembali menjadi pending.

### Donor/Auth
- [ ] Google SSO berhasil.
- [ ] Donor tidak dapat melihat transaksi donor lain.
- [ ] Guest donation dengan email Google verified terhubung sesuai aturan.
- [ ] Receipt hanya tersedia untuk transaksi sukses dan owner/admin.

### Admin
- [ ] Donor biasa ditolak dari admin.
- [ ] Role yang berbeda memiliki permission sesuai.
- [ ] Admin changes tercatat di audit logs.
- [ ] Secret tidak dapat dilihat dari UI.

### Notifications / Cron
- [ ] Email success diuji.
- [ ] WhatsApp hanya dikirim dengan consent.
- [ ] Failure dicatat tanpa merusak payment status.
- [ ] Job QStash tanpa signature ditolak.
- [ ] Campaign lifecycle job menutup campaign sesuai aturan.

## 14. Go-Live Checklist

Untuk transaksi sungguhan, lakukan semua ini sebelum membuka fitur production:

- [ ] Identitas brand dan organisasi final.
- [ ] Kontak, terms, privacy notice, dan kebijakan donasi final.
- [ ] Akun merchant Midtrans/Xendit production telah diverifikasi dan channel aktif.
- [ ] Production server/client key terpasang di environment Production saja.
- [ ] Webhook URL production telah didaftarkan dan diuji.
- [ ] Nominal, currency, expiry, dan status reconciliation diuji.
- [ ] Email sender dan delivery policy sesuai.
- [ ] WhatsApp device/token dan consent messaging teruji.
- [ ] Backup/restore database dipahami.
- [ ] Alert untuk webhook error, payment mismatch, dan notification failures tersedia.
- [ ] Admin role dan akses minimal diperiksa.
- [ ] Tidak ada sample campaign/data demo yang tertinggal.
- [ ] Pembayaran produksi pertama diuji dengan jumlah rendah dan direkonsiliasi pada dashboard merchant.

---

## 15. Troubleshooting Cepat

| Gejala | Kemungkinan sebab | Tindakan |
|---|---|---|
| Google callback error | Redirect URI/origin tidak cocok | Cocokkan URL lokal dan deployment di Google Cloud |
| Database connection limit | Pool terlalu besar/instance per request | Gunakan pooled URL dan batasi koneksi |
| QStash job 401 | Signing key salah atau body/url berubah | Periksa env, verifikasi raw body dan destination URL |
| Webhook tidak diterima | URL private/localhost atau salah konfigurasi | Gunakan HTTPS publik dan cek dashboard delivery attempts |
| Payment pending terus | Webhook belum terkonfigurasi/ditolak | Cek provider event log, signature, reference, amount |
| Gmail auth gagal | App Password/OAuth2 salah atau SMTP diblokir | Periksa 2FA, app password, OAuth scope dan Gmail security |
| Fonnte gagal | Device disconnected/nomor format salah | Cek device status dan format target |
| Campaign total dobel | Settlement tidak idempotent | Audit conditional state transition dan transaksi DB |

## 16. Official Setup References

- Next.js: https://nextjs.org/docs
- Auth.js Google: https://authjs.dev/getting-started/providers/google
- Auth.js Drizzle Adapter: https://authjs.dev/getting-started/adapters/drizzle
- Neon connect: https://neon.com/docs/get-started/connect-neon
- Drizzle Neon: https://orm.drizzle.team/docs/connect-neon
- Upstash Redis: https://upstash.com/docs/redis/quickstarts/nextjs-app-router
- Upstash QStash Next.js: https://upstash.com/docs/qstash/quickstarts/vercel-nextjs
- Midtrans Snap: https://github.com/Midtrans/technical-documentation-site/blob/master/en/snap/integration-guide.md
- Midtrans webhook: https://docs.midtrans.com/docs/https-notification-webhooks
- Xendit Payment Request: https://docs.xendit.co/apidocs/create-payment-request
- Xendit webhook: https://docs.xendit.co/apidocs/payment-webhook-notification
- Fonnte: https://docs.fonnte.com/api-send-message/
- Nodemailer Gmail: https://nodemailer.com/guides/using-gmail
- Vercel environment variables: https://vercel.com/docs/environment-variables
