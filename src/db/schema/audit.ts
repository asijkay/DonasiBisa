import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { dataRequestStatusEnum, dataRequestTypeEnum } from "./enums";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    beforeData: jsonb("before_data").$type<Record<string, unknown>>(),
    afterData: jsonb("after_data").$type<Record<string, unknown>>(),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

export const dataRequests = pgTable(
  "data_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: dataRequestTypeEnum("type").notNull(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    details: text("details"),
    status: dataRequestStatusEnum("status").notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [index("data_requests_status_idx").on(t.status, t.createdAt)],
);
