import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/public/legal";
import { getBrand } from "@/services/brand.service";

export const metadata: Metadata = { title: "Kebijakan Pengembalian Dana", description: "Kapan donasi dapat dikembalikan, cara mengajukan, dan berapa lama prosesnya.", alternates: { canonical: "/refund" } };

const SECTIONS = [
  { id: "prinsip", title: "Prinsip umum" },
  { id: "dapat", title: "Kapan dana dapat dikembalikan" },
  { id: "tidak", title: "Kapan tidak dapat dikembalikan" },
  { id: "cara", title: "Cara mengajukan" },
  { id: "proses", title: "Proses dan waktu" },
  { id: "biaya", title: "Biaya pengembalian" },
];

export default async function RefundPage() {
  const brand = await getBrand();
  const contact = brand.contactEmail;
  return (
    <LegalPage crumb="Pengembalian Dana" title="Kebijakan Pengembalian Dana" sections={SECTIONS} intro="Donasi bersifat sukarela, tetapi kesalahan dapat terjadi. Berikut kapan dan bagaimana Anda dapat meminta pengembalian dana.">
      <LegalSection id="prinsip" title="1. Prinsip umum">
        <p>Donasi yang sudah berhasil pada dasarnya <strong>tidak dapat ditarik kembali</strong> karena dana diteruskan untuk tujuan campaign. Pengecualian di bawah ini berlaku.</p>
      </LegalSection>
      <LegalSection id="dapat" title="2. Kapan dana dapat dikembalikan">
        <ul>
          <li><strong>Pembayaran ganda:</strong> Anda membayar dua kali untuk donasi yang sama.</li>
          <li><strong>Nominal keliru akibat kesalahan sistem kami.</strong></li>
          <li><strong>Donasi oleh pihak di bawah umur tanpa persetujuan wali</strong>, yang diajukan oleh orang tua/wali.</li>
          <li><strong>Campaign terbukti menyesatkan</strong> atau dibatalkan sebelum dana disalurkan.</li>
          <li><strong>Pembayaran tanpa otorisasi</strong> (misalnya kartu atau akun digunakan pihak lain).</li>
        </ul>
      </LegalSection>
      <LegalSection id="tidak" title="3. Kapan tidak dapat dikembalikan">
        <ul>
          <li>Berubah pikiran setelah donasi berhasil dan dana sudah disalurkan.</li>
          <li>Salah memilih campaign yang diketahui setelah penyaluran. Kami tetap akan membantu bila dana belum disalurkan.</li>
          <li>Pengajuan setelah lewat <strong>14 hari</strong> sejak donasi berhasil, kecuali untuk pembayaran tanpa otorisasi atau kesalahan kami.</li>
        </ul>
      </LegalSection>
      <LegalSection id="cara" title="4. Cara mengajukan">
        <p>Kirim email{contact ? <> ke <a href={`mailto:${contact}`}>{contact}</a></> : null} dengan subjek &quot;Pengembalian dana&quot; yang memuat <strong>kode donasi</strong> (contoh DON-XXXXXXXXXXXX), email yang dipakai berdonasi, dan alasan. Detail kontak lengkap ada di <Link href="/tentang">Tentang &amp; Kontak</Link>.</p>
      </LegalSection>
      <LegalSection id="proses" title="5. Proses dan waktu">
        <p>Kami memverifikasi permintaan, lalu memprosesnya lewat penyedia pembayaran ke sumber dana semula. Dana umumnya tiba dalam <strong>7–14 hari kerja</strong> tergantung bank atau dompet digital. Kami memberi kabar tiap tahap.</p>
      </LegalSection>
      <LegalSection id="biaya" title="6. Biaya pengembalian">
        <p>Kami tidak memotong biaya apa pun dari dana yang dikembalikan. Jika penyedia pembayaran atau bank Anda membebankan biaya tersendiri, kami akan menyampaikannya sebelum memproses.</p>
      </LegalSection>
    </LegalPage>
  );
}
