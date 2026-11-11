import Link from "next/link";
import { IconBack, IconSlash } from "./icons";
import { JsonLd } from "./json-ld";
import { siteUrl } from "@/lib/utils/site";

export type Crumb = { label: string; href?: string };

/**
 * Navigation to the parent page. Phones get one short "Kembali" button; from `sm` up the breadcrumb trail replaces it,
 * so the two never appear together. The trail is also emitted as BreadcrumbList structured data.
 */
export function PageNav({ crumbs, back }: { crumbs: Crumb[]; back?: { href: string; label?: string } }) {
  const parent = back ?? [...crumbs].slice(0, -1).reverse().find((c) => c.href);
  const backHref = parent && "href" in parent && parent.href ? parent.href : "/";
  const base = siteUrl();
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: `${base}${c.href}` } : {}) })),
  };
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <JsonLd data={breadcrumbs} />
      <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-card px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 sm:hidden">
        <IconBack width={16} height={16} /> {back?.label ?? "Kembali"}
      </Link>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                {c.href && !last ? (
                  <Link href={c.href} className="inline-block py-1 transition hover:text-brand-ink hover:underline">{c.label}</Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className={last ? "max-w-[24rem] truncate font-semibold text-slate-800" : ""}>{c.label}</span>
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
