import { TEMPLATE_PLACEHOLDERS } from "@/lib/validation/schemas";

const ALLOWED = new Set<string>(TEMPLATE_PLACEHOLDERS);
const TOKEN = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns placeholder names that are not in the allowlist. Used to validate admin edits. */
export function findUnknownPlaceholders(...templates: Array<string | undefined>): string[] {
  const unknown = new Set<string>();
  for (const t of templates) {
    if (!t) continue;
    for (const m of t.matchAll(TOKEN)) if (!ALLOWED.has(m[1])) unknown.add(m[1]);
  }
  return [...unknown];
}

export type TemplateVars = Partial<Record<(typeof TEMPLATE_PLACEHOLDERS)[number], string>>;

/**
 * Server-side render with allowlisted placeholders. In HTML mode every value is escaped;
 * unknown placeholders render as empty string.
 */
export function renderTemplate(template: string, vars: TemplateVars, mode: "text" | "html"): string {
  return template.replace(TOKEN, (_, key: string) => {
    if (!ALLOWED.has(key)) return "";
    const value = vars[key as keyof TemplateVars] ?? "";
    return mode === "html" ? escapeHtml(value) : value;
  });
}
