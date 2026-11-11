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
