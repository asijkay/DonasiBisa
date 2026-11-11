"use client";

import { useEffect, useSyncExternalStore } from "react";
import { IconMonitor, IconMoon, IconSun } from "./icons";
import { cn } from "@/components/ui";
import { readThemePreference, storeThemePreference } from "@/lib/consent-client";

type Pref = "system" | "light" | "dark";
const OPTIONS: Array<{ value: Pref; label: string; Icon: typeof IconSun }> = [
  { value: "system", label: "Ikuti perangkat", Icon: IconMonitor },
  { value: "light", label: "Mode terang", Icon: IconSun },
  { value: "dark", label: "Mode gelap", Icon: IconMoon },
];

function apply(pref: Pref): void {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Light / dark / system (default). Choice is stored per browser; "system" follows the device live. */
function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener("theme-change", cb);
  window.addEventListener("consent-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("theme-change", cb);
    window.removeEventListener("consent-change", cb);
  };
}

function readPref(): Pref {
  return readThemePreference();
}

export function ThemeToggle({ className }: { className?: string }) {
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as Pref);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  function choose(next: Pref) {
    storeThemePreference(next);
    apply(next);
    window.dispatchEvent(new Event("theme-change"));
  }

  return (
    <div role="radiogroup" aria-label="Tema tampilan" className={cn("inline-flex rounded-full border border-slate-300 bg-card p-0.5", className)}>
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={cn("flex h-8 w-8 items-center justify-center rounded-full transition", pref === value ? "bg-brand text-white shadow" : "text-slate-600 hover:text-brand-ink")}
        >
          <Icon width={16} height={16} />
        </button>
      ))}
    </div>
  );
}
