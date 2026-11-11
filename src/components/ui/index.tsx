import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const btnVariants = {
  primary: "bg-brand text-white hover:brightness-110",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-700 hover:bg-slate-100",
} as const;
type Variant = keyof typeof btnVariants;

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(btnBase, btnVariants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; href: string }) {
  return <Link href={href} className={cn(btnBase, btnVariants[variant], className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</div>;
}

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-800">
      {children}
      {hint && <span className="ml-1 font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, className)} {...props} />;
}
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, className)} {...props} />;
}
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, className)} {...props} />;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-700">
      {children}
    </p>
  );
}

const tones = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

const STATUS_TONE: Record<string, keyof typeof tones> = {
  SUCCEEDED: "success",
  PUBLISHED: "success",
  SENT: "success",
  PENDING: "warning",
  CREATED: "warning",
  QUEUED: "warning",
  PAUSED: "warning",
  DRAFT: "neutral",
  SKIPPED: "neutral",
  ARCHIVED: "neutral",
  COMPLETED: "info",
  CLOSED: "info",
  FAILED: "danger",
  EXPIRED: "danger",
  CANCELLED: "danger",
  REFUNDED: "info",
};
const STATUS_LABEL: Record<string, string> = {
  SUCCEEDED: "Berhasil",
  PENDING: "Menunggu",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dikembalikan",
  PUBLISHED: "Dipublikasikan",
  DRAFT: "Draft",
  PAUSED: "Dijeda",
  COMPLETED: "Selesai",
  CLOSED: "Ditutup",
  ARCHIVED: "Diarsipkan",
};

/** Status is always shown as text (not color alone) for accessibility. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progres donasi"}
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "danger"; title?: string; children: ReactNode }) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  } as const;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-lg border p-4 text-sm", styles[tone])}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-600">{children}</div>}
    </div>
  );
}

export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {children}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export const Th = ({ children }: { children?: ReactNode }) => (
  <th scope="col" className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-700">
    {children}
  </th>
);
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <td className={cn("border-b border-slate-100 px-4 py-2.5 align-top text-slate-800", className)}>{children}</td>
);
