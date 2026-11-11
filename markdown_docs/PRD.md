# Product Requirements Document (PRD)

> **Nama proyek:** Platform Donasi Online (nama brand sementara: `Donasi Platform`)
>
> **Status:** Draft siap implementasi MVP
>
> **Target delivery:** 1 hari untuk demo/MVP sandbox
>
> **Bahasa produk:** Bahasa Indonesia
>
> **Dokumen terkait:** [`ERD.md`](./ERD.md) · [`TRD.md`](./TRD.md) · [`SETUP.md`](./SETUP.md)

---

## 1. Ringkasan Produk

Platform donasi online satu organisasi/brand yang memungkinkan publik menemukan campaign, membaca berita dan perkembangan campaign, berdonasi tanpa wajib membuat akun, melakukan pembayaran melalui Midtrans atau Xendit, serta menerima notifikasi transaksi. Donatur yang masuk menggunakan Google SSO dapat melihat ringkasan dan riwayat donasi serta mengunduh bukti donasi PDF. Admin mengelola campaign, berita, metode pembayaran, transaksi, donatur, template notifikasi, log, dan konfigurasi brand.

Produk dibangun sebagai **single-organization platform** untuk hackathon. Arsitektur tidak dibuat multi-tenant pada MVP. Brand name, logo, warna, dan identitas organisasi belum dipilih; karena itu semuanya harus dapat dikonfigurasi dari panel admin tanpa mengubah kode.

### 1.1 Tujuan

1. Pengunjung dapat menemukan campaign dan memahami tujuan donasi.
2. Pengunjung dapat menyelesaikan donasi sekali bayar sebagai guest.
3. Sistem dapat menerima status pembayaran dari Midtrans dan Xendit secara aman.
4. Donatur menerima status dan instruksi transaksi melalui email serta WhatsApp jika nomor dan persetujuannya tersedia.
5. Admin dapat mengelola konten dan memantau transaksi dari satu panel.
6. Donatur yang login dapat melihat donasi yang terhubung dengan akun dan mengunduh bukti donasi.
7. Tim dapat membangun, menguji, dan melakukan demo dalam satu hari dengan mode sandbox.

### 1.2 Bukan tujuan MVP

- Donasi recurring/subscription.
- Pencairan dana/disbursement ke rekening penerima campaign.
- Multi-organisasi atau marketplace campaign creator.
- KYC penerima dana atau verifikasi legal organisasi.
- Refund otomatis end-to-end.
- Mobile native app.
- CMS/media library kompleks.
- Integrasi akuntansi, pajak, atau kuitansi yang menyatakan donasi dapat menjadi pengurang pajak.
- Social login selain Google.

## 2. Asumsi dan Keputusan Produk

| Topik | Keputusan MVP |
|---|---|
| Model produk | Platform donasi satu organisasi/brand |
| Identitas | Belum ditentukan; nama, logo, tagline, warna, kontak dikelola melalui Brand Config |
| Campaign amount mode | `OPEN_AMOUNT` = nominal bebas; `CLOSED_AMOUNT` = pilih salah satu preset nominal |
| Penutupan campaign | Kombinasi target tercapai, tanggal akhir, dan tindakan admin |
| Guest checkout | Diizinkan; login tidak diwajibkan sebelum donasi |
| Data checkout | Nama, email, nomor WhatsApp, nominal, pesan/doa opsional, anonim, persetujuan WhatsApp |
| Payment | Midtrans dan Xendit, sekali bayar; gateway dan channel dipilih berdasarkan konfigurasi admin |
| Admin access | Role-based access control (RBAC) dengan Super Admin, Campaign Admin, Finance Admin, Content Admin |
| Auth donatur | Google SSO via Auth.js |
| Email | Nodemailer melalui Gmail SMTP/OAuth2 untuk demo; provider email transactional khusus dapat menggantikan Gmail setelah MVP |
| WhatsApp | Fonnte; kirim hanya jika nomor valid dan donatur memberi consent |
| Database | Neon PostgreSQL + Drizzle ORM |
| Cache/rate limit | Upstash Redis |
| Background jobs/cron | Upstash QStash |
| Deployment | Vercel + GitHub |
| MVP payment mode | Sandbox/test mode; production diaktifkan setelah credential, webhook, domain, dan pengujian tervalidasi |
| Batas pengerjaan | Satu hari; fitur ditandai P0/P1/P2 agar scope dapat dipotong secara sadar |

