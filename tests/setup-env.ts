const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/donasibisa_test";
Object.assign(process.env, {
  NODE_ENV: "test",
  APP_ENV: "development",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  DATABASE_URL: url,
  AUTH_SECRET: "test-secret-test-secret-test-secret",
  ADMIN_EMAIL_ALLOWLIST: "admin@example.com",
  PAYMENT_SIMULATOR: "false",
  MIDTRANS_SERVER_KEY: "SB-Mid-server-test",
  PAYMENTS_MIDTRANS_ENABLED: "true",
  XENDIT_SECRET_KEY: "xnd_development_test",
  XENDIT_WEBHOOK_TOKEN: "test-callback-token",
  PAYMENTS_XENDIT_ENABLED: "true",
  NOTIFICATIONS_EMAIL_ENABLED: "false",
  NOTIFICATIONS_WHATSAPP_ENABLED: "false",
  QSTASH_TOKEN: "",
  UPSTASH_REDIS_REST_URL: "",
});
