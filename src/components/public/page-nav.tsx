import Link from "next/link";
import { IconBack, IconSlash } from "./icons";

export type Crumb = { label: string; href?: string };

/** Back button (to the nearest parent) + accessible breadcrumb trail. */
export function PageNav({ crumbs, back }: { crumbs: Crumb[]; back?: { href: string; label?: string } }) {
  const parent = back ?? [...crumbs].slice(0, -1).reverse().find((c) => c.href);
  const backHref = parent ? ("href" in parent && parent.href ? parent.href : "/") : "/";
  const backLabel = back?.label ?? (parent && "label" in parent ? `Kembali ke ${(parent as Crumb).label}` : "Kembali");
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-card px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand-ink">
        <IconBack width={16} height={16} /> {backLabel}
      </Link>
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                {c.href && !last ? (
                  <Link href={c.href} className="transition hover:text-brand-ink hover:underline">{c.label}</Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className={last ? "max-w-[16rem] truncate font-semibold text-slate-800" : ""}>{c.label}</span>
                )}
                {!last && <IconSlash width={14} height={14} className="shrink-0 text-slate-400" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
