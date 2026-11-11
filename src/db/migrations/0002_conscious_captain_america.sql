CREATE TYPE "public"."data_request_status" AS ENUM('OPEN', 'DONE', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."data_request_type" AS ENUM('ACCESS', 'DELETE');--> statement-breakpoint
CREATE TABLE "data_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "data_request_type" NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"details" text,
	"status" "data_request_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text
);
--> statement-breakpoint
ALTER TABLE "donors" ADD COLUMN "email_opt_out" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "donors" ADD COLUMN "anonymized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "cover_image_alt" text;--> statement-breakpoint
ALTER TABLE "news_posts" ADD COLUMN "cover_image_alt" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "consent_version" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "age_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_config" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "brand_config" ADD COLUMN "legal_form" text;--> statement-breakpoint
ALTER TABLE "brand_config" ADD COLUMN "registration_number" text;--> statement-breakpoint
ALTER TABLE "brand_config" ADD COLUMN "tax_id" text;--> statement-breakpoint
ALTER TABLE "brand_config" ADD COLUMN "privacy_contact_email" text;--> statement-breakpoint
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_requests_status_idx" ON "data_requests" USING btree ("status","created_at");