## 3. Pengguna dan Persona

### 3.1 Pengunjung / Calon Donatur

- Mengunjungi homepage atau tautan campaign.
- Membaca tujuan, target, progres, dan update campaign.
- Memilih nominal dan membayar sebagai guest.
- Tidak perlu membuat akun.

### 3.2 Donatur Terdaftar

- Login menggunakan Google.
- Melihat ringkasan donasi dan daftar transaksi.
- Membuka detail donasi dan mengunduh bukti donasi PDF.
- Donasi guest sebelumnya dapat dihubungkan ke akun setelah login menggunakan email Google yang terverifikasi dan cocok dengan email donasi.

### 3.3 Super Admin

- Memiliki akses penuh.
- Mengelola pengguna admin, role, brand configuration, payment provider, campaign, berita, transaksi, donatur, template, dan log.

### 3.4 Campaign Admin

- Membuat dan mengelola campaign.
- Melihat donasi dan progres campaign.
- Tidak dapat mengubah credential gateway atau mengubah status pembayaran secara manual.

### 3.5 Finance Admin

- Melihat transaksi dan detail pembayaran.
- Melihat payment logs dan webhook events.
- Melakukan tindakan operasional terbatas yang tercatat di audit log.
- Tidak boleh menandai transaksi sebagai paid hanya melalui edit manual tanpa rekonsiliasi gateway.

### 3.6 Content Admin

- Mengelola berita umum dan berita/update yang terhubung ke campaign.
- Mengelola draft, publish, dan unpublish konten.

## 4. Sitemap dan Daftar Halaman

### 4.1 Halaman Publik

| Route | Halaman | Tujuan | Kriteria utama |
|---|---|---|---|
| `/` | Home | Memperkenalkan platform dan menampilkan campaign pilihan/aktif serta berita terbaru | Responsif, CTA donasi jelas, campaign berstatus publik saja |
| `/campaigns/[slug]` | Detail campaign | Menampilkan tujuan, target, progres, deskripsi, update, dan CTA donasi | Slug unik; campaign tidak publik tidak bisa diakses publik |
| `/news` | Daftar berita (disarankan) | Menelusuri berita umum dan update | Filter/pagination sederhana |
| `/news/[slug]` | Detail news | Membaca berita atau update campaign | Hanya artikel published |
| `/donate/[slug]` | Checkout form | Mengisi identitas, nominal, pesan, anonim, consent | Validasi server-side; guest checkout |
| `/donate/[slug]/payment` | Select payment | Memilih gateway dan channel aktif | Hanya menampilkan metode yang diaktifkan admin |
| `/payment/[donationCode]` | Payment instruction/status | Menampilkan ringkasan pembayaran, instruksi yang tersedia, tautan checkout provider, status | Tidak menjadikan redirect browser sebagai bukti lunas |
| `/payment/[donationCode]/success` | Success page | Menampilkan konfirmasi setelah backend mencatat pembayaran sukses | Hanya sukses jika status database `SUCCEEDED` |
| `/payment/[donationCode]/pending` | Pending page | Menampilkan transaksi menunggu pembayaran/verifikasi | Menampilkan status dan cara memeriksa ulang |

### 4.2 Autentikasi dan Area Donatur

| Route | Halaman | Tujuan |
|---|---|---|
| `/login` | Donor login | Masuk menggunakan Google SSO |
| `/account` | Donor dashboard | Ringkasan total donasi sukses, jumlah transaksi, transaksi terbaru |
| `/account/transactions` | My transactions | Daftar riwayat donasi milik akun |
| `/account/transactions/[donationCode]` | Donation detail | Detail transaksi dan unduh PDF |
| `/api/receipts/[donationCode]` | PDF endpoint | Menghasilkan bukti donasi PDF setelah otorisasi |

### 4.3 Panel Admin

