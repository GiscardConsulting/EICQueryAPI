import cron from "node-cron";
import { eicRefreshService } from "./eicRefreshService";

export function startCronJobs() {
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Running EIC data refresh (every 15 minutes)");
    await eicRefreshService.refreshEicData();
  });

  console.log("[Cron] Scheduled EIC data refresh to run every 15 minutes");

  console.log("[Cron] Running initial EIC data refresh...");
  eicRefreshService.refreshEicData().then((result) => {
    if (result.success) {
      console.log(`[Cron] Initial refresh completed: ${result.message}`);
    } else {
      console.error(`[Cron] Initial refresh failed: ${result.message}`);
    }
  });
}
