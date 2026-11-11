import type { Metadata } from "next";
import Link from "next/link";
import { BusinessDetails, LegalPage, LegalSection } from "@/components/public/legal";
import { getBrand } from "@/services/brand.service";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

const SECTIONS = [
  { id: "pengendali", title: "Siapa kami (pengendali data)" },
  { id: "data", title: "Data apa yang kami kumpulkan" },
  { id: "tujuan", title: "Untuk apa dan dasar hukum" },
  { id: "pihak-ketiga", title: "Dengan siapa data dibagikan" },
  { id: "transfer", title: "Penyimpanan dan transfer lintas negara" },
  { id: "retensi", title: "Berapa lama data disimpan" },
  { id: "hak", title: "Hak Anda" },
  { id: "anak", title: "Data anak" },
  { id: "pesan", title: "Pesan email dan WhatsApp" },
  { id: "keamanan", title: "Keamanan" },
  { id: "perubahan", title: "Perubahan kebijakan dan kontak" },
];

export default async function PrivacyPage() {
  const brand = await getBrand();
  const contact = brand.privacyContactEmail ?? brand.contactEmail;
  return (
    <LegalPage crumb="Kebijakan Privasi" title="Kebijakan Privasi" sections={SECTIONS} intro={`Kebijakan ini menjelaskan bagaimana ${brand.brandName} memproses data pribadi Anda, sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Kami hanya mengumpulkan data yang benar-benar diperlukan.`}>
      <LegalSection id="pengendali" title="1. Siapa kami (pengendali data)">
        <p>Pengendali data pribadi adalah penyelenggara berikut:</p>
        <BusinessDetails brand={brand} />
      </LegalSection>

      <LegalSection id="data" title="2. Data apa yang kami kumpulkan">
        <table>
          <thead><tr><th scope="col">Data</th><th scope="col">Kapan</th><th scope="col">Wajib?</th></tr></thead>
          <tbody>
            <tr><td>Nama</td><td>Saat berdonasi</td><td>Ya (dapat ditampilkan sebagai &quot;Donatur Anonim&quot; di sisi publik)</td></tr>
            <tr><td>Email</td><td>Saat berdonasi</td><td>Ya (untuk bukti dan instruksi pembayaran)</td></tr>
            <tr><td>Nomor WhatsApp</td><td>Hanya jika Anda memilih menerima notifikasi WhatsApp</td><td>Tidak. Jika tidak dicentang, nomor tidak diminta dan tidak disimpan</td></tr>
            <tr><td>Nominal, campaign, status dan waktu pembayaran</td><td>Saat berdonasi</td><td>Ya</td></tr>
            <tr><td>Pesan atau doa</td><td>Saat berdonasi</td><td>Tidak</td></tr>
            <tr><td>Bukti persetujuan (versi syarat, waktu, konfirmasi usia)</td><td>Saat berdonasi</td><td>Ya</td></tr>
            <tr><td>Nama, email, foto profil Google</td><td>Jika Anda masuk dengan Google</td><td>Tidak (login bersifat opsional)</td></tr>
          </tbody>
        </table>
        <p><strong>Yang tidak kami kumpulkan:</strong> kami tidak menyimpan nomor kartu, PIN, atau kredensial pembayaran (diproses penyedia pembayaran), tidak menyimpan alamat IP donatur, dan tidak memasang pelacak iklan atau analitik pihak ketiga.</p>
      </LegalSection>

      <LegalSection id="tujuan" title="3. Untuk apa dan dasar hukum">
        <ul>
          <li><strong>Memproses donasi dan pembayaran</strong> (pelaksanaan perjanjian): nama, email, nominal, campaign.</li>
          <li><strong>Mengirim instruksi dan bukti pembayaran</strong> lewat email (kepentingan yang sah dan pelaksanaan perjanjian), serta lewat WhatsApp berdasarkan <strong>persetujuan</strong> Anda.</li>
          <li><strong>Pencatatan keuangan dan kepatuhan</strong> (kewajiban hukum): catatan transaksi.</li>
          <li><strong>Keamanan dan pencegahan penyalahgunaan</strong> (kepentingan yang sah): pembatasan laju permintaan, log audit.</li>
          <li><strong>Akun donatur</strong> (persetujuan): riwayat donasi dan bukti donasi.</li>
        </ul>
        <p>Kami tidak menjual data pribadi dan tidak menggunakannya untuk pemasaran pihak ketiga.</p>
      </LegalSection>

      <LegalSection id="pihak-ketiga" title="4. Dengan siapa data dibagikan">
        <p>Kami memakai penyedia layanan (prosesor) berikut, hanya sebatas yang dibutuhkan:</p>
        <table>
          <thead><tr><th scope="col">Penyedia</th><th scope="col">Fungsi</th><th scope="col">Data</th></tr></thead>
          <tbody>
            <tr><td>Midtrans dan/atau Xendit</td><td>Memproses pembayaran</td><td>Nama, email, nominal, nomor referensi</td></tr>
            <tr><td>Vercel</td><td>Hosting aplikasi</td><td>Data permintaan teknis</td></tr>
            <tr><td>Neon</td><td>Basis data</td><td>Seluruh data di tabel ini</td></tr>
            <tr><td>Upstash</td><td>Cache, pembatas laju, antrean pekerjaan</td><td>Pengenal ter-hash, id pekerjaan</td></tr>
            <tr><td>Google</td><td>Login Google dan pengiriman email (SMTP)</td><td>Profil Google; isi email notifikasi</td></tr>
            <tr><td>Fonnte</td><td>Mengirim WhatsApp (jika Anda setuju)</td><td>Nomor WhatsApp, isi pesan</td></tr>
          </tbody>
        </table>
        <p>Kami juga dapat mengungkapkan data bila diwajibkan hukum atau diminta otoritas yang berwenang.</p>
      </LegalSection>

      <LegalSection id="transfer" title="5. Penyimpanan dan transfer lintas negara">
        <p>Sebagian penyedia di atas menyimpan atau memproses data di luar Indonesia (misalnya Amerika Serikat atau Singapura). Kami memilih penyedia yang menerapkan perlindungan keamanan memadai dan mengikat mereka melalui ketentuan layanan masing-masing.</p>
      </LegalSection>

      <LegalSection id="retensi" title="6. Berapa lama data disimpan">
        <ul>
          <li><strong>Catatan transaksi</strong> (nominal, status, tanggal, kode donasi): disimpan sesuai ketentuan pencatatan keuangan, umumnya hingga 10 tahun.</li>
          <li><strong>Data identitas</strong> (nama, email, nomor WhatsApp, pesan): disimpan selama akun atau hubungan donasi aktif, lalu dihapus/dianonimkan atas permintaan Anda.</li>
          <li><strong>Log notifikasi dan pembayaran:</strong> sesuai kebutuhan audit operasional.</li>
        </ul>
      </LegalSection>

      <LegalSection id="hak" title="7. Hak Anda">
        <p>Anda berhak mengakses, memperbaiki, membatasi, menarik persetujuan, memindahkan, serta meminta penghapusan data pribadi Anda.</p>
        <ul>
          <li><strong>Sudah masuk dengan Google:</strong> buka <Link href="/account#privasi">Akun → Privasi &amp; data</Link> untuk mengunduh data (JSON) atau menghapus data dan akun secara mandiri.</li>
          <li><strong>Donasi sebagai tamu:</strong> ajukan lewat <Link href="/permintaan-data">formulir permintaan data</Link>. Kami memverifikasi kepemilikan email sebelum memproses.</li>
          <li><strong>Berhenti menerima pesan:</strong> klik tautan &quot;Berhenti menerima pesan&quot; di setiap email atau WhatsApp.</li>
        </ul>
        <p><strong>Catatan penghapusan:</strong> data identitas diganti dengan penanda &quot;data dihapus&quot;. Catatan transaksi (nominal, tanggal, status) tetap disimpan tanpa identitas karena kewajiban pencatatan keuangan.</p>
        {contact && <p>Pertanyaan atau pengaduan: <a href={`mailto:${contact}`}>{contact}</a>. Anda juga dapat mengadu kepada lembaga pelindungan data pribadi yang berwenang.</p>}
      </LegalSection>

      <LegalSection id="anak" title="8. Data anak">
        <p>Layanan ini ditujukan bagi pengguna berusia <strong>18 tahun ke atas</strong>. Pengguna di bawah 18 tahun hanya boleh berdonasi dengan persetujuan dan pendampingan orang tua atau wali, yang kami minta konfirmasinya pada formulir donasi. Kami tidak sengaja mengumpulkan data anak untuk tujuan lain. Jika Anda mengetahui anak memberikan data tanpa persetujuan wali, hubungi kami agar data dihapus.</p>
      </LegalSection>

      <LegalSection id="pesan" title="9. Pesan email dan WhatsApp">
        <p>Kami hanya mengirim pesan terkait donasi Anda: instruksi pembayaran, bukti pembayaran berhasil, dan pemberitahuan pembayaran kedaluwarsa. WhatsApp dikirim hanya jika Anda mencentang persetujuan. Setiap pesan memuat tautan berhenti menerima pesan; bukti pembayaran tetap dikirim karena merupakan catatan transaksi.</p>
      </LegalSection>

      <LegalSection id="keamanan" title="10. Keamanan">
        <p>Koneksi dienkripsi (HTTPS), kunci rahasia hanya disimpan di server, akses admin dibatasi peran dan dicatat dalam log audit, dan status pembayaran hanya diubah oleh konfirmasi tervalidasi dari penyedia pembayaran. Tidak ada sistem yang sepenuhnya kebal; jika terjadi insiden yang berdampak pada data Anda, kami akan memberi tahu Anda dan pihak berwenang sesuai hukum.</p>
      </LegalSection>

      <LegalSection id="perubahan" title="11. Perubahan kebijakan dan kontak">
        <p>Perubahan material akan diumumkan di halaman ini dengan tanggal pembaruan baru. Informasi cookie ada di <Link href="/cookies">Kebijakan Cookie</Link>; ketentuan umum ada di <Link href="/terms">Syarat Layanan</Link>.</p>
      </LegalSection>
    </LegalPage>
  );
}
