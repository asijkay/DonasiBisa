import { expirePayments } from "@/services/payments.service";
import { runSignedJob } from "../_run";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return runSignedJob(request, () => expirePayments());
}
