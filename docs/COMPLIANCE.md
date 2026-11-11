# Kepatuhan, privasi, dan aksesibilitas

> **Penting:** halaman legal (Syarat, Privasi, Pengembalian Dana, Cookie) adalah **draf teknis** yang menjelaskan perilaku sistem
> sebenarnya. Teks hukumnya **belum ditinjau penasihat hukum**. Tinjau sebelum menerima donasi sungguhan, terutama:
> dasar hukum pemrosesan, masa retensi, kebijakan refund (keputusan organisasi), dan identitas badan hukum (diisi di Admin → Brand).

Versi teks yang disetujui donatur dicatat per donasi (`donations.consent_version`, `terms_accepted_at`). Ubah `CONSENT_VERSION`
di `src/lib/consent.ts` setiap kali halaman legal berubah material.

## 1. Inventaris data & minimalisasi (UU PDP)
| Data | Disimpan di | Wajib | Catatan minimalisasi |
|---|---|---|---|
| Nama | donors, donations | Ya | Dapat ditampilkan "anonim" ke publik |
| Email | donors, donations | Ya | Untuk instruksi/bukti pembayaran |
| Nomor WhatsApp | donors, donations | **Tidak** | Hanya diminta & disimpan jika donatur memilih WhatsApp |
| Pesan/doa | donations | Tidak | |
| Bukti persetujuan (versi, waktu, usia) | donations | Ya | **Tanpa alamat IP** |
| Profil Google (nama, email, foto) | users | Tidak | Login opsional |
| Detail kartu/akun bayar | — | — | Tidak pernah menyentuh server kita |
| Log audit admin | audit_logs | — | `ip_hash` tidak diisi |

Rate-limit memakai hash pengenal (bukan IP/email mentah) di Redis dengan TTL pendek.

## 2. Persetujuan & usia
- Formulir donasi: dua centang **wajib & tidak terpilih default** (usia ≥18 atau persetujuan wali; Syarat+Privasi). Server menolak jika tidak `true` (Zod `z.literal(true)`).
- Opt-in WhatsApp terpisah, tidak terpilih default; kolom nomor muncul hanya jika dicentang.
- Donasi anonim: opsi, tidak terpilih default.
- Cookie: banner dengan dua tombol setara ("Hanya yang diperlukan" / "Terima preferensi"); cookie preferensi (tema) hanya ke `localStorage` bila disetujui, jika tidak ke `sessionStorage`. Pilihan kedaluwarsa 12 bulan; dapat dibuka lagi dari footer.

## 3. Hak subjek data & retensi
- **Akses/portabilitas:** `/account/privacy` → unduh JSON (`/api/account/export`).
- **Penghapusan:** `/account/privacy` (mandiri; mengetik HAPUS) atau `/permintaan-data` (tamu → tinjauan admin di `/admin/data-requests`).
  Penghapusan = **anonimisasi**: nama/email/WA/pesan diganti penanda, payload webhook dibuang, akun login dihapus. Baris transaksi (nominal, status, tanggal, kode) tetap karena kewajiban pencatatan keuangan.
  Super Admin terakhir tidak dapat menghapus dirinya.
