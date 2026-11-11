"use client";

import { useRef, type ReactNode } from "react";
import { IconMenu } from "./icons";

/** Mobile navigation as a native <details>; Esc closes it and returns focus to the toggle, links close it. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => {
    ref.current?.removeAttribute("open");
    ref.current?.querySelector("summary")?.focus();
  };
  return (
    <details
      ref={ref}
      className="relative xl:hidden"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) ref.current?.removeAttribute("open");
      }}
    >
      <summary className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-800" aria-label="Menu navigasi">
        <IconMenu width={20} height={20} />
      </summary>
      <div className="absolute right-0 mt-2 w-64 space-y-1 rounded-2xl border border-slate-200 bg-card p-3 shadow-xl">{children}</div>
    </details>
  );
}
