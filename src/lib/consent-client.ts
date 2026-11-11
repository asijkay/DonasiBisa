"use client";

/** Cookie/storage consent, kept in localStorage (the choice itself is "strictly necessary" state). */
export type Consent = { v: 1; functional: boolean; at: string };

const KEY = "consent";
const MAX_AGE_MS = 365 * 24 * 3600 * 1000;

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    if (c.v !== 1 || Date.now() - new Date(c.at).getTime() > MAX_AGE_MS) return null; // ask again after 12 months
    return c;
  } catch {
    return null;
  }
}

export function saveConsent(functional: boolean): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, functional, at: new Date().toISOString() } satisfies Consent));
    if (!functional) {
      // Withdrawing consent removes what the preference category stored.
      const theme = localStorage.getItem("theme");
      localStorage.removeItem("theme");
      if (theme) sessionStorage.setItem("theme", theme);
    }
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event("consent-change"));
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event("cookie-settings"));
}

/** Preference storage obeys consent: localStorage only with consent, otherwise this tab's sessionStorage. */
export function storeThemePreference(value: string): void {
  try {
    if (readConsent()?.functional) {
      localStorage.setItem("theme", value);
      sessionStorage.removeItem("theme");
    } else {
      sessionStorage.setItem("theme", value);
    }
  } catch {
    /* ignore */
  }
}

export function readThemePreference(): "light" | "dark" | "system" {
  try {
    const v = localStorage.getItem("theme") ?? sessionStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}
