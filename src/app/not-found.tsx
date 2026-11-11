import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-slate-600">Tautan yang Anda buka tidak tersedia atau sudah tidak aktif.</p>
      <ButtonLink href="/" className="mt-6">Kembali ke beranda</ButtonLink>
    </div>
  );
}