| Route | Modul | Fungsi MVP |
|---|---|---|
| `/admin` | Dashboard | Ringkasan jumlah campaign aktif, donasi berhasil, nilai donasi sukses, transaksi pending |
| `/admin/campaigns` | Campaign management | CRUD campaign, status, target, amount mode, preset amount, jadwal |
| `/admin/campaigns/[id]` | Campaign editor | Edit konten, amount mode, target, tanggal, publish/pause/close, news terkait |
| `/admin/news` | News management | CRUD artikel/berita/update campaign |
| `/admin/payment-methods` | Payment method management | Aktif/nonaktif provider dan channel, label, instruksi bantuan |
| `/admin/transactions` | Transactions | Filter dan lihat transaksi, status, gateway, nominal, campaign |
| `/admin/donors` | Donors | Cari donatur, detail kontak, riwayat donasi |
| `/admin/notification-templates` | Notification templates | Mengedit subject/body dan placeholder template |
| `/admin/notification-logs` | Notification logs | Melihat email/WhatsApp sent/failed dan error |
| `/admin/payment-logs` | Payment logs | Melihat webhook/provider event dan hasil pemrosesan |
| `/admin/brand` | Brand config | Nama brand, logo URL, tagline, warna, kontak, social links |
| `/admin/users` | Admin users (Super Admin) | Menetapkan role admin dan mencabut akses |

## 5. Functional Requirements

Prioritas:
- **P0:** wajib hidup agar alur demo utama berjalan.
- **P1:** penting, boleh diselesaikan setelah happy path stabil.
- **P2:** peningkatan setelah hackathon.

### 5.1 Homepage

- P0: Menampilkan brand name, tagline, navigasi, CTA, campaign unggulan, campaign aktif, berita terbaru.
- P0: Campaign card menampilkan cover, judul, ringkasan, target, terkumpul, dan progres.
- P0: Hanya campaign `PUBLISHED` dan masih terbuka untuk donasi yang boleh muncul sebagai campaign aktif.
- P1: Search/filter kategori, sorting, pagination.
- P1: Section transparansi dan FAQ.
- P2: Campaign recommendation/personalization.

### 5.2 Campaign Management

Campaign wajib memiliki title, slug, summary, description, target amount, amount mode, status, start date, end date, cover image URL, dan creator.

`amount_mode`:
- `OPEN_AMOUNT`: calon donatur memasukkan angka sendiri. Sistem melakukan validasi nominal minimum dan maksimum yang dikonfigurasi.
- `CLOSED_AMOUNT`: calon donatur wajib memilih satu nominal dari `campaign_amount_options`. Nilai harus cocok persis dengan opsi aktif; client tidak boleh mengirim angka bebas.

Aturan lifecycle:
1. `DRAFT` tidak terlihat publik.
2. Admin dapat publish setelah data wajib lengkap.
3. Campaign `PUBLISHED` dapat di-pause oleh admin. Campaign `PAUSED` tidak menerima donasi baru.
4. Jika `auto_close_on_target = true` dan jumlah donasi sukses mencapai target, campaign berubah ke `COMPLETED` dengan `close_reason = TARGET_REACHED`.
5. Jika `end_at` tercapai, campaign berubah ke `COMPLETED` dengan `close_reason = END_DATE`.
6. Admin dapat menutup manual kapan saja dengan `status = CLOSED` dan `close_reason = MANUAL`.
7. Penutupan tidak menghapus riwayat campaign atau donasi. Pembayaran yang sudah dibuat sebelum penutupan tetap diproses; webhook tetap diterima.
8. Jika campaign sudah `COMPLETED` atau `CLOSED`, checkout baru ditolak. Donasi pending yang sudah dibuat ditangani sesuai expiry provider dan kebijakan operasional.
9. Target adalah nominal agregat donasi berhasil (`SUCCEEDED`), bukan nominal transaksi pending.

### 5.3 Campaign News / News

- P0: Admin dapat membuat berita dengan title, slug, excerpt, body Markdown, cover image URL, status, dan optional `campaign_id`.
- Jika `campaign_id` diisi, berita tampil sebagai update pada detail campaign.
- Jika `campaign_id` kosong, berita adalah berita umum.
- Hanya `PUBLISHED` yang dapat diakses publik.
- P1: jadwal publish (`scheduled_at`), kategori, author, dan revisi.

