import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import type { PublicStats } from "@/services/campaigns.service";
import { formatIDR } from "@/lib/utils/format";
import { CATEGORY_META, IconArrow, IconCard, IconCheck, IconChevron, IconFile, IconLock, IconPointer, IconShield, IconChart } from "./icons";

export function SectionHeading({ eyebrow, title, children, center = false }: { eyebrow?: string; title: string; children?: ReactNode; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-ink">{eyebrow}</p>}
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {children && <p className="mt-3 text-slate-600">{children}</p>}
    </div>
  );
}

export function Hero({ ctaLabel, stats }: { ctaLabel: string; stats: PublicStats }) {
  const hasStats = stats.donationCount > 0;
  return (
    <section className="relative -mt-4">
      <div className="relative grid items-center gap-8 py-8 sm:py-16 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="reveal inline-flex items-center gap-2 rounded-full border border-brand/20 bg-card px-3 py-1 text-xs font-bold text-brand-ink">
            <IconShield width={14} height={14} /> Donasi aman · tanpa perlu membuat akun
          </p>
          <h1 className="reveal mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Bersama, <span className="text-brand-ink">Wujudkan</span> Perubahan Nyata
          </h1>
          <p className="reveal reveal-2 mt-5 max-w-xl text-lg text-slate-600">
            Mulai dari kepedulian kecil, untuk dampak besar bagi mereka yang membutuhkan. Pilih campaign, donasi dalam hitungan menit, dan pantau perkembangannya.
          </p>
          <div className="reveal reveal-3 mt-8 flex flex-wrap items-center gap-4">
            <Link href="/campaigns" className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-6 py-3.5 text-base font-bold text-on-accent transition-all duration-300 ease-out hover:-translate-y-0.5 hover:brightness-95 active:scale-[0.99]">
              {ctaLabel} <IconArrow width={18} height={18} />
            </Link>
            <Link href="/#cara-kerja" className="inline-flex items-center rounded-xl border border-slate-200 bg-card px-6 py-3.5 text-base font-semibold text-slate-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-400">
              Lihat cara kerja
            </Link>
          </div>
          <ul className="reveal reveal-3 mt-8 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            {["Pembayaran lewat Midtrans & Xendit", "Konfirmasi via email & WhatsApp", "Bukti donasi PDF untuk donatur", "Data pribadi tidak ditampilkan publik"].map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"><IconCheck width={12} height={12} strokeWidth={3} /></span>{t}</li>
            ))}
          </ul>
        </div>

        <div className="reveal reveal-3 relative mx-auto w-full max-w-xl">
          <div aria-hidden className="absolute -inset-3 -rotate-2 rounded-3xl bg-brand/90" />
          <Image src="/images/landing/hero.webp" alt="Anak-anak sekolah di Papua tersenyum ceria sambil memegang buku tulis" width={1600} height={1067} priority sizes="(min-width: 1024px) 560px, 90vw" className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl shadow-slate-900/20" />
          {hasStats && (
            <div className="absolute -bottom-6 left-4 rounded-2xl border border-slate-200 bg-card px-4 py-3 shadow-xl shadow-slate-900/10 sm:left-8">
              <p className="text-xs text-slate-500">Total donasi terkumpul</p>
              <p className="text-xl font-extrabold text-slate-900">{formatIDR(stats.totalRaised)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function CategoryLinks() {
  const keys = ["PENDIDIKAN", "KESEHATAN", "BENCANA", "SOSIAL"] as const;
  return (
    <section aria-label="Kategori campaign" className="py-12">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {keys.map((k, idx) => {
          const { label, Icon } = CATEGORY_META[k];
          return (
            <li key={k}><Reveal delay={idx * 80} className="h-full">
              <Link href={`/campaigns?kategori=${k}`} className="group flex h-full flex-col items-center gap-3 card-hover rounded-2xl border border-slate-200 bg-card p-6 text-center shadow-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink transition-colors duration-300 ease-out group-hover:bg-brand group-hover:text-white"><Icon width={28} height={28} /></span>
                <span className="font-bold text-slate-900">{label}</span>
              </Link>
            </Reveal></li>
          );
        })}
      </ul>
    </section>
  );
}

export function StatsBand({ stats }: { stats: PublicStats }) {
  const empty = stats.donationCount === 0;
  const items = [
    { v: formatIDR(stats.totalRaised), l: "Donasi terkumpul" },
    { v: stats.donorCount.toLocaleString("id-ID"), l: "Donatur berpartisipasi" },
    { v: stats.activeCampaigns.toLocaleString("id-ID"), l: "Campaign aktif" },
  ];
  return (
    <Reveal><section aria-label="Ringkasan" className="band-blue rounded-3xl text-white shadow-xl shadow-brand/15">
      <div className="px-6 py-10 sm:px-10">
        {empty ? (
          <div className="text-center">
            <p className="text-2xl font-extrabold sm:text-3xl">Jadilah donatur pertama</p>
            <p className="mx-auto mt-2 max-w-xl text-white/80">Setiap donasi tercatat transparan dan langsung menambah progres campaign. Mulai dari nominal berapa pun.</p>
          </div>
        ) : (
          <dl className="grid gap-8 text-center sm:grid-cols-3">
            {items.map((i) => (
              <div key={i.l}><dd className="text-3xl font-extrabold sm:text-4xl">{i.v}</dd><dt className="mt-1 text-sm font-medium text-white/80">{i.l}</dt></div>
            ))}
          </dl>
        )}
      </div>
    </section></Reveal>
  );
}

export function HowItWorks() {
  const steps = [
    { Icon: IconPointer, t: "Pilih campaign", d: "Telusuri campaign dan pilih yang ingin Anda dukung. Baca tujuan, target, dan perkembangannya." },
    { Icon: IconCard, t: "Tentukan nominal & bayar", d: "Isi data singkat tanpa perlu akun, lalu bayar lewat QRIS, e-wallet, atau virtual account." },
    { Icon: IconFile, t: "Terima konfirmasi", d: "Notifikasi dikirim lewat email/WhatsApp. Login Google untuk mengunduh bukti donasi PDF." },
  ];
  return (
    <section id="cara-kerja" className="scroll-mt-24 py-14"><div>
      <Reveal><SectionHeading eyebrow="Cara kerja" title="Berdonasi semudah tiga langkah" center>Proses singkat, aman, dan dapat dipantau dari awal sampai selesai.</SectionHeading></Reveal>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.t}><Reveal delay={i * 100} className="h-full"><div className="card-hover relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-card to-brand-soft p-6 shadow-sm">
            <span aria-hidden className="absolute right-5 top-3 text-6xl font-black text-brand-ink/25">{i + 1}</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white"><s.Icon width={24} height={24} /></span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{s.t}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{s.d}</p>
          </div></Reveal></li>
        ))}
      </ol>
    </div></section>
  );
}

