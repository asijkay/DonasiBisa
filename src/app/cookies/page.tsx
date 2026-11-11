import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/public/legal";
import { CookieSettingsButton } from "@/components/public/cookie-banner";

export const metadata: Metadata = { title: "Kebijakan Cookie" };

const SECTIONS = [
  { id: "apa", title: "Apa itu cookie dan penyimpanan lokal" },
  { id: "daftar", title: "Yang kami gunakan" },
  { id: "tidak", title: "Yang tidak kami gunakan" },
  { id: "pilihan", title: "Pilihan Anda" },
  { id: "pihak-ketiga", title: "Cookie dari pihak ketiga" },
];

export default function CookiesPage() {
  return (
    <LegalPage crumb="Kebijakan Cookie" title="Kebijakan Cookie" sections={SECTIONS} intro="Kami menggunakan sesedikit mungkin cookie dan penyimpanan lokal. Tidak ada cookie iklan atau pelacak analitik pihak ketiga.">
      <LegalSection id="apa" title="1. Apa itu cookie dan penyimpanan lokal">
        <p>Cookie adalah berkas kecil yang disimpan browser. Penyimpanan lokal (<em>localStorage</em>) serupa tetapi tidak dikirim otomatis ke server. Keduanya kami sebut &quot;cookie&quot; di halaman ini.</p>
      </LegalSection>
      <LegalSection id="daftar" title="2. Yang kami gunakan">
        <table>
          <thead><tr><th scope="col">Nama</th><th scope="col">Jenis</th><th scope="col">Fungsi</th><th scope="col">Durasi</th></tr></thead>
          <tbody>
            <tr><td><code>authjs.session-token</code> (cookie)</td><td>Penting</td><td>Menjaga Anda tetap masuk setelah login Google. Hanya dibuat setelah Anda login.</td><td>Hingga 30 hari atau sampai keluar</td></tr>
            <tr><td><code>authjs.csrf-token</code>, <code>authjs.callback-url</code> (cookie)</td><td>Penting</td><td>Keamanan proses login (mencegah pemalsuan permintaan).</td><td>Sesi / singkat</td></tr>
            <tr><td><code>consent</code> (penyimpanan lokal)</td><td>Penting</td><td>Mengingat pilihan cookie Anda agar banner tidak muncul terus.</td><td>12 bulan</td></tr>
            <tr><td><code>theme</code> (penyimpanan lokal)</td><td>Preferensi</td><td>Mengingat pilihan tampilan terang/gelap. Hanya disimpan jika Anda menyetujui cookie preferensi.</td><td>Sampai Anda menghapusnya</td></tr>
          </tbody>
        </table>
        <p>Cookie penting diperlukan agar layanan berfungsi dan tidak memerlukan persetujuan. Cookie preferensi bersifat opsional.</p>
      </LegalSection>
      <LegalSection id="tidak" title="3. Yang tidak kami gunakan">
        <ul>
          <li>Tidak ada cookie iklan, pemasaran ulang, atau pelacakan lintas situs.</li>
          <li>Tidak ada Google Analytics, Meta Pixel, atau SDK analitik pihak ketiga. Daftar pihak ketiga yang kami audit ada di dokumentasi proyek.</li>
          <li>Font menggunakan font sistem, jadi tidak ada permintaan ke layanan font eksternal.</li>
        </ul>
      </LegalSection>
      <LegalSection id="pilihan" title="4. Pilihan Anda">
        <p>Anda dapat mengubah pilihan kapan saja: <CookieSettingsButton />. Anda juga dapat menghapus cookie dan data situs lewat pengaturan browser; sebagian fitur (seperti tetap login) akan berhenti berfungsi.</p>
      </LegalSection>
      <LegalSection id="pihak-ketiga" title="5. Cookie dari pihak ketiga">
        <p>Saat Anda dialihkan ke halaman pembayaran Midtrans/Xendit atau halaman login Google, situs tersebut menetapkan cookie sendiri sesuai kebijakan mereka. Kami tidak mengendalikannya. Lihat juga <Link href="/privacy">Kebijakan Privasi</Link>.</p>
      </LegalSection>
    </LegalPage>
  );
}