### 5.4 Checkout Form

Field:
- Nama donatur: wajib.
- Email: wajib dan divalidasi.
- Nomor WhatsApp: wajib untuk kebutuhan komunikasi transaksi; format dinormalisasi ke E.164/format internasional.
- Nominal: mengikuti amount mode campaign.
- Pesan/doa: opsional, batas panjang yang dikonfigurasi.
- Donasi anonim: boolean.
- Consent WhatsApp: checkbox eksplisit; default false.

Acceptance criteria:
- Donasi dapat dibuat tanpa sesi login.
- Server memuat ulang campaign dan memvalidasi status, tanggal, mode, nominal, dan preset dari database.
- Nominal IDR disimpan sebagai integer/bigint tanpa floating point.
- Checkout menghasilkan `donation_code` unik dan status awal `PENDING`.
- Form tidak menerima payment status, provider transaction ID, atau field internal dari browser sebagai sumber kebenaran.
- CAPTCHA dapat ditambahkan jika terjadi spam; untuk MVP gunakan rate limit per IP/email.

### 5.5 Pilihan Pembayaran

- Provider: Midtrans dan Xendit.
- Transaksi sekali bayar (`PAY`), tidak menyimpan payment token untuk recurring.
- Admin dapat mengaktifkan/nonaktifkan provider dan channel yang tersedia.
- Donatur memilih provider dan payment channel yang masih aktif.
- Channel yang tidak didukung pada gateway terpilih tidak ditampilkan.
- Sistem menampilkan biaya tambahan hanya jika benar-benar diterapkan dan telah dikonfigurasi secara eksplisit. Default MVP: platform tidak menambahkan biaya admin; jumlah yang dibayar sama dengan nominal donasi.
- Gateway credentials tidak pernah disimpan di tabel konfigurasi atau dikirim ke browser.

Catatan pengalaman pengguna: Midtrans Snap dan Xendit dapat meng-host langkah pembayaran. Halaman internal `/payment/[donationCode]` menjadi halaman pengantar/status yang menampilkan detail, instruksi yang tersedia dari provider, dan tombol `Lanjutkan pembayaran`. Instruksi final provider tetap menjadi sumber otoritatif.

### 5.6 Status Pembayaran

Status internal donasi:
- `PENDING`
- `SUCCEEDED`
- `FAILED`
- `EXPIRED`
- `CANCELLED`
- `REFUNDED`

Ketentuan:
- Redirect success dari browser tidak cukup untuk mengubah transaksi menjadi `SUCCEEDED`.
- Status `SUCCEEDED` hanya berasal dari webhook tervalidasi atau server-to-server status verification provider.
- Webhook wajib idempotent.
- Transisi status tidak boleh membuat transaksi `SUCCEEDED` kembali ke `PENDING` akibat webhook lama/duplikat.
- Ketika menjadi `SUCCEEDED`, agregat campaign diperbarui satu kali saja.
- Ketika menjadi `SUCCEEDED`, cache campaign di-invalidate dan event notifikasi dibuat.
- Payment logs dan webhook event disimpan untuk audit.

### 5.7 Payment Instruction / Pending / Success

- Payment instruction menampilkan donation code, campaign, amount, gateway, selected channel, expiry bila tersedia, dan status terkini.
- Jika provider memberikan VA number/QR/redirect URL/instruksi khusus, tampilkan sesuai data yang dinormalisasi oleh adapter.
- Jika provider-hosted checkout menjadi cara pembayaran, tampilkan tombol untuk melanjutkan ke URL provider.
- Tampilkan tombol cek status yang membaca backend.
- Halaman pending memberi tahu bahwa pembayaran belum dikonfirmasi.
- Success hanya tampil setelah DB mencatat pembayaran berhasil.
- Expired/failed memiliki CTA untuk membuat donasi baru; transaksi lama tidak diubah menjadi transaksi baru.

### 5.8 Notifications

Events wajib:

| Event | Email | WhatsApp |
|---|---:|---:|
| Donasi dibuat / instruksi pembayaran | Ya | Ya jika consent true |
| Pembayaran berhasil | Ya | Ya jika consent true |
| Pembayaran kedaluwarsa/gagal | Ya | Opsional, default off |

