CREATE TYPE "public"."amount_mode" AS ENUM('OPEN_AMOUNT', 'CLOSED_AMOUNT');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'PUBLISHED', 'PAUSED', 'COMPLETED', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."close_reason" AS ENUM('TARGET_REACHED', 'END_DATE', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."news_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('QUEUED', 'SENT', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('MIDTRANS', 'XENDIT');--> statement-breakpoint
CREATE TYPE "public"."provider_environment" AS ENUM('SANDBOX', 'PRODUCTION');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."webhook_processing_status" AS ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_role_uq" UNIQUE("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "donors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"whatsapp_number" text,
	"whatsapp_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donors_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "donors_normalized_email_unique" UNIQUE("normalized_email")
);
--> statement-breakpoint
CREATE TABLE "campaign_amount_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"label" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "campaign_options_campaign_amount_uq" UNIQUE("campaign_id","amount"),
	CONSTRAINT "campaign_options_amount_positive" CHECK ("campaign_amount_options"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description_md" text NOT NULL,
	"target_amount" bigint NOT NULL,
	"raised_amount" bigint DEFAULT 0 NOT NULL,
	"amount_mode" "amount_mode" NOT NULL,
	"status" "campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"close_reason" "close_reason",
	"auto_close_on_target" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"cover_image_url" text,
	"created_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_slug_unique" UNIQUE("slug"),
	CONSTRAINT "campaigns_target_positive" CHECK ("campaigns"."target_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "news_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body_md" text NOT NULL,
	"cover_image_url" text,
	"status" "news_status" DEFAULT 'DRAFT' NOT NULL,
	"author_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_code" text NOT NULL,
	"idempotency_key" text,
	"campaign_id" uuid NOT NULL,
	"donor_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"status" "donation_status" DEFAULT 'PENDING' NOT NULL,
	"donor_name_snapshot" text NOT NULL,
	"donor_email_snapshot" text NOT NULL,
	"donor_whatsapp_snapshot" text,
	"message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"whatsapp_opt_in_snapshot" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donations_donation_code_unique" UNIQUE("donation_code"),
	CONSTRAINT "donations_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "donations_amount_positive" CHECK ("donations"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid,
	"provider" "provider" NOT NULL,
	"event_type" text NOT NULL,
	"status_before" text,
	"status_after" text,
	"metadata_sanitized" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_method_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"channel_code" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"instruction_template" jsonb,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_method_provider_channel_uq" UNIQUE("provider_id","channel_code")
);
--> statement-breakpoint
CREATE TABLE "payment_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider" NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"environment" "provider_environment" DEFAULT 'SANDBOX' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_providers_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"provider_reference" text NOT NULL,
	"provider_payment_id" text,
	"channel_code" text NOT NULL,
	"payment_method" text,
	"status" "payment_status" DEFAULT 'CREATED' NOT NULL,
	"checkout_url" text,
	"instruction_data" jsonb,
	"provider_metadata" jsonb,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_reference_uq" UNIQUE("provider","provider_reference")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider" NOT NULL,
	"external_event_id" text NOT NULL,
	"provider_reference" text,
	"event_type" text NOT NULL,
	"payload_sanitized" jsonb,
	"processing_status" "webhook_processing_status" DEFAULT 'RECEIVED' NOT NULL,
	"error_message" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "webhook_events_provider_event_uq" UNIQUE("provider","external_event_id")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"template_id" uuid,
	"event_key" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"recipient" text NOT NULL,
	"status" "notification_status" DEFAULT 'QUEUED' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"metadata_sanitized" jsonb,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_logs_idempotency_uq" UNIQUE("donation_id","channel","event_key")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_key" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"subject" text,
	"body_text" text NOT NULL,
	"body_html" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_templates_key_channel_uq" UNIQUE("template_key","channel")
);
--> statement-breakpoint
CREATE TABLE "brand_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singleton" boolean DEFAULT true NOT NULL,
	"brand_name" text NOT NULL,
	"tagline" text,
	"logo_url" text,
	"favicon_url" text,
	"primary_color" text DEFAULT '#0f766e' NOT NULL,
	"secondary_color" text DEFAULT '#334155' NOT NULL,
	"accent_color" text DEFAULT '#f59e0b' NOT NULL,
	"background_color" text DEFAULT '#ffffff' NOT NULL,
	"contact_email" text,
	"contact_whatsapp" text,
	"address" text,
	"website" text,
	"cta_label" text DEFAULT 'Donasi Sekarang' NOT NULL,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"footer_text" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_config_singleton_unique" UNIQUE("singleton")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"before_data" jsonb,
	"after_data" jsonb,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donors" ADD CONSTRAINT "donors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_amount_options" ADD CONSTRAINT "campaign_amount_options_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method_configs" ADD CONSTRAINT "payment_method_configs_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_status_published_idx" ON "campaigns" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "campaigns_status_ends_idx" ON "campaigns" USING btree ("status","ends_at");--> statement-breakpoint
CREATE INDEX "news_status_published_idx" ON "news_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "news_campaign_status_idx" ON "news_posts" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "donations_campaign_status_idx" ON "donations" USING btree ("campaign_id","status","created_at");--> statement-breakpoint
CREATE INDEX "donations_donor_idx" ON "donations" USING btree ("donor_id","created_at");--> statement-breakpoint
CREATE INDEX "donations_status_expires_idx" ON "donations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "payment_logs_created_idx" ON "payment_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_donation_idx" ON "payments" USING btree ("donation_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_provider_payment_idx" ON "payments" USING btree ("provider","provider_payment_id");--> statement-breakpoint
CREATE INDEX "notification_logs_status_idx" ON "notification_logs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");