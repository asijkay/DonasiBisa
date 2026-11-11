CREATE TYPE "public"."campaign_category" AS ENUM('PENDIDIKAN', 'KESEHATAN', 'BENCANA', 'SOSIAL', 'LAINNYA');--> statement-breakpoint
ALTER TABLE "brand_config" ALTER COLUMN "accent_color" SET DEFAULT '#ff6b57';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "category" "campaign_category" DEFAULT 'LAINNYA' NOT NULL;