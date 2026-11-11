"use client";

import { useState, type ReactNode } from "react";
import { IconClose, IconMenu } from "@/components/public/icons";

/** Admin shell: fixed sidebar on desktop, slide-over drawer on small screens, glass top bar. */
export function AdminFrame({ sidebar, topbarRight, children }: { sidebar: ReactNode; topbarRight: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="admin-shell min-h-dvh lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="admin-side sticky top-0 hidden h-dvh overflow-y-auto lg:block">{sidebar}</aside>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu admin"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="admin-side relative h-full w-[84%] max-w-[300px] overflow-y-auto shadow-2xl">
            <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 z-10 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white">
              <IconClose width={18} height={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="admin-topbar sticky top-0 z-30 flex h-16 items-center gap-3 px-4 lg:px-8">
          <button
            type="button"
            aria-label="Buka menu admin"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-card text-slate-700 lg:hidden"
          >
            <IconMenu width={20} height={20} />
          </button>
          <p className="text-sm font-semibold tracking-tight text-slate-800">Panel admin</p>
          <div className="ml-auto flex items-center gap-2">{topbarRight}</div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
