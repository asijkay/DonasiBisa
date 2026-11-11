"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/**
 * Re-reads the status from OUR backend. The browser never decides the outcome; "Cek status" asks the
 * server to verify with the provider (server-to-server) and then refreshes from the database.
 */
export function StatusPoller({ donationCode, currentStatus }: { donationCode: string; currentStatus: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const tries = useRef(0);

  async function read(verify: boolean): Promise<string | null> {
    const res = await fetch(`/api/donations/${encodeURIComponent(donationCode)}/status${verify ? "?verify=1" : ""}`, { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { status: string }).status;
  }

  useEffect(() => {
    if (currentStatus !== "PENDING") return;
    const id = setInterval(async () => {
      tries.current += 1;
      if (tries.current > 60) return clearInterval(id);
      const s = await read(false).catch(() => null);
      if (s && s !== currentStatus) router.refresh();
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStatus, donationCode]);

  if (currentStatus !== "PENDING") return null;

  async function check() {
    setChecking(true);
    setMessage(null);
    const s = await read(true).catch(() => null);
    setChecking(false);
    if (s && s !== "PENDING") router.refresh();
    else setMessage("Pembayaran belum terkonfirmasi. Jika Anda sudah membayar, tunggu beberapa saat lalu cek kembali.");
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={check} disabled={checking}>{checking ? "Memeriksa…" : "Cek status pembayaran"}</Button>
      {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
