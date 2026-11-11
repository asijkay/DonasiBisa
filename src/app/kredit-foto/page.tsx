import type { Metadata } from "next";
import { PageNav } from "@/components/public/page-nav";
import { PageHeading, Table, Td, Th } from "@/components/ui";
import credits from "@/lib/image-credits.json";

export const metadata: Metadata = { title: "Kredit foto" };

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Kredit foto" }]} />
      <PageHeading title="Kredit foto" />
      <p className="mb-4 text-sm text-slate-600">Foto ilustrasi pada landing page bersumber dari Wikimedia Commons berlisensi bebas (domain publik atau CC0). Foto bersifat ilustratif dan tidak merepresentasikan campaign tertentu.</p>
      <Table>
        <thead><tr><Th>Foto</Th><Th>Karya</Th><Th>Pembuat</Th><Th>Lisensi</Th></tr></thead>
        <tbody>
          {credits.map((c) => (
            <tr key={c.file}><Td>{c.file}</Td><Td><a className="text-brand-ink hover:underline" href={c.page} target="_blank" rel="noreferrer noopener">{c.title}</a></Td><Td>{c.author}</Td><Td>{c.license}</Td></tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
