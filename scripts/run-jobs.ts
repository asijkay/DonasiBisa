import { closeDb } from "../src/db";
import { runCampaignLifecycle } from "../src/services/campaigns.service";
import { expirePayments } from "../src/services/payments.service";
import { retryFailedNotifications } from "../src/services/notifications.service";

/** Local equivalent of the QStash schedules: `npm run jobs:run`. */
async function main(): Promise<void> {
  console.log("campaign-lifecycle", await runCampaignLifecycle());
  console.log("expire-payments", await expirePayments());
  console.log("notification-retry", await retryFailedNotifications());
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
