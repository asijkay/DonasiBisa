"use client";

import { Button } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center" role="alert">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="mt-2 text-slate-600">Silakan coba lagi. Jika masalah berlanjut, hubungi kami.</p>
      <Button className="mt-6" onClick={reset}>Coba lagi</Button>
    </div>
  );
}
