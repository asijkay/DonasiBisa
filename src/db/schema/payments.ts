import { boolean, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { donations } from "./donations";
import {
  paymentStatusEnum,
  providerEnum,
  providerEnvironmentEnum,
  webhookProcessingStatusEnum,
} from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donationId: uuid("donation_id").notNull().references(() => donations.id),
    provider: providerEnum("provider").notNull(),
    providerReference: text("provider_reference").notNull(),
    providerPaymentId: text("provider_payment_id"),
    channelCode: text("channel_code").notNull(),
    paymentMethod: text("payment_method"),
    status: paymentStatusEnum("status").notNull().default("CREATED"),
    checkoutUrl: text("checkout_url"),
    instructionData: jsonb("instruction_data").$type<Record<string, unknown>>(),
    providerMetadata: jsonb("provider_metadata").$type<Record<string, unknown>>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("payments_provider_reference_uq").on(t.provider, t.providerReference),
    index("payments_donation_idx").on(t.donationId, t.createdAt),
    index("payments_provider_payment_idx").on(t.provider, t.providerPaymentId),
  ],
);

export const paymentProviders = pgTable("payment_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: providerEnum("provider").notNull().unique(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  environment: providerEnvironmentEnum("environment").notNull().default("SANDBOX"),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentMethodConfigs = pgTable(
  "payment_method_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id").notNull().references(() => paymentProviders.id, { onDelete: "cascade" }),
    channelCode: text("channel_code").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    instructionTemplate: jsonb("instruction_template").$type<Record<string, unknown>>(),
    isEnabled: boolean("is_enabled").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("payment_method_provider_channel_uq").on(t.providerId, t.channelCode)],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: providerEnum("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    providerReference: text("provider_reference"),
    eventType: text("event_type").notNull(),
    payloadSanitized: jsonb("payload_sanitized").$type<Record<string, unknown>>(),
    processingStatus: webhookProcessingStatusEnum("processing_status").notNull().default("RECEIVED"),
    errorMessage: text("error_message"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [unique("webhook_events_provider_event_uq").on(t.provider, t.externalEventId)],
);

export const paymentLogs = pgTable(
  "payment_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    provider: providerEnum("provider").notNull(),
    eventType: text("event_type").notNull(),
    statusBefore: text("status_before"),
    statusAfter: text("status_after"),
    metadataSanitized: jsonb("metadata_sanitized").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payment_logs_created_idx").on(t.createdAt)],
);
