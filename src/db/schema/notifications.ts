import { boolean, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { donations } from "./donations";
import { notificationChannelEnum, notificationStatusEnum } from "./enums";

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateKey: text("template_key").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    subject: text("subject"),
    bodyText: text("body_text").notNull(),
    bodyHtml: text("body_html"),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("notification_templates_key_channel_uq").on(t.templateKey, t.channel)],
);

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donationId: uuid("donation_id").notNull().references(() => donations.id),
    templateId: uuid("template_id").references(() => notificationTemplates.id, { onDelete: "set null" }),
    eventKey: text("event_key").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    recipient: text("recipient").notNull(),
    status: notificationStatusEnum("status").notNull().default("QUEUED"),
    attempts: integer("attempts").notNull().default(0),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    metadataSanitized: jsonb("metadata_sanitized").$type<Record<string, unknown>>(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("notification_logs_idempotency_uq").on(t.donationId, t.channel, t.eventKey),
    index("notification_logs_status_idx").on(t.status, t.createdAt),
  ],
);
