# Bukti Pengujian Produksi (Sandbox)

Diuji pada 11 November 2026 di `https://donasibisa.vercel.app` dengan gateway **sandbox** (Midtrans). Screenshot ada di [`docs/evidence/`](evidence/).

| # | Requirement | Hasil |
|---|-------------|-------|
| 1 | Checkout sampai PAID lewat simulator, notifikasi terkirim, jumlah terkumpul & donatur berubah | Terbukti (notifikasi: lihat catatan) |
| 2 | Tampilkan/sembunyikan metode pembayaran | Terbukti |
| 3 | Edit konten campaign | Terbukti (konten dikembalikan ke aslinya) |
| 4 | Donatur login, unduh bukti transaksi | Terbukti |

## 1. Checkout sampai paid

Campaign: *Posyandu Keliling & Gizi Seimbang untuk Balita* (DEMO). Donasi `DON-98CB3K5ERZQP`, Rp 25.000, BCA Virtual Account via Midtrans sandbox.

| Langkah | Screenshot |
|---|---|
| Sebelum: Rp 22.400.000, 0 donatur | `1-00-campaign-0-donatur.png`, `1-01-campaign-sebelum.png` |
| Form donasi dengan persetujuan syarat/privasi | `1-02-form-donasi-persetujuan.png` |
| Pilih metode (6 aktif, tanpa biaya tambahan) | `1-03-pilih-metode-6-aktif.png` |
| Halaman Midtrans Snap (BCA VA) | `1-04-midtrans-snap-bca-va.png` |
| Midtrans Payment Simulator: inquiry, lalu Pay | `1-05-simulator-inquiry.png`, `1-06-simulator-sukses.png` |
| Status donasi berubah "Berhasil" | `1-07-status-berhasil.png` |
| Sesudah: Rp 22.425.000, 1 donatur | `1-08-campaign-sesudah.png` |

Perubahan: terkumpul **+Rp 25.000** (22.400.000 → 22.425.000), donatur **0 → 1**. Webhook Midtrans diproses (status PROCESSED) dan settlement hanya menambah `raised_amount` sekali.

Catatan notifikasi: pengiriman email (SMTP) dan WhatsApp (Fonnte) lewat QStash sudah terverifikasi pada pengujian sebelumnya (log berstatus SENT). Untuk donasi ini, status tiap kanal bisa dilihat di Admin → Log notifikasi; tidak ada screenshot khusus untuk itu.

![1-00-campaign-0-donatur](evidence/1-00-campaign-0-donatur.png)

![1-01-campaign-sebelum](evidence/1-01-campaign-sebelum.png)

![1-02-form-donasi-persetujuan](evidence/1-02-form-donasi-persetujuan.png)

![1-03-pilih-metode-6-aktif](evidence/1-03-pilih-metode-6-aktif.png)

![1-04-midtrans-snap-bca-va](evidence/1-04-midtrans-snap-bca-va.png)

![1-05-simulator-inquiry](evidence/1-05-simulator-inquiry.png)

![1-06-simulator-sukses](evidence/1-06-simulator-sukses.png)

![1-07-status-berhasil](evidence/1-07-status-berhasil.png)

![1-08-campaign-sesudah](evidence/1-08-campaign-sesudah.png)

## 2. Tampilkan / sembunyikan metode pembayaran

1. Admin → Metode pembayaran, semua channel aktif: `2-01-admin-semua-aktif.png`.
2. Nonaktifkan GoPay (Midtrans), muncul "Tersimpan.": `2-02-admin-gopay-dinonaktifkan.png`.
3. Halaman pilih metode donatur kini 5 metode, GoPay hilang: `2-03-checkout-gopay-tersembunyi-5-metode.png`.
4. Aktifkan lagi, 6 metode kembali: `2-04-checkout-gopay-muncul-lagi-6-metode.png`.

![2-01-admin-semua-aktif](evidence/2-01-admin-semua-aktif.png)

![2-02-admin-gopay-dinonaktifkan](evidence/2-02-admin-gopay-dinonaktifkan.png)

![2-03-checkout-gopay-tersembunyi-5-metode](evidence/2-03-checkout-gopay-tersembunyi-5-metode.png)

![2-04-checkout-gopay-muncul-lagi-6-metode](evidence/2-04-checkout-gopay-muncul-lagi-6-metode.png)

## 3. Edit konten campaign

1. Editor admin sebelum diubah: `3-00-admin-editor-sebelum.png`.
2. Ringkasan diberi akhiran "(Diperbarui lewat admin untuk pembuktian.)" dan deskripsi diberi bagian "Update dari admin"; tersimpan: `3-01-admin-edit-tersimpan.png`.
3. Halaman publik langsung menampilkan perubahan (cache diinvalidasi): `3-02-publik-menampilkan-edit.png`.
4. Teks dikembalikan ke aslinya; halaman publik dicek ulang, ringkasan kembali semula dan bagian "Update dari admin" hilang.

![3-00-admin-editor-sebelum](evidence/3-00-admin-editor-sebelum.png)

![3-01-admin-edit-tersimpan](evidence/3-01-admin-edit-tersimpan.png)

![3-02-publik-menampilkan-edit](evidence/3-02-publik-menampilkan-edit.png)

## 4. Donatur login dan unduh bukti

Login Google sebagai `alif@cnt.id` (email yang dipakai pada donasi), buka `/account/transactions/DON-98CB3K5ERZQP`: `4-01-detail-donasi-unduh-bukti.png`.

Tombol "Unduh bukti donasi (PDF)" mengarah ke `/api/receipts/DON-98CB3K5ERZQP`. Diperiksa lewat fetch: HTTP 200, `application/pdf`, `attachment; filename="bukti-donasi-DON-98CB3K5ERZQP.pdf"`, 1.500 byte, diawali `%PDF-`. Berkas PDF tidak disimpan di repo, dan isinya belum dirender secara visual.

![4-01-detail-donasi-unduh-bukti](evidence/4-01-detail-donasi-unduh-bukti.png)

## Catatan

- Seluruh pengujian memakai sandbox; tidak ada uang nyata.
- Donasi uji tersisa di produksi dan menaikkan angka beberapa campaign DEMO. Pembersihan menunggu persetujuan.