- Template dapat diedit oleh admin.
- Placeholder yang didukung dibatasi dan divalidasi, misalnya `{{donor_name}}`, `{{donation_code}}`, `{{campaign_title}}`, `{{amount}}`, `{{payment_url}}`, `{{receipt_url}}`.
- Template harus di-render server-side dan di-escape sesuai konteks HTML/text.
- Pengiriman asynchronous melalui QStash; kegagalan disimpan dalam notification log.
- Retry hanya untuk error sementara; jangan retry nomor invalid atau email invalid tanpa batas.
- Notifikasi tidak boleh menahan response webhook pembayaran.

### 5.9 Donor Login dan Dashboard

- Google SSO via Auth.js.
- Donatur tidak perlu membuat password lokal.
- Email dari Google harus terverifikasi sebelum digunakan untuk menghubungkan transaksi guest.
- Setelah login, server boleh menghubungkan donor record dengan user hanya melalui email terverifikasi yang dinormalisasi dan cocok.
- Dashboard hanya menampilkan transaksi yang dimiliki/terhubung dengan donor terkait.
- Donatur dapat melihat total donasi sukses, jumlah donasi sukses, transaksi terakhir, status, campaign, tanggal, dan nominal.
- Donatur dapat mengunduh bukti donasi PDF untuk transaksi miliknya yang sukses.
- Akses receipt menggunakan authorization server-side; mengetahui `donation_code` saja tidak cukup.

### 5.10 Panel Admin

- Semua route admin wajib menggunakan server-side auth dan permission check.
- Role:
  - `SUPER_ADMIN`: semua hak akses, termasuk role dan brand/payment config.
  - `CAMPAIGN_ADMIN`: campaign CRUD, campaign status, campaign update.
  - `FINANCE_ADMIN`: transaksi, donor lookup, payment logs, notification logs; tidak dapat mengubah paid status tanpa verifikasi provider.
  - `CONTENT_ADMIN`: news CRUD dan publish.
- Admin actions penting dicatat ke `audit_logs`.
- Pengelolaan status pembayaran manual hanya berupa anotasi/operational action; tidak boleh mengubah pembayaran pending menjadi sukses tanpa status resmi gateway.
- Payment methods menyimpan konfigurasi publik seperti nama, channel code, enabled, sort order, dan petunjuk tambahan. Secret key berada di environment variables.

### 5.11 Brand Config

Data yang dapat dikelola:
- Nama platform/organisasi.
- Tagline/description.
- Logo URL.
- Favicon URL.
- Primary, secondary, accent, background color.
- Email, nomor WhatsApp, alamat/keterangan organisasi.
- Website dan social media URLs.
- Footer text/copyright.
- Default campaign CTA label.

Belum ada keputusan identitas visual. Default awal hanya placeholder netral; jangan mengunci brand identity atau logo dalam kode.

### 5.12 PDF Receipt

- Judul dokumen: **Bukti Donasi** (bukan kuitansi pajak).
- Memuat nama brand, donation code, tanggal paid, campaign, nominal, nama donatur atau `Donatur Anonim`, status `LUNAS`, dan kontak platform.
- PDF hanya dibuat untuk transaksi sukses.
- Nama file: `bukti-donasi-{donationCode}.pdf`.
- Endpoint memverifikasi ownership donor atau akses admin sesuai role.

## 6. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Security | Secret hanya server-side; webhook signature/token verification; RBAC; rate limit; input validation |
| Reliability | Idempotent webhook; persist event sebelum/selama processing; retry job; audit trail |
| Performance | Home dan campaign detail cache singkat; pagination untuk tabel admin; image size terkontrol |
| Accessibility | Form label jelas, keyboard navigation, contrast memadai, status tidak hanya dibedakan dengan warna |
| Responsive | Mobile-first karena mayoritas donatur kemungkinan mengakses dari ponsel |
| Localization | Bahasa Indonesia; timezone tampilan `Asia/Jakarta`; database timestamps UTC |
| Privacy | Tampilkan privacy notice; minimalkan data; consent WA; jangan expose data donatur ke publik |
| Maintainability | Payment adapter, notification adapter, validation schema, dan domain service dipisah |
| Observability | Structured logs, payment logs, notification logs, audit logs, error tracking |

