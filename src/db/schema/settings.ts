import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const brandConfig = pgTable("brand_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Singleton guard: unique index allows only one row.
  singleton: boolean("singleton").notNull().default(true).unique(),
  brandName: text("brand_name").notNull(),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").notNull().default("#0f766e"),
  secondaryColor: text("secondary_color").notNull().default("#334155"),
  accentColor: text("accent_color").notNull().default("#ff6b57"),
  backgroundColor: text("background_color").notNull().default("#ffffff"),
  contactEmail: text("contact_email"),
  contactWhatsapp: text("contact_whatsapp"),
  address: text("address"),
  // Business details shown on legal pages, in the footer and on the About/Contact page.
  legalName: text("legal_name"),
  legalForm: text("legal_form"),
  registrationNumber: text("registration_number"),
  taxId: text("tax_id"),
  privacyContactEmail: text("privacy_contact_email"),
  website: text("website"),
  ctaLabel: text("cta_label").notNull().default("Donasi Sekarang"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().notNull().default({}),
  footerText: text("footer_text"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
