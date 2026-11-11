import { formatIDR } from "@/lib/utils/format";
import { compactIDR, type DayPoint } from "@/lib/utils/series";
import { StatusBadge } from "@/components/ui";

const W = 720;
const H = 220;
const PAD = { l: 48, r: 8, t: 8, b: 28 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const dayLabel = (iso: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** 30-day column chart of succeeded donation value. Single series in the brand color; hover a column for the exact value. */
export function DailyChart({ data }: { data: DayPoint[] }) {
  const max = niceMax(Math.max(...data.map((d) => d.amount)));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / data.length;
  const bw = Math.max(4, slot - 6);
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const total = data.reduce((a, d) => a + d.amount, 0);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Nilai donasi berhasil per hari, 30 hari terakhir. Total ${formatIDR(total)}.`} className="h-auto w-full">
        {ticks.map((t) => {
          const y = PAD.t + ih - (t / max) * ih;
          return (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="stroke-slate-200" strokeWidth={1} />
              <text x={PAD.l - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px]">{compactIDR(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.amount / max) * ih;
          const x = PAD.l + i * slot + (slot - bw) / 2;
          return (
            <g key={d.date} className="group">
              <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={ih} fill="transparent" />
              {d.amount > 0 && <rect x={x} y={PAD.t + ih - h} width={bw} height={h} rx={3} style={{ fill: "var(--brand-primary)" }} className="opacity-80 transition-opacity duration-200 group-hover:opacity-100" />}
              <title>{`${dayLabel(d.date)}: ${formatIDR(d.amount)} (${d.count} donasi)`}</title>
              {(i === 0 || i === 14 || i === data.length - 1) && <text x={x + bw / 2} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-slate-500 text-[11px]">{dayLabel(d.date)}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">Tabel data tersedia pada bagian &quot;Lihat data&quot; di bawah grafik.</figcaption>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-brand-ink">Lihat data</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full text-left"><thead><tr><th className="px-4 py-2">Tanggal</th><th className="px-4 py-2">Donasi</th><th className="px-4 py-2">Nilai</th></tr></thead>
            <tbody>{data.filter((d) => d.count > 0).map((d) => (<tr key={d.date} className="border-t border-slate-100"><td className="px-4 py-2">{dayLabel(d.date)}</td><td className="px-4 py-2">{d.count}</td><td className="px-4 py-2">{formatIDR(d.amount)}</td></tr>))}</tbody></table>
        </div>
      </details>
    </figure>
  );
}

/** Horizontal bars, one hue, labelled directly (no legend needed for a single series). */
export function BarList({ rows, empty }: { rows: Array<{ label: string; value: number; sub?: string }>; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-slate-600">{empty}</p>;
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="truncate font-medium text-slate-800" title={r.label}>{r.label}</span>
            <span className="shrink-0 font-semibold text-slate-900">{formatIDR(r.value)}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(r.value / max) * 100}%`, background: "var(--brand-primary)" }} />
          </div>
          {r.sub && <p className="mt-1 text-xs text-slate-500">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Outcome mix as labelled rows (status is shown as text via StatusBadge, never color alone). */
export function StatusMix({ rows }: { rows: Array<{ status: string; count: number }> }) {
  const total = rows.reduce((a, r) => a + r.count, 0);
  if (total === 0) return <p className="text-sm text-slate-600">Belum ada transaksi.</p>;
  return (
    <ul className="space-y-4">
      {[...rows].sort((a, b) => b.count - a.count).map((r) => (
        <li key={r.status}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <StatusBadge status={r.status} />
            <span className="font-semibold text-slate-900">{r.count} <span className="font-normal text-slate-500">· {Math.round((r.count / total) * 100)}%</span></span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(r.count / total) * 100}%`, background: "var(--brand-primary)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
