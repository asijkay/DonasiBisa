export type DayPoint = { date: string; amount: number; count: number };

/** Formats a Date as YYYY-MM-DD in Asia/Jakarta (matches the SQL bucketing in dashboardCharts). */
export function jakartaDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Returns exactly `days` consecutive daily points ending at `end`, zero-filling days with no donations. */
export function fillDailySeries(rows: Array<{ date: string; amount: number; count: number }>, days: number, end: Date = new Date()): DayPoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = jakartaDay(new Date(end.getTime() - i * 86_400_000));
    const hit = byDate.get(date);
    out.push({ date, amount: hit?.amount ?? 0, count: hit?.count ?? 0 });
  }
  return out;
}

/** Short Indonesian money label for axes: 1,5 jt / 250 rb / 2,1 M. */
export function compactIDR(n: number): string {
  const fmt = (v: number, unit: string) => `${(Math.round(v * 10) / 10).toString().replace(".", ",")} ${unit}`;
  if (n >= 1_000_000_000) return fmt(n / 1_000_000_000, "M");
  if (n >= 1_000_000) return fmt(n / 1_000_000, "jt");
  if (n >= 1_000) return fmt(n / 1_000, "rb");
  return String(n);
}