- **Berhenti berlangganan:** setiap email & WhatsApp memuat tautan; email memuat header `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058, endpoint POST `/api/unsubscribe`). GET tidak mengubah status. Setelah opt-out hanya **bukti transaksi** (pembayaran berhasil) yang tetap dikirim.
- **Retensi:** transaksi ≈10 tahun (pencatatan keuangan); identitas sampai dihapus. *Konfirmasi dengan penasihat hukum/pajak.*

## 4. Audit SDK / pihak ketiga
| Pihak ketiga | Dimuat di browser? | Data yang dikirim | Catatan |
|---|---|---|---|
| Midtrans / Xendit | Hanya saat donatur dialihkan ke halaman mereka (navigasi, bukan SDK) | Nama, email, nominal, referensi | Adapter HTTP server-side; tidak memakai `midtrans-client`/`xendit-node` maupun Snap.js |
| Google OAuth | Hanya saat login (navigasi) | Profil Google | Scope `openid email profile` |
| Vercel (hosting), Neon (DB), Upstash (Redis/QStash) | Tidak | Server-side | |
| Gmail SMTP / Resend, Fonnte | Tidak | Server-side: email/WA | WA hanya dengan consent |
| Analitik/iklan/pixel/chat/font eksternal | **Tidak ada** | — | Font sistem. Diverifikasi: HTML & seluruh JS klien tidak berisi host eksternal |
| Foto landing | Self-hosted (`/public/images`) | — | Domain publik/CC0 (`docs/IMAGE-CREDITS.md`) |

Penjaga teknis: CSP produksi (`next.config.ts`) hanya mengizinkan `'self'` untuk script/font/connect; `img-src` mengizinkan https agar gambar sampul admin dapat tampil.
Menambah SDK pihak ketiga = perbarui tabel ini, Kebijakan Privasi, dan Kebijakan Cookie, lalu minta persetujuan sebelum dimuat.

## 5. Audit dark pattern
| Pola | Status |
|---|---|
| Checkbox terpilih otomatis | Tidak ada (semua default tidak dicentang) |
| Menolak lebih sulit dari menerima (cookie) | Tidak: dua tombol identik |
| Urgensi/kelangkaan palsu, hitung mundur palsu | Tidak ada. Satu-satunya hitung mundur adalah batas bayar nyata dari penyedia |
| Rasa bersalah / confirmshaming | Tidak ada |
| Biaya tersembunyi / tip default | Tidak ada; total = nominal; ditampilkan di formulir, halaman pembayaran, dan footer |
| Metode pembayaran terpilih default | Tidak |
| Berlangganan tersembunyi / sulit berhenti | Tidak ada langganan; berhenti pesan 1 klik |
| Ulasan/testimoni/angka dampak palsu | Tidak ada; statistik dari database, campaign contoh berlabel DEMO dan dikecualikan dari statistik |
| Hapus akun disulitkan | Self-service; satu konfirmasi |

## 6. Aksesibilitas (target WCAG 2.2 AA)
- axe-core (wcag2a/aa, 2.1, 2.2 AA, best-practice) pada build produksi, mode terang & gelap: **0 pelanggaran** pada `/`, `/campaigns/[slug]`, `/donate/[slug]`, `/privacy`, `/login` (terang), `/privacy`, `/donate/[slug]` (gelap). `axe-core` ada di devDependencies untuk dijalankan ulang.
- Lewati-ke-konten, landmark, breadcrumb + tombol kembali, fokus terlihat, menu seluler tertutup dengan Esc, banner cookie dapat difokus dan ditutup Esc (saat dibuka ulang).
- Teks alt: field `cover_image_alt` untuk campaign & berita (fallback otomatis); gambar dekoratif `alt=""`; logo beralt nama brand.
- `prefers-reduced-motion` dihormati; tema mengikuti perangkat.
- Tombol submit dinonaktifkan saat memproses (`SubmitButton`, ref-guard di form klien) + idempotency di server.
- Pernyataan: `/aksesibilitas`. **Belum diuji dengan pembaca layar sungguhan** (VoiceOver/NVDA) — lakukan sebelum go-live.

## 7. Audit dependensi
- `npm audit --omit=dev`: **0 kerentanan** (nodemailer dinaikkan ke 10.x lewat `overrides`).
- `npm audit` penuh: sisa temuan ada di alat pengembangan (vitest/tinypool, drizzle-kit/esbuild) dan tidak ikut build produksi. Pembaruan vitest mayor ditunda (konflik instalasi npm); jangan menjalankan server uji dari sumber tidak tepercaya.

## 8. Daftar tindakan yang masih terbuka
- Tinjauan hukum atas empat halaman legal; keputusan kebijakan refund.
- Isi Admin → Brand: nama badan hukum, bentuk, nomor pengesahan, NPWP, alamat, email kontak & privasi.
- Penunjukan penanggung jawab pelindungan data / prosedur insiden (UU PDP) di organisasi.
- Uji pembaca layar & audit kontras manual pada halaman admin.
