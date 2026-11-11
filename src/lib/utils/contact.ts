export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalizes Indonesian phone numbers to E.164 (+62...). Returns null when invalid.
 * Accepts 08xx, 628xx, +628xx and 8xx formats.
 */
export function normalizeWhatsapp(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let d = digits.startsWith("+") ? digits.slice(1) : digits;
  if (d.startsWith("0")) d = `62${d.slice(1)}`;
  else if (d.startsWith("8")) d = `62${d}`;
  if (!/^628\d{7,12}$/.test(d)) return null;
  return `+${d}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
