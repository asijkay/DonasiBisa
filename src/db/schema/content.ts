import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { campaigns } from "./campaigns";
import { newsStatusEnum } from "./enums";

export const newsPosts = pgTable(
  "news_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    bodyMd: text("body_md").notNull(),
    coverImageUrl: text("cover_image_url"),
    status: newsStatusEnum("status").notNull().default("DRAFT"),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("news_status_published_idx").on(t.status, t.publishedAt),
    index("news_campaign_status_idx").on(t.campaignId, t.status),
  ],
);
