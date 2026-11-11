import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDateTime, formatIDR } from "@/lib/utils/format";

export type ReceiptData = {
  brandName: string;
  contactEmail?: string | null;
  contactWhatsapp?: string | null;
  address?: string | null;
  donationCode: string;
  paidAt: Date;
  campaignTitle: string;
  amount: number;
  donorName: string;
  isAnonymous: boolean;
};

/** "Bukti Donasi" — explicitly not a tax receipt. Built from the donation snapshot. */
export async function buildDonationReceipt(d: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.12, 0.16);
  const muted = rgb(0.4, 0.43, 0.48);

  let y = 780;
  const text = (s: string, opts: { size?: number; b?: boolean; color?: ReturnType<typeof rgb>; x?: number } = {}) => {
    // Standard fonts only cover WinAnsi: replace anything else to avoid encoding errors.
    const safe = s.replace(/[^\x20-\x7E -ÿ]/g, "?");
    page.drawText(safe, { x: opts.x ?? 56, y, size: opts.size ?? 11, font: opts.b ? bold : font, color: opts.color ?? ink });
    y -= (opts.size ?? 11) + 8;
  };

  text(d.brandName, { size: 18, b: true });
  y -= 6;
  text("BUKTI DONASI", { size: 22, b: true });
  text("Dokumen ini adalah bukti donasi, bukan kuitansi pajak.", { size: 9, color: muted });
  y -= 14;

  const rows: Array<[string, string]> = [
    ["Kode donasi", d.donationCode],
    ["Tanggal pembayaran", formatDateTime(d.paidAt)],
    ["Campaign", d.campaignTitle],
    ["Donatur", d.isAnonymous ? "Donatur Anonim" : d.donorName],
    ["Nominal", formatIDR(d.amount)],
    ["Status", "LUNAS"],
  ];
  for (const [k, v] of rows) {
    page.drawText(k, { x: 56, y, size: 10, font, color: muted });
    page.drawText(v.replace(/[^\x20-\x7E -ÿ]/g, "?"), { x: 200, y, size: 11, font: k === "Nominal" ? bold : font, color: ink });
    y -= 22;
  }

  y -= 30;
  text("Terima kasih atas kebaikan Anda.", { size: 11, b: true });
  const contact = [d.contactEmail, d.contactWhatsapp, d.address].filter(Boolean).join("  |  ");
  if (contact) text(contact, { size: 9, color: muted });

  return pdf.save();
}
