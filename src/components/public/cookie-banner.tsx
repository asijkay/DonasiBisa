"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { openCookieSettings, readConsent, saveConsent } from "@/lib/consent-client";

function subscribe(cb: () => void): () => void {
  window.addEventListener("consent-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("consent-change", cb);
    window.removeEventListener("storage", cb);
  };
}

/** Link-style button used in the footer and the cookie policy to reopen the banner. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className ?? "font-semibold text-brand-ink underline underline-offset-2"}>
      Pengaturan cookie
    </button>
  );
}

/**
 * Consent banner. Only ONE optional category exists (preferences: remembers light/dark), so the two buttons are
 * equal in size, weight and position — declining is exactly as easy as accepting, and nothing is pre-selected.
 */
export function CookieBanner() {
  const decided = useSyncExternalStore(subscribe, () => (readConsent() ? "yes" : "no"), () => "yes"); // SSR: hidden
  const [reopened, setReopened] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const open = decided === "no" || reopened;

  useEffect(() => {
    const onOpen = () => setReopened(true);
    window.addEventListener("cookie-settings", onOpen);
    return () => window.removeEventListener("cookie-settings", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && reopened) setReopened(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, reopened]);

  useEffect(() => {
    if (reopened) ref.current?.querySelector<HTMLElement>("button")?.focus(); // keyboard users land in the banner
  }, [reopened]);

  if (!open) return null;
  const choose = (functional: boolean) => {
    saveConsent(functional);
    setReopened(false);
  };
  const btn = "flex-1 rounded-xl border-2 border-brand px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:bg-brand-soft";

  return (
    <section ref={ref} role="region" aria-labelledby="cookie-title" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-slate-300 bg-card p-5 shadow-2xl">
      <h2 id="cookie-title" className="text-base font-bold text-slate-900">Pengaturan cookie</h2>
      <p className="mt-1.5 text-sm text-slate-700">
        Kami memakai cookie <strong>penting</strong> agar situs dan login berfungsi. Cookie <strong>preferensi</strong> (opsional) hanya mengingat pilihan tampilan terang/gelap Anda. Kami tidak memakai cookie iklan atau pelacak. <Link href="/cookies" className="font-semibold text-brand-ink underline underline-offset-2">Selengkapnya</Link>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={btn} onClick={() => choose(false)}>Hanya yang diperlukan</button>
        <button type="button" className={btn} onClick={() => choose(true)}>Terima preferensi</button>
      </div>
    </section>
  );
}
