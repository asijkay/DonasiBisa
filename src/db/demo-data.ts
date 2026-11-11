/**
 * Realistic-looking DEMO content for presentations. Everything here is fictional and every campaign is
 * stored with is_demo = true (shown with a "DEMO" badge, excluded from public stats, and blocked from
 * receiving donations once live payment keys are configured). Do not present it as a real appeal.
 */
type Cat = "PENDIDIKAN" | "KESEHATAN" | "BENCANA" | "SOSIAL" | "LAINNYA";

export type DemoCampaign = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: Cat;
  amountMode: "OPEN_AMOUNT" | "CLOSED_AMOUNT";
  target: number;
  raised: number;
  status: "PUBLISHED" | "COMPLETED" | "DRAFT";
  featured: boolean;
  cover: string;
  endsInDays: number | null;
  presets?: Array<[number, string]>;
};

const NOTE = "\n\n> **Data contoh.** Campaign ini fiktif dan hanya untuk demonstrasi platform. Tidak ada penerima manfaat nyata dan dana tidak disalurkan.";

export const DEMO_CAMPAIGNS: DemoCampaign[] = [
  {
    slug: "buku-dan-perlengkapan-sekolah-150-anak",
    title: "Buku & Perlengkapan Sekolah untuk 150 Anak Sekolah Dasar",
    summary: "Bantu 150 anak di sekolah dasar daerah terpencil mendapatkan buku tulis, seragam, dan tas agar semangat belajar mereka tidak terhenti.",
    category: "PENDIDIKAN",
    amountMode: "OPEN_AMOUNT",
    target: 45_000_000,
    raised: 31_250_000,
    status: "PUBLISHED",
    featured: true,
    cover: "/images/landing/hero.webp",
    endsInDays: 38,
    description: `## Latar belakang

Di banyak sekolah dasar daerah terpencil, anak-anak harus berbagi buku dan menulis di sisa kertas bekas. Orang tua mereka umumnya petani dan nelayan dengan penghasilan yang tidak menentu, sehingga perlengkapan sekolah menjadi beban besar di awal tahun ajaran.

## Apa yang akan dilakukan

Dana yang terkumpul digunakan untuk membeli dan mengirimkan paket belajar untuk **150 siswa**:

- 12 buku tulis dan 1 set alat tulis per anak
- 2 setel seragam sekolah dan 1 pasang sepatu
- Tas sekolah yang tahan air
- Buku bacaan anak untuk perpustakaan kelas

## Rencana penggunaan dana

| Komponen | Porsi |
|---|---|
| Perlengkapan belajar | 62% |
| Seragam dan sepatu | 25% |
| Pengiriman dan distribusi | 9% |
| Biaya operasional platform | 4% |

## Transparansi

Perkembangan campaign diperbarui pada bagian *Update*. Setiap tahap pembelian dan penyerahan akan didokumentasikan.${NOTE}`,
  },
  {
    slug: "beasiswa-pelatihan-teknisi-siswa-smk",
    title: "Beasiswa Pelatihan Teknisi untuk Siswa SMK Berprestasi",
    summary: "Biaya pelatihan dan sertifikasi dasar bagi siswa SMK dari keluarga kurang mampu agar siap bekerja setelah lulus.",
    category: "PENDIDIKAN",
    amountMode: "CLOSED_AMOUNT",
    target: 60_000_000,
    raised: 18_750_000,
    status: "PUBLISHED",
    featured: true,
    cover: "/images/landing/education.webp",
    endsInDays: 52,
    presets: [[100_000, "Paket Modul"], [250_000, "Paket Praktik"], [500_000, "Paket Sertifikasi"], [1_000_000, "Beasiswa Penuh"]],
    description: `## Mengapa penting

Lulusan SMK dari keluarga kurang mampu sering kesulitan membayar pelatihan tambahan dan ujian sertifikasi, padahal sertifikat itu sering menjadi syarat diterima bekerja.

## Pilihan dukungan

Pilih salah satu paket nominal:

1. **Paket Modul** — modul dan bahan belajar untuk satu siswa
2. **Paket Praktik** — bahan praktik laboratorium selama satu bulan
3. **Paket Sertifikasi** — biaya ujian sertifikasi kompetensi
4. **Beasiswa Penuh** — pelatihan lengkap untuk satu siswa

## Siapa yang dibantu

Siswa kelas XII yang dipilih berdasarkan prestasi dan kebutuhan, melalui seleksi oleh pihak sekolah.${NOTE}`,
  },
  {
    slug: "posyandu-keliling-gizi-balita",
    title: "Posyandu Keliling & Gizi Seimbang untuk Balita",
    summary: "Pemeriksaan tumbuh kembang, makanan tambahan bergizi, dan penyuluhan untuk ibu dan balita di desa yang jauh dari fasilitas kesehatan.",
    category: "KESEHATAN",
    amountMode: "CLOSED_AMOUNT",
    target: 30_000_000,
    raised: 22_400_000,
    status: "PUBLISHED",
    featured: true,
    cover: "/images/landing/health.webp",
    endsInDays: 24,
    presets: [[25_000, "Satu paket makanan tambahan"], [50_000, "Pemeriksaan dua balita"], [100_000, "Satu bulan vitamin"], [250_000, "Satu kali kunjungan"]],
    description: `## Kondisi di lapangan

Sebagian desa berada dua jam perjalanan dari puskesmas terdekat. Akibatnya, penimbangan rutin dan imunisasi balita sering terlewat.

## Program

Tim kader dan tenaga kesehatan akan melakukan **posyandu keliling** setiap bulan:

- Penimbangan dan pengukuran tinggi badan balita
- Makanan tambahan bergizi berbahan pangan lokal
- Pemberian vitamin A dan zat besi sesuai anjuran
- Kelas singkat gizi seimbang untuk ibu

## Hasil yang diharapkan

Balita yang terpantau rutin dan ibu yang lebih paham gizi. Laporan kunjungan akan dipublikasikan pada bagian *Update*.${NOTE}`,
  },
  {
    slug: "bantuan-logistik-warga-terdampak-banjir",
    title: "Bantuan Logistik untuk Warga Terdampak Banjir",
    summary: "Makanan siap saji, air bersih, selimut, dan obat-obatan dasar untuk keluarga yang mengungsi akibat banjir.",
    category: "BENCANA",
    amountMode: "OPEN_AMOUNT",
    target: 75_000_000,
    raised: 58_900_000,
    status: "PUBLISHED",
    featured: true,
    cover: "/images/landing/disaster.webp",
    endsInDays: 14,
    description: `## Situasi

Hujan deras berhari-hari menyebabkan banjir di sejumlah permukiman. Ratusan keluarga mengungsi dan membutuhkan kebutuhan dasar dengan cepat.

## Bantuan yang disalurkan

- Makanan siap saji dan air minum kemasan
- Selimut, tikar, dan pakaian layak pakai
- Perlengkapan bayi dan kebersihan
- Obat-obatan dasar dan masker

## Cara penyaluran

Bantuan dikirim bersama relawan lokal ke posko pengungsian dan dibagikan berdasarkan data kepala keluarga. Dokumentasi penyaluran akan diunggah sebagai update.

Setiap donasi, berapa pun nominalnya, langsung menambah progres campaign.${NOTE}`,
  },
  {
    slug: "air-bersih-dan-sanitasi-sekolah-pesisir",
    title: "Air Bersih & Sanitasi untuk Sekolah di Daerah Pesisir",
    summary: "Membangun fasilitas cuci tangan dan penampungan air bersih agar siswa dapat menjaga kebersihan dan terhindar dari penyakit.",
    category: "SOSIAL",
    amountMode: "OPEN_AMOUNT",
    target: 90_000_000,
    raised: 12_500_000,
    status: "PUBLISHED",
    featured: false,
    cover: "/images/landing/community.webp",
    endsInDays: 75,
    description: `## Masalahnya

Di sekolah pesisir, air tanah payau dan sulit diminum. Siswa sering tidak punya tempat cuci tangan yang layak, sehingga rentan diare dan penyakit kulit.

## Rencana pembangunan

- Tandon penampung air hujan dan saringan sederhana
- 3 titik wastafel cuci tangan bersama
- Sabun dan kegiatan kebiasaan cuci tangan setiap hari
- Pelatihan perawatan fasilitas bersama guru dan komite sekolah

## Mengapa berkelanjutan

Perawatan dikelola oleh komite sekolah dan siswa "duta kebersihan" sehingga fasilitas tetap terpakai setelah proyek selesai.${NOTE}`,
  },
  {
    slug: "renovasi-ruang-kelas-sd-lereng-gunung",
    title: "Renovasi Ruang Kelas Sekolah Dasar di Lereng Gunung",
    summary: "Atap bocor, lantai retak, dan papan tulis rusak diperbaiki agar 80 siswa dapat belajar dengan nyaman. Target sudah tercapai — terima kasih!",
    category: "PENDIDIKAN",
    amountMode: "OPEN_AMOUNT",
    target: 35_000_000,
    raised: 35_000_000,
    status: "COMPLETED",
    featured: false,
    cover: "/images/landing/education.webp",
    endsInDays: null,
    description: `## Campaign selesai

Target dana renovasi **telah tercapai**. Pekerjaan perbaikan atap, lantai, dan papan tulis sedang dijadwalkan. Terima kasih kepada semua donatur.

Pantau perkembangan pekerjaan pada bagian *Update*.${NOTE}`,
  },
];

