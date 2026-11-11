const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function formatIDR(amount: number): string {
  return idr.format(amount);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(date));
}

export function progressPercent(raised: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.floor((raised / target) * 100));
}

/** Whole days left until `endsAt` (never negative); null when the campaign has no end date. */
export function daysLeft(endsAt: string | null | undefined, now: Date = new Date()): number | null {
  if (!endsAt) return null;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 86_400_000));
}
