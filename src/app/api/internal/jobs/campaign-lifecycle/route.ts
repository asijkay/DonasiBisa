import { runCampaignLifecycle } from "@/services/campaigns.service";
import { runSignedJob } from "../_run";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return runSignedJob(request, () => runCampaignLifecycle());
}
