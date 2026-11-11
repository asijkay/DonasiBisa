import { z } from "zod";
import { AMOUNT_MODES, CAMPAIGN_CATEGORIES, NEWS_STATUSES, PROVIDERS } from "@/db/schema/enums";
import { isSafeHttpUrl } from "@/lib/utils/security";

/** HTTPS URL, or a same-origin path such as /images/x.webp (never protocol-relative //host). */
const httpUrl = z
  .string()
  .trim()
  .refine((v) => isSafeHttpUrl(v, { allowLocalhostHttp: true }) || (v.startsWith("/") && !v.startsWith("//")), "URL harus diawali https://");

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(httpUrl.optional());

const slug = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung");

export const donationInputSchema = z.object({
  campaignSlug: z.string().trim().min(1).max(120),
  amount: z.number().int().positive().max(1_000_000_000_000).nullish(),
  amountOptionId: z.string().uuid().nullish(),
  donor: z.object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    email: z.string().trim().max(254).pipe(z.email("Email tidak valid")),
    // Data minimisation: the phone number is collected ONLY when the donor opts in to WhatsApp.
    whatsapp: z.string().trim().max(20).nullish(),
    whatsappOptIn: z.boolean().default(false),
  }),
  message: z.string().trim().max(500).nullish(),
  isAnonymous: z.boolean().default(false),
  // Explicit, unticked-by-default consents (must be affirmatively true).
  acceptedTerms: z.literal(true, { error: "Anda harus menyetujui Syarat Layanan dan Kebijakan Privasi." }),
  ageConfirmed: z.literal(true, { error: "Konfirmasi usia atau persetujuan orang tua/wali diperlukan." }),
}).superRefine((v, ctx) => {
  if (v.donor.whatsappOptIn && (!v.donor.whatsapp || v.donor.whatsapp.trim().length < 8)) {
    ctx.addIssue({ code: "custom", path: ["donor", "whatsapp"], message: "Isi nomor WhatsApp untuk menerima notifikasi WhatsApp." });
  }
});
export type DonationInput = z.infer<typeof donationInputSchema>;

export const createPaymentSchema = z.object({
  provider: z.enum(PROVIDERS),
  channelCode: z.string().trim().min(1).max(60),
});

export const campaignInputSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug,
  summary: z.string().trim().min(10).max(300),
  descriptionMd: z.string().trim().min(10).max(20000),
  targetAmount: z.number().int().positive(),
  amountMode: z.enum(AMOUNT_MODES),
  category: z.enum(CAMPAIGN_CATEGORIES).default("LAINNYA"),
  autoCloseOnTarget: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  startsAt: z.date().nullish(),
  endsAt: z.date().nullish(),
  coverImageUrl: optionalUrl,
  coverImageAlt: z.string().trim().max(200).optional().transform((v) => v || undefined),
  amountOptions: z
    .array(z.object({ amount: z.number().int().positive(), label: z.string().trim().max(60).optional() }))
    .max(12)
    .default([]),
});
export type CampaignInput = z.infer<typeof campaignInputSchema>;

export const newsInputSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug,
  excerpt: z.string().trim().min(10).max(300),
  bodyMd: z.string().trim().min(10).max(50000),
  coverImageUrl: optionalUrl,
  coverImageAlt: z.string().trim().max(200).optional().transform((v) => v || undefined),
  campaignId: z.string().uuid().nullish(),
  status: z.enum(NEWS_STATUSES),
});
export type NewsInput = z.infer<typeof newsInputSchema>;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB");
export const brandInputSchema = z.object({
  brandName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(200).optional(),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  primaryColor: hex,
  secondaryColor: hex,
  accentColor: hex,
  backgroundColor: hex,
  contactEmail: z.string().trim().pipe(z.email()).optional().or(z.literal("").transform(() => undefined)),
  contactWhatsapp: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  legalName: z.string().trim().max(150).optional(),
  legalForm: z.string().trim().max(60).optional(),
  registrationNumber: z.string().trim().max(80).optional(),
  taxId: z.string().trim().max(40).optional(),
  privacyContactEmail: z.string().trim().pipe(z.email()).optional().or(z.literal("").transform(() => undefined)),
  website: optionalUrl,
  ctaLabel: z.string().trim().min(2).max(40),
  footerText: z.string().trim().max(300).optional(),
  socialLinks: z.record(z.string(), z.string()).default({}),
});

export const TEMPLATE_PLACEHOLDERS = [
  "donor_name",
  "donation_code",
  "campaign_title",
  "amount",
  "payment_url",
  "receipt_url",
  "brand_name",
] as const;

export const templateInputSchema = z.object({
  subject: z.string().trim().max(200).optional(),
  bodyText: z.string().trim().min(5).max(5000),
  bodyHtml: z.string().trim().max(20000).optional(),
  isActive: z.boolean(),
});
