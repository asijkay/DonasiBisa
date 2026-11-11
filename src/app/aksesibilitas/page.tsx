import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/public/legal";
import { getBrand } from "@/services/brand.service";

export const metadata: Metadata = { title: "Aksesibilitas" };

const SECTIONS = [
  { id: "komitmen", title: "Komitmen kami" },
  { id: "fitur", title: "Fitur aksesibilitas" },
  { id: "keyboard", title: "Navigasi dengan keyboard" },
  { id: "batasan", title: "Batasan yang kami ketahui" },
  { id: "umpan-balik", title: "Umpan balik" },
];

export default async function AccessibilityPage() {
  const brand = await getBrand();
  const contact = brand.contactEmail;
  return (
    <LegalPage crumb="Aksesibilitas" title="Pernyataan Aksesibilitas" sections={SECTIONS} intro={`${brand.brandName} ingin dapat digunakan oleh sebanyak mungkin orang, termasuk pengguna pembaca layar, keyboard, dan perangkat seluler.`}>
      <LegalSection id="komitmen" title="1. Komitmen kami">
        <p>Kami menargetkan kepatuhan pada <strong>WCAG 2.2 level AA</strong>. Kami memeriksa halaman utama dengan alat otomatis (axe-core) pada mode terang dan gelap, serta menguji navigasi keyboard secara manual.</p>
      </LegalSection>
      <LegalSection id="fitur" title="2. Fitur aksesibilitas">
        <ul>
          <li>Tautan &quot;Lewati ke konten&quot; di awal setiap halaman.</li>
          <li>Struktur judul dan penanda wilayah (header, navigasi, main, footer) yang berurutan, plus <em>breadcrumb</em> dan tombol Kembali.</li>
          <li>Kontras warna memadai di mode terang dan gelap; status tidak hanya dibedakan lewat warna.</li>
          <li>Teks alternatif untuk gambar bermakna; gambar dekoratif disembunyikan dari pembaca layar.</li>
          <li>Label pada semua kolom formulir, pesan galat yang dibacakan, dan tombol yang dinonaktifkan saat memproses.</li>
          <li>Tema terang/gelap mengikuti pengaturan perangkat dan dapat diubah manual.</li>
          <li>Animasi dikurangi otomatis bila perangkat meminta <em>reduced motion</em>.</li>
          <li>Tata letak responsif untuk ponsel dan zoom hingga 200%.</li>
        </ul>
      </LegalSection>
      <LegalSection id="keyboard" title="3. Navigasi dengan keyboard">
        <table>
          <thead><tr><th scope="col">Tombol</th><th scope="col">Fungsi</th></tr></thead>
          <tbody>
            <tr><td><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></td><td>Pindah ke elemen berikutnya / sebelumnya (fokus selalu terlihat)</td></tr>
            <tr><td><kbd>Enter</kbd> / <kbd>Spasi</kbd></td><td>Mengaktifkan tautan, tombol, dan pilihan</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Menutup menu seluler dan pengaturan cookie</td></tr>
            <tr><td>Tab pertama di halaman</td><td>&quot;Lewati ke konten&quot;</td></tr>
          </tbody>
        </table>
      </LegalSection>
      <LegalSection id="batasan" title="4. Batasan yang kami ketahui">
        <ul>
          <li>Halaman pembayaran Midtrans/Xendit dan login Google dikelola pihak ketiga; aksesibilitasnya mengikuti mereka.</li>
          <li>Konten campaign dan berita ditulis admin; kualitas teks alternatif gambar bergantung pada pengisian admin.</li>
        </ul>
      </LegalSection>
      <LegalSection id="umpan-balik" title="5. Umpan balik">
        <p>Menemui hambatan? Beri tahu kami{contact ? <> di <a href={`mailto:${contact}`}>{contact}</a></> : null} atau lewat <Link href="/tentang">halaman kontak</Link>. Kami berupaya menanggapi dalam 5 hari kerja.</p>
      </LegalSection>
    </LegalPage>
  );
}
