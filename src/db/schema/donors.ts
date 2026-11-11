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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
