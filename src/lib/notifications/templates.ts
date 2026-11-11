export const EVENT_KEYS = ["DONATION_CREATED", "PAYMENT_SUCCEEDED", "PAYMENT_EXPIRED"] as const;
export type EventKey = (typeof EVENT_KEYS)[number];

export const EVENT_LABELS: Record<EventKey, string> = {
  DONATION_CREATED: "Donasi dibuat / instruksi pembayaran",
  PAYMENT_SUCCEEDED: "Pembayaran berhasil",
  PAYMENT_EXPIRED: "Pembayaran kedaluwarsa / gagal",
};

type DefaultTemplate = { templateKey: EventKey; channel: "EMAIL" | "WHATSAPP"; subject?: string; bodyText: string; bodyHtml?: string };

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    templateKey: "DONATION_CREATED",
    channel: "EMAIL",
    subject: "Selesaikan donasi Anda untuk {{campaign_title}}",
    bodyText:
      "Halo {{donor_name}},\n\nTerima kasih telah berniat berdonasi sebesar {{amount}} untuk \"{{campaign_title}}\".\nKode donasi: {{donation_code}}\n\nSelesaikan pembayaran di: {{payment_url}}\n\nSalam,\n{{brand_name}}",
    bodyHtml:
      "<p>Halo {{donor_name}},</p><p>Terima kasih telah berniat berdonasi sebesar <strong>{{amount}}</strong> untuk &quot;{{campaign_title}}&quot;.<br/>Kode donasi: <strong>{{donation_code}}</strong></p><p><a href=\"{{payment_url}}\">Selesaikan pembayaran</a></p><p>Salam,<br/>{{brand_name}}</p>",
  },
  {
    templateKey: "DONATION_CREATED",
    channel: "WHATSAPP",
    bodyText:
      "Halo {{donor_name}}, terima kasih atas niat donasi {{amount}} untuk \"{{campaign_title}}\" (kode {{donation_code}}). Selesaikan pembayaran di {{payment_url}} — {{brand_name}}",
  },
  {
    templateKey: "PAYMENT_SUCCEEDED",
    channel: "EMAIL",
    subject: "Donasi Anda berhasil — {{donation_code}}",
    bodyText:
      "Halo {{donor_name}},\n\nDonasi Anda sebesar {{amount}} untuk \"{{campaign_title}}\" telah kami terima. Terima kasih.\nKode donasi: {{donation_code}}\nBukti donasi (login untuk mengunduh): {{receipt_url}}\n\nSalam,\n{{brand_name}}",
    bodyHtml:
      "<p>Halo {{donor_name}},</p><p>Donasi Anda sebesar <strong>{{amount}}</strong> untuk &quot;{{campaign_title}}&quot; telah kami terima. Terima kasih.<br/>Kode donasi: <strong>{{donation_code}}</strong></p><p><a href=\"{{receipt_url}}\">Lihat bukti donasi</a> (perlu login)</p><p>Salam,<br/>{{brand_name}}</p>",
  },
  {
    templateKey: "PAYMENT_SUCCEEDED",
    channel: "WHATSAPP",
    bodyText:
      "Terima kasih {{donor_name}}! Donasi {{amount}} untuk \"{{campaign_title}}\" (kode {{donation_code}}) sudah kami terima. — {{brand_name}}",
  },
  {
    templateKey: "PAYMENT_EXPIRED",
    channel: "EMAIL",
    subject: "Pembayaran donasi {{donation_code}} tidak selesai",
    bodyText:
      "Halo {{donor_name}},\n\nPembayaran donasi {{amount}} untuk \"{{campaign_title}}\" (kode {{donation_code}}) kedaluwarsa atau gagal. Anda dapat membuat donasi baru kapan saja: {{payment_url}}\n\nSalam,\n{{brand_name}}",
    bodyHtml:
      "<p>Halo {{donor_name}},</p><p>Pembayaran donasi <strong>{{amount}}</strong> untuk &quot;{{campaign_title}}&quot; (kode {{donation_code}}) kedaluwarsa atau gagal. Anda dapat membuat donasi baru kapan saja.</p><p><a href=\"{{payment_url}}\">Lihat detail</a></p><p>Salam,<br/>{{brand_name}}</p>",
  },
  {
    templateKey: "PAYMENT_EXPIRED",
    channel: "WHATSAPP",
    bodyText: "Halo {{donor_name}}, pembayaran donasi {{donation_code}} tidak selesai. Anda bisa berdonasi lagi: {{payment_url}} — {{brand_name}}",
  },
];
