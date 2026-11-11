import { getEnv, isDevelopment } from "@/lib/env";

/** Dev-only gateway simulator. Never active outside APP_ENV=development. */
export function simulatorEnabled(): boolean {
  return isDevelopment() && getEnv().PAYMENT_SIMULATOR;
}

export const SIM_MIDTRANS_SERVER_KEY = "SIM-Mid-server-dummy";
export const SIM_XENDIT_SECRET_KEY = "xnd_development_simulator";
export const SIM_XENDIT_WEBHOOK_TOKEN = "simulator-callback-token";

export function simulatorBaseUrl(): string {
  return `${getEnv().NEXT_PUBLIC_APP_URL}/api/dev/gateway`;
}