## 7. Prioritas Implementasi Satu Hari

Estimasi ini adalah rencana tim kecil yang fokus dan menggunakan sandbox, bukan jaminan bahwa semua integrasi siap production. Credential provider, OAuth consent, domain publik, dan webhook harus tersedia sebelum mulai.

| Urutan | Pekerjaan | Prioritas | Definition of Done |
|---:|---|---|---|
| 1 | Repo, Next.js, UI shell, Neon, Drizzle | P0 | App jalan lokal dan deploy preview |
| 2 | Schema, seed, Auth.js Google, RBAC | P0 | Admin dan donor dapat login; protected routes berfungsi |
| 3 | Home, campaign detail, news detail | P0 | Data campaign/news tampil dari DB |
| 4 | Admin campaign/news/payment config | P0 | Admin dapat membuat campaign dan mengaktifkan gateway/channel |
| 5 | Guest checkout + donation creation | P0 | Donation tersimpan dan tervalidasi server-side |
| 6 | Payment adapter Midtrans + Xendit sandbox | P0* | Provider yang credential-nya tersedia dapat membuat checkout; minimal satu gateway end-to-end wajib berhasil |
| 7 | Webhook + status reconciliation | P0 | Verified webhook mengubah status satu kali; duplicate webhook aman |
| 8 | Pending/success + donor transaction list | P0 | Status tampil dari database, bukan query string |
| 9 | Email/WhatsApp notification | P1 | Job queued dan log tercatat; minimal email happy path diuji |
| 10 | PDF receipt | P1 | PDF dapat diunduh untuk transaksi sukses |
| 11 | Admin donor/logs/brand full CRUD | P1 | Modul operasional tersedia |
| 12 | Hardening, QA, go-live | P0 | Smoke test dan checklist diselesaikan |

`P0*`: Arsitektur kedua gateway harus tersedia. Implementasi penuh kedua provider pada satu hari bergantung pada kesiapan akses sandbox, channel, dan waktu debugging. Jangan menampilkan gateway sebagai aktif jika credential atau webhook belum tervalidasi.

### 7.1 Saran pembagian waktu

| Waktu | Fokus |
|---|---|
| 00:00–00:45 | Repo, env, deploy skeleton, database |
| 00:45–02:00 | Schema, seed admin, auth dan role |
| 02:00–03:30 | Public pages dan campaign/news |
| 03:30–05:00 | Admin CRUD minimum |
| 05:00–06:30 | Checkout dan donation persistence |
| 06:30–08:00 | Midtrans dan/atau Xendit sandbox + webhook |
| 08:00–09:00 | Pending/success, donor history, receipt minimum |
| 09:00–10:00 | Email/WhatsApp queue, Redis, QStash |
| 10:00–11:00 | QA, security check, deploy, demo rehearsal |

Jika waktu benar-benar hanya 8 jam, tunda PDF, dashboard analytics detail, bulk management, dan social content generator; jangan mengorbankan webhook verification atau payment idempotency.

## 8. Acceptance Criteria End-to-End

### AC-01: Guest donation dengan open amount

1. Admin mem-publish campaign `OPEN_AMOUNT`.
2. Pengunjung membuka detail campaign dan memasukkan nominal valid.
3. Pengunjung mengisi nama, email, nomor WA, consent, dan optional note.
4. Sistem membuat satu donation code dan payment intent.
5. Pengunjung diarahkan ke checkout provider.
6. Sebelum webhook sukses, halaman tetap pending.
7. Webhook valid diterima; donation berubah menjadi `SUCCEEDED`.
8. Campaign progress bertambah satu kali.
9. Notifikasi payment success dijadwalkan.

### AC-02: Guest donation dengan closed amount

1. Campaign memiliki beberapa preset aktif.
2. Pengunjung hanya dapat memilih salah satu preset.
3. Request nominal di luar preset ditolak di server.

### AC-03: Campaign closure

- Target tercapai: campaign auto-complete jika flag aktif.
- End date lewat: campaign auto-complete pada job lifecycle.
- Admin close: campaign langsung tidak menerima checkout baru.