export function TrustSection() {
  const items = [
    { Icon: IconLock, t: "Pembayaran aman", d: "Diproses penyedia pembayaran resmi. Status lunas hanya dari konfirmasi tervalidasi, bukan dari tampilan di browser." },
    { Icon: IconShield, t: "Privasi terjaga", d: "Nama bisa disembunyikan (anonim). Data kontak tidak pernah ditampilkan ke publik." },
    { Icon: IconChart, t: "Progres transparan", d: "Jumlah terkumpul dan target tampil apa adanya, diperbarui setiap pembayaran terkonfirmasi." },
    { Icon: IconFile, t: "Bukti donasi", d: "Unduh bukti donasi PDF kapan saja setelah login dengan akun Google yang sama." },
  ];
  return (
    <section className="grid items-center gap-10 py-8 lg:grid-cols-[1fr_1.1fr]">
      <Reveal><div className="relative">
        <Image src="/images/landing/community.webp" alt="Anak-anak mencuci tangan bersama di fasilitas sanitasi sekolah" width={1200} height={900} sizes="(min-width: 1024px) 480px, 90vw" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl shadow-slate-900/15" />
        <div aria-hidden className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-3xl bg-brand-accent/25" />
      </div></Reveal>
      <div>
        <Reveal delay={100}><SectionHeading eyebrow="Kenapa DonasiBisa" title="Niat baik, dengan proses yang bisa dipercaya" /></Reveal>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((i, idx) => (
            <li key={i.t}><Reveal delay={150 + idx * 80} className="h-full"><div className="card-hover h-full rounded-2xl border border-slate-200 bg-gradient-to-br from-card to-brand-soft p-4 shadow-sm sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-ink"><i.Icon width={20} height={20} /></span>
              <h3 className="mt-3 font-bold text-slate-900">{i.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{i.d}</p>
            </div></Reveal></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const FAQ: Array<[string, string]> = [
  ["Apakah saya harus membuat akun untuk berdonasi?", "Tidak. Anda cukup mengisi nama, email, dan nomor WhatsApp. Login Google bersifat opsional, hanya untuk melihat riwayat dan mengunduh bukti donasi."],
  ["Metode pembayaran apa yang tersedia?", "Metode yang aktif tampil di halaman pembayaran, misalnya QRIS, e-wallet, dan virtual account melalui Midtrans atau Xendit. Pilihan dapat berbeda antar waktu."],
  ["Kapan donasi saya dinyatakan berhasil?", "Setelah penyedia pembayaran mengirim konfirmasi resmi ke sistem kami. Halaman status selalu membaca data terbaru; Anda juga bisa menekan tombol cek status."],
  ["Apakah nama saya ditampilkan ke publik?", "Tidak ada data kontak yang ditampilkan. Anda juga bisa memilih donasi anonim saat mengisi formulir."],
  ["Bagaimana jika campaign sudah mencapai target atau ditutup?", "Campaign tidak lagi menerima donasi baru. Pembayaran yang sudah dibuat sebelum penutupan tetap diproses."],
  ["Apakah bukti donasi bisa dipakai untuk pengurang pajak?", "Dokumen yang kami terbitkan adalah bukti donasi, bukan kuitansi pajak. Konsultasikan kebutuhan pajak Anda dengan pihak terkait."],
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-16">
      <Reveal><SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" center /></Reveal>
      <div className="mx-auto mt-8 max-w-3xl space-y-4">
        {FAQ.map(([q, a], idx) => (
          <Reveal key={q} delay={idx * 60}><details className="group rounded-2xl border border-slate-200 bg-gradient-to-r from-card to-brand-soft p-4 transition-colors duration-300 hover:border-slate-400 open:border-brand sm:px-6">
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-slate-900">
              {q}
              <IconChevron width={20} height={20} className="shrink-0 text-brand-ink transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
          </details></Reveal>
        ))}
      </div>
    </section>
  );
}

export function CtaBand({ ctaLabel }: { ctaLabel: string }) {
  return (
    <Reveal><section className="band-navy rounded-3xl shadow-xl shadow-brand/15">
      <div className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-10">
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Satu donasi kecil bisa jadi awal perubahan besar</h2>
        <p className="max-w-xl text-white/80">Pilih campaign yang menyentuh hati Anda hari ini.</p>
        <Link href="/campaigns" className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-7 py-3.5 text-base font-bold text-on-accent transition-all duration-300 ease-out hover:-translate-y-0.5 hover:brightness-95 active:scale-[0.99]">
          {ctaLabel} <IconArrow width={18} height={18} />
        </Link>
      </div>
    </section></Reveal>
  );
}
