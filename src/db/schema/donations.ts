import { bigint, boolean, check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { campaigns } from "./campaigns";
import { donors } from "./donors";
import { donationStatusEnum } from "./enums";

export const donations = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donationCode: text("donation_code").notNull().unique(),
    idempotencyKey: text("idempotency_key").unique(),
    campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
    donorId: uuid("donor_id").notNull().references(() => donors.id),
    amount: bigint("amount", { mode: "number" }).notNull(),
    status: donationStatusEnum("status").notNull().default("PENDING"),
    donorNameSnapshot: text("donor_name_snapshot").notNull(),
    donorEmailSnapshot: text("donor_email_snapshot").notNull(),
    donorWhatsappSnapshot: text("donor_whatsapp_snapshot"),
    message: text("message"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    whatsappOptInSnapshot: boolean("whatsapp_opt_in_snapshot").notNull().default(false),
    // Proof of consent at checkout (version of the legal texts + timestamp). No IP address is stored.
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    consentVersion: text("consent_version"),
    ageConfirmed: boolean("age_confirmed").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("donations_amount_positive", sql`${t.amount} > 0`),
    index("donations_campaign_status_idx").on(t.campaignId, t.status, t.createdAt),
    index("donations_donor_idx").on(t.donorId, t.createdAt),
    index("donations_status_expires_idx").on(t.status, t.expiresAt),
  ],
);
