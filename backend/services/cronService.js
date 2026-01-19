import cron from "node-cron";
import { resetAllWeeklyXP } from "../controllers/weeklyResetController.js";

/**
 * Initialize Cron Jobs
 * Schedule: "0 0 * * 1" = Every Monday at 00:00 IST
 */
export const initCronJobs = () => {
  // Weekly XP Reset - Every Monday at midnight IST
  cron.schedule(
    "0 0 * * 1",
    async () => {
      console.log(
        "⏰ [CRON] Weekly XP Reset triggered at:",
        new Date().toISOString(),
      );
      try {
        const result = await resetAllWeeklyXP();
        console.log("✅ [CRON] Weekly XP Reset completed:", result);
      } catch (error) {
        console.error("❌ [CRON] Weekly XP Reset failed:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log("✅ Cron Jobs Initialized (Weekly Reset: Monday 00:00 IST)");
};
