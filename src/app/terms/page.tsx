import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/public/legal";
import { getBrand } from "@/services/brand.service";
import { ADULT_AGE } from "@/lib/consent";

export const metadata: Metadata = { title: "Syarat Layanan", description: "Aturan penggunaan platform donasi: donasi, pembayaran, campaign, dan tanggung jawab para pihak.", alternates: { canonical: "/terms" } };

const SECTIONS = [
  { id: "layanan", title: "Tentang layanan" },
  { id: "kelayakan", title: "Siapa yang dapat berdonasi" },
  { id: "donasi", title: "Sifat donasi" },
  { id: "biaya", title: "Biaya: tidak ada biaya tersembunyi" },
  { id: "pembayaran", title: "Pembayaran" },
  { id: "campaign", title: "Informasi campaign" },
  { id: "bukti", title: "Bukti donasi" },
  { id: "penggunaan", title: "Penggunaan yang dilarang" },
  { id: "ulasan", title: "Ulasan dan testimoni" },
  { id: "tanggung-jawab", title: "Batasan tanggung jawab" },
  { id: "hukum", title: "Hukum yang berlaku dan perubahan" },
];

export default async function TermsPage() {
  const brand = await getBrand();
  const who = brand.legalName ?? brand.brandName;
  return (
    <LegalPage crumb="Syarat Layanan" title="Syarat Layanan" sections={SECTIONS} intro={`Dengan menggunakan platform ${brand.brandName}, Anda menyetujui syarat berikut. Mohon baca bersama Kebijakan Privasi, Kebijakan Pengembalian Dana, dan Kebijakan Cookie.`}>
      <LegalSection id="layanan" title="1. Tentang layanan">
        <p>{who} mengelola platform donasi online yang memungkinkan Anda menemukan campaign, berdonasi sekali bayar, dan menerima bukti donasi. Platform ini <strong>tidak</strong> melakukan penagihan berulang dan tidak menyimpan instrumen pembayaran Anda.</p>
      </LegalSection>
      <LegalSection id="kelayakan" title="2. Siapa yang dapat berdonasi">
        <p>Anda harus berusia minimal <strong>{ADULT_AGE} tahun</strong>, atau berdonasi dengan persetujuan dan pendampingan orang tua/wali. Dengan mencentang konfirmasi pada formulir donasi, Anda menyatakan memenuhi syarat ini dan bahwa data yang Anda berikan benar.</p>
      </LegalSection>
      <LegalSection id="donasi" title="3. Sifat donasi">
        <ul>
          <li>Donasi bersifat <strong>sukarela</strong>, bukan investasi, jual beli, atau pinjaman, dan tidak memberikan imbalan finansial.</li>
          <li>Donasi digunakan untuk tujuan kampanye yang Anda pilih, sesuai informasi yang tampil pada halaman kampanye tersebut.</li>
          <li>Jika target tercapai atau kampanye ditutup, donasi yang sudah dibuat sebelum penutupan tetap diproses.</li>
        </ul>
      </LegalSection>
      <LegalSection id="biaya" title="4. Biaya: tidak ada biaya tersembunyi">
        <p>Jumlah yang Anda bayar <strong>sama persis dengan nominal donasi</strong> yang Anda pilih. Kami tidak menambahkan biaya admin, biaya layanan, atau tip otomatis. Rincian pembayaran selalu ditampilkan sebelum Anda membayar. Bank atau dompet digital Anda dapat mengenakan biaya sendiri sesuai kebijakannya, di luar kendali kami.</p>
      </LegalSection>
      <LegalSection id="pembayaran" title="5. Pembayaran">
        <p>Pembayaran diproses penyedia pembayaran pihak ketiga (Midtrans dan/atau Xendit). Donasi dinyatakan <strong>berhasil</strong> hanya setelah penyedia mengonfirmasi pembayaran ke sistem kami; tampilan di browser saja tidak cukup. Pembayaran yang tidak diselesaikan sebelum batas waktu akan kedaluwarsa. Ketentuan pengembalian dana ada di <Link href="/refund">Kebijakan Pengembalian Dana</Link>.</p>
      </LegalSection>
      <LegalSection id="campaign" title="6. Informasi campaign">
        <p>Kami berupaya agar informasi kampanye akurat dan memperbarui progres setiap pembayaran terkonfirmasi. Kampanye bertanda <strong>DEMO</strong> adalah contoh untuk demonstrasi dan bukan penggalangan dana nyata.</p>
      </LegalSection>
      <LegalSection id="bukti" title="7. Bukti donasi">
        <p>Dokumen &quot;Bukti Donasi&quot; adalah catatan transaksi, <strong>bukan kuitansi pajak</strong> atau bukti pengurang pajak. Hubungi penasihat pajak Anda untuk kebutuhan tersebut.</p>
      </LegalSection>
      <LegalSection id="penggunaan" title="8. Penggunaan yang dilarang">
        <ul>
          <li>Menggunakan platform untuk pencucian uang, penipuan, atau tindakan melanggar hukum.</li>
          <li>Menggunakan data atau kartu pembayaran milik orang lain tanpa hak.</li>
          <li>Mengganggu keamanan atau ketersediaan layanan (termasuk percobaan peretasan atau permintaan otomatis berlebihan).</li>
        </ul>
        <p>Kami dapat menolak, menahan, atau membatalkan transaksi yang mencurigakan.</p>
      </LegalSection>
      <LegalSection id="ulasan" title="9. Ulasan dan testimoni">
        <p>Kami tidak menampilkan ulasan, testimoni, atau angka dampak yang dibuat-buat. Setiap angka (misalnya total donasi) berasal dari data sistem, dan konten contoh selalu diberi label.</p>
      </LegalSection>
      <LegalSection id="tanggung-jawab" title="10. Batasan tanggung jawab">
        <p>Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung, gangguan layanan di luar kendali wajar kami (termasuk gangguan penyedia pembayaran), atau keputusan Anda berdonasi. Tidak ada ketentuan di sini yang membatasi hak Anda sebagai konsumen menurut peraturan yang berlaku.</p>
      </LegalSection>
      <LegalSection id="hukum" title="11. Hukum yang berlaku dan perubahan">
        <p>Syarat ini tunduk pada hukum Republik Indonesia. Kami dapat memperbarui syarat ini; versi yang berlaku saat Anda berdonasi dicatat bersama donasi Anda. Kontak dan detail penyelenggara ada di <Link href="/tentang">Tentang &amp; Kontak</Link>.</p>
      </LegalSection>
    </LegalPage>
  );
}