### AC-04: Donor account

1. Guest donation menggunakan email `A`.
2. Pengguna login dengan Google account email `A` yang terverifikasi.
3. Donor record terhubung dengan user.
4. Transaksi yang sesuai tampil di akun.
5. PDF transaksi sukses dapat diunduh oleh pemilik akun.

### AC-05: Webhook safety

- Invalid signature/token ditolak.
- Duplicate webhook tidak menggandakan amount/progress/notification.
- Webhook dengan status lama tidak menurunkan transaksi sukses ke pending.
- Event dan outcome tercatat.

## 9. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Gateway sandbox/production credential belum siap | Demo pembayaran tertahan | Validasi credentials di awal; jangan aktifkan provider yang belum dites |
| Webhook tidak dapat menjangkau localhost | Status tidak berubah | Deploy preview publik atau gunakan tunnel; uji HTTPS endpoint |
| Gmail SMTP diblokir/quota | Email tidak terkirim | Simpan notification log; retry terkontrol; siapkan adapter email alternatif |
| Fonnte device belum terhubung | WA gagal | Jadikan WA best effort; email tetap jalur utama |
| OAuth consent belum diset | Login gagal | Setup redirect URI dan test user sebelum coding auth |
| Scope terlalu besar untuk satu hari | MVP tidak selesai | Prioritaskan happy path dan tandai P1/P2 |
| Status pembayaran palsu dari browser | Donasi palsu | Hanya webhook/status API yang terverifikasi dapat menandai sukses |
| Donatur anonim bocor | Pelanggaran privasi | UI publik hanya menampilkan nama anonim; data kontak hanya admin berizin |

## 10. Definition of Done MVP

- [ ] Repository dan deploy preview tersedia.
- [ ] Database migration berhasil.
- [ ] Public home, campaign detail, news detail berjalan.
- [ ] Campaign `OPEN_AMOUNT` dan `CLOSED_AMOUNT` berjalan.
- [ ] Guest checkout bekerja.
- [ ] Minimal satu gateway sukses end-to-end di sandbox; adapter gateway kedua terpasang atau ditandai belum aktif secara eksplisit.
- [ ] Webhook signature/token tervalidasi dan idempotent.
- [ ] Pending dan success mengikuti status database.
- [ ] Google SSO dan RBAC berjalan.
- [ ] Admin dapat mengelola campaign/news dan payment method config.
- [ ] Email/WhatsApp failure tidak merusak status pembayaran.
- [ ] Donatur dapat melihat transaksi yang terhubung dengan email terverifikasi.
- [ ] Tidak ada secret di Git, browser bundle, atau database settings.
- [ ] Smoke test dan demo script berhasil.

## 11. Keputusan yang Masih Terbuka

Hal ini tidak menghalangi pembuatan MVP; gunakan default sementara sampai pemilik produk menetapkan nilai final:

1. Nama brand, logo, tagline, warna, dan social handles.
2. Nama legal organisasi, alamat, kontak, dan informasi footer.
3. Minimum/maximum donation amount per campaign.
4. Apakah target tercapai selalu menutup campaign atau ada campaign yang tetap menerima donasi lebih dari target (`auto_close_on_target`). Default: true.
5. Channel pembayaran mana yang diaktifkan untuk tiap gateway, tergantung akun merchant dan hasil pengujian.
6. Kebijakan expiry pembayaran pending dan apakah notifikasi expiry melalui WhatsApp aktif.
7. Retensi log, kebijakan privasi final, syarat layanan, dan proses refund.
8. Storage upload gambar. MVP memakai URL gambar; fase berikutnya pilih Cloudinary/Vercel Blob atau storage yang disetujui.

---

## 12. Dokumen Eksekusi Lanjutan

- Skema dan relasi: [`ERD.md`](./ERD.md)
- Arsitektur, endpoint, security, jobs: [`TRD.md`](./TRD.md)
- Langkah instalasi dan setup seluruh layanan: [`SETUP.md`](./SETUP.md)
- Instruksi coding agent: [`CLAUDE.md`](./CLAUDE.md)
- Paket prompt marketing: [`PUBLISHING-PROMPTS.md`](./PUBLISHING-PROMPTS.md)
