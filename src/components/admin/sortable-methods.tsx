"use client";

import { useRef, useState, useTransition } from "react";
import type { Provider } from "@/db/schema";
import { Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { IconDown, IconGrip, IconUp } from "@/components/public/icons";
import { reorderMethodsAction, updateMethodAction } from "@/app/admin/actions";

export type MethodRow = { id: string; channelCode: string; displayName: string; description: string | null; isEnabled: boolean };

/**
 * Channels of one provider, sortable by drag and drop (grip handle) or with the up/down buttons
 * (keyboard and touch friendly). The new order is saved as soon as an item is dropped.
 */
export function SortableMethods({ provider, methods, canConfigure }: { provider: Provider; methods: MethodRow[]; canConfigure: boolean }) {
  const [items, setItems] = useState(methods);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const before = useRef(methods);

  function persist(next: MethodRow[]) {
    const previous = before.current;
    setItems(next);
    setStatus(null);
    startTransition(async () => {
      const res = await reorderMethodsAction(provider, next.map((m) => m.id));
      if (res.ok) before.current = next;
      else setItems(previous);
      setStatus(res);
    });
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persist(next);
  }

  function onDrop(targetId: string) {
    const from = items.findIndex((m) => m.id === dragId);
    const to = items.findIndex((m) => m.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from >= 0 && to >= 0) move(from, to);
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2" aria-label={`Urutan metode ${provider}`}>
        {items.map((m, index) => (
          <li
            key={m.id}
            data-dragging={dragId === m.id}
            data-over={overId === m.id && dragId !== m.id}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              if (overId !== m.id) setOverId(m.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(m.id);
            }}
            className="sortable-item rounded-xl border border-slate-200 bg-card p-3"
          >
            <form action={updateMethodAction.bind(null, m.id)} className="grid items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)_auto_auto]">
              <div className="flex items-center gap-1.5">
                {canConfigure ? (
                  <span
                    draggable
                    role="presentation"
                    title="Seret untuk mengubah urutan"
                    onDragStart={(e) => {
                      setDragId(m.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", m.id);
                      const row = (e.currentTarget as HTMLElement).closest("li");
                      if (row) e.dataTransfer.setDragImage(row, 24, 24);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                    className="flex h-9 w-9 cursor-grab touch-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
                  >
                    <IconGrip width={18} height={18} />
                  </span>
                ) : null}
                <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-ink">{index + 1}</span>
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-500">Kode channel</span>
                <p className="truncate font-mono text-sm">{m.channelCode}</p>
              </div>
              <label className="text-xs text-slate-500">
                Nama tampilan
                <Input name="displayName" defaultValue={m.displayName} disabled={!canConfigure} />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isEnabled" defaultChecked={m.isEnabled} disabled={!canConfigure} className="h-4 w-4" /> Aktif
              </label>
              <div className="flex items-center gap-1.5">
                {canConfigure && (
                  <>
                    <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0 || pending} aria-label={`Naikkan ${m.displayName}`} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                      <IconUp width={16} height={16} />
                    </button>
                    <button type="button" onClick={() => move(index, index + 1)} disabled={index === items.length - 1 || pending} aria-label={`Turunkan ${m.displayName}`} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                      <IconDown width={16} height={16} />
                    </button>
                    <SubmitButton variant="secondary">Simpan</SubmitButton>
                  </>
                )}
              </div>
              <input type="hidden" name="description" value={m.description ?? ""} />
              <input type="hidden" name="sortOrder" value={index} />
            </form>
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${status ? (status.ok ? "text-emerald-700" : "text-red-700") : "text-slate-500"}`}>
        {pending ? "Menyimpan urutan…" : (status?.message ?? (canConfigure ? "Seret ikon titik enam atau pakai tombol panah untuk mengubah urutan tampil di halaman donasi." : ""))}
      </p>
    </div>
  );
}
