import { bigint, boolean, check, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { amountModeEnum, campaignCategoryEnum, campaignStatusEnum, closeReasonEnum } from "./enums";

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    descriptionMd: text("description_md").notNull(),
    targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
    raisedAmount: bigint("raised_amount", { mode: "number" }).notNull().default(0),
    amountMode: amountModeEnum("amount_mode").notNull(),
    category: campaignCategoryEnum("category").notNull().default("LAINNYA"),
    status: campaignStatusEnum("status").notNull().default("DRAFT"),
    closeReason: closeReasonEnum("close_reason"),
    autoCloseOnTarget: boolean("auto_close_on_target").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("campaigns_target_positive", sql`${t.targetAmount} > 0`),
    index("campaigns_status_published_idx").on(t.status, t.publishedAt),
    index("campaigns_status_ends_idx").on(t.status, t.endsAt),
  ],
);

export const campaignAmountOptions = pgTable(
  "campaign_amount_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    label: text("label"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    check("campaign_options_amount_positive", sql`${t.amount} > 0`),
    unique("campaign_options_campaign_amount_uq").on(t.campaignId, t.amount),
  ],
);