export const DEMO_NEWS: Array<{ slug: string; title: string; excerpt: string; body: string; campaignSlug: string | null; daysAgo: number }> = [
  {
    slug: "cara-kerja-donasi-di-donasibisa",
    title: "Cara kerja donasi di DonasiBisa: dari klik sampai bukti donasi",
    excerpt: "Panduan singkat berdonasi tanpa akun, memilih metode pembayaran, dan mengunduh bukti donasi.",
    campaignSlug: null,
    daysAgo: 21,
    body: `Berdonasi di DonasiBisa tidak memerlukan akun. Berikut alurnya:\n\n1. **Pilih campaign** yang ingin Anda dukung.\n2. **Isi data singkat** dan tentukan nominal (atau pilih paket yang tersedia).\n3. **Bayar** melalui QRIS, e-wallet, atau virtual account.\n4. **Terima konfirmasi** lewat email dan, jika Anda setuju, WhatsApp.\n\nUntuk melihat riwayat dan mengunduh *bukti donasi* PDF, masuk dengan Google menggunakan email yang sama dengan donasi Anda.\n\n> Konten ini adalah contoh untuk demonstrasi.`,
  },
  {
    slug: "mengapa-donasi-anonim-aman",
    title: "Donasi anonim: apa yang dilihat publik dan apa yang tidak",
    excerpt: "Nama donatur dapat disembunyikan, dan data kontak tidak pernah ditampilkan ke publik.",
    campaignSlug: null,
    daysAgo: 12,
    body: `Kami menjaga privasi donatur. Pada formulir donasi Anda bisa memilih **donasi anonim**. Selain itu:\n\n- Email dan nomor WhatsApp **tidak pernah** ditampilkan di halaman publik.\n- Notifikasi WhatsApp hanya dikirim jika Anda memberi persetujuan.\n- Hanya admin berizin yang dapat melihat data kontak untuk keperluan operasional.\n\n> Konten ini adalah contoh untuk demonstrasi.`,
  },
  {
    slug: "update-banjir-posko-logistik-dibuka",
    title: "Update: posko logistik dibuka dan pengiriman tahap pertama berangkat",
    excerpt: "Relawan menyiapkan paket makanan dan air bersih untuk keluarga di pengungsian.",
    campaignSlug: "bantuan-logistik-warga-terdampak-banjir",
    daysAgo: 4,
    body: `Posko logistik telah dibuka dan relawan mulai mengemas bantuan.\n\n**Tahap pertama** mencakup makanan siap saji, air minum, selimut, serta perlengkapan bayi untuk keluarga yang paling membutuhkan. Pengiriman berikutnya akan menyesuaikan kebutuhan di lapangan.\n\nTerima kasih atas dukungan Anda. Kami akan memperbarui laporan setelah penyaluran selesai.\n\n> Update contoh untuk demonstrasi.`,
  },
  {
    slug: "update-posyandu-keliling-kunjungan-pertama",
    title: "Update: kunjungan pertama posyandu keliling selesai",
    excerpt: "Puluhan balita ditimbang dan mendapat makanan tambahan pada kunjungan pertama.",
    campaignSlug: "posyandu-keliling-gizi-balita",
    daysAgo: 7,
    body: `Kunjungan pertama berjalan lancar. Tim melakukan penimbangan, pengukuran tinggi badan, dan membagikan makanan tambahan berbahan pangan lokal.\n\nIbu-ibu juga mengikuti kelas singkat tentang menu gizi seimbang. Kunjungan berikutnya dijadwalkan bulan depan.\n\n> Update contoh untuk demonstrasi.`,
  },
  {
    slug: "update-renovasi-kelas-target-tercapai",
    title: "Update: target renovasi tercapai, pengerjaan dimulai",
    excerpt: "Berkat dukungan donatur, dana renovasi terpenuhi dan jadwal pengerjaan disusun.",
    campaignSlug: "renovasi-ruang-kelas-sd-lereng-gunung",
    daysAgo: 2,
    body: `Dana renovasi sudah terpenuhi. Pengerjaan dimulai dari perbaikan atap, dilanjutkan lantai dan papan tulis.\n\nKami akan membagikan foto perkembangan setiap minggu.\n\n> Update contoh untuk demonstrasi.`,
  },
];
