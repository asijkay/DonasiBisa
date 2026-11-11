import type { Provider } from "@/db/schema";
import { midtransAdapter } from "./providers/midtrans";
import { xenditAdapter } from "./providers/xendit";
import type { PaymentGatewayAdapter } from "./types";

const adapters: Record<Provider, PaymentGatewayAdapter> = {
  MIDTRANS: midtransAdapter,
  XENDIT: xenditAdapter,
};

export function getAdapter(provider: Provider): PaymentGatewayAdapter {
  return adapters[provider];
}

export function allAdapters(): PaymentGatewayAdapter[] {
  return Object.values(adapters);
}
