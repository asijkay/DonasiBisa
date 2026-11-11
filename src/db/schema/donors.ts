import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const donors = pgTable("donors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").unique().references(() => users.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  normalizedEmail: text("normalized_email").notNull().unique(),
  whatsappNumber: text("whatsapp_number"),
  whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(false),
  /** Set via the unsubscribe link: suppresses every non-essential (non-receipt) message. */
  emailOptOut: boolean("email_opt_out").notNull().default(false),
  /** Set when the donor exercised the right to erasure; PII is replaced, financial rows are kept. */
  anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
