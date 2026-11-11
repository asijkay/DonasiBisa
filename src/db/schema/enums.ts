import { pgEnum } from "drizzle-orm/pg-core";

export const ROLES = ["SUPER_ADMIN", "CAMPAIGN_ADMIN", "FINANCE_ADMIN", "CONTENT_ADMIN"] as const;
export const AMOUNT_MODES = ["OPEN_AMOUNT", "CLOSED_AMOUNT"] as const;
export const CAMPAIGN_STATUSES = ["DRAFT", "PUBLISHED", "PAUSED", "COMPLETED", "CLOSED", "ARCHIVED"] as const;
export const CLOSE_REASONS = ["TARGET_REACHED", "END_DATE", "MANUAL"] as const;
export const DONATION_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "EXPIRED", "CANCELLED", "REFUNDED"] as const;
export const PAYMENT_STATUSES = ["CREATED", "PENDING", "SUCCEEDED", "FAILED", "EXPIRED", "CANCELLED", "REFUNDED"] as const;
export const PROVIDERS = ["MIDTRANS", "XENDIT"] as const;
export const PROVIDER_ENVIRONMENTS = ["SANDBOX", "PRODUCTION"] as const;
export const NOTIFICATION_CHANNELS = ["EMAIL", "WHATSAPP"] as const;
export const NOTIFICATION_STATUSES = ["QUEUED", "SENT", "FAILED", "SKIPPED"] as const;
export const NEWS_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const WEBHOOK_PROCESSING_STATUSES = ["RECEIVED", "PROCESSED", "IGNORED", "FAILED"] as const;

export type Role = (typeof ROLES)[number];
export type AmountMode = (typeof AMOUNT_MODES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type CloseReason = (typeof CLOSE_REASONS)[number];
export type DonationStatus = (typeof DONATION_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type Provider = (typeof PROVIDERS)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const roleEnum = pgEnum("role", ROLES);
export const amountModeEnum = pgEnum("amount_mode", AMOUNT_MODES);
export const campaignStatusEnum = pgEnum("campaign_status", CAMPAIGN_STATUSES);
export const closeReasonEnum = pgEnum("close_reason", CLOSE_REASONS);
export const donationStatusEnum = pgEnum("donation_status", DONATION_STATUSES);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);
export const providerEnum = pgEnum("provider", PROVIDERS);
export const providerEnvironmentEnum = pgEnum("provider_environment", PROVIDER_ENVIRONMENTS);
export const notificationChannelEnum = pgEnum("notification_channel", NOTIFICATION_CHANNELS);
export const notificationStatusEnum = pgEnum("notification_status", NOTIFICATION_STATUSES);
export const newsStatusEnum = pgEnum("news_status", NEWS_STATUSES);
export const webhookProcessingStatusEnum = pgEnum("webhook_processing_status", WEBHOOK_PROCESSING_STATUSES);
