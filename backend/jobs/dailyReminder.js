import cron from "node-cron";
import { db, admin } from "../server.js";
import { sendNotification } from "../services/notificationService.js";

const setupDailyReminder = () => {
  // Run every hour at minute 0 (e.g., 10:00, 11:00)
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ [Cron] Running Daily Bounty Check...");

    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Query users eligible for notification
      // 1. Last claimed is older than 24h OR never claimed (if implementing first-time nudges, but MVP focuses on resets)
      // 2. We only want to notify if the RESET just happened or hasn't been notified yet
      // 3. User has NOT been notified in the last 24h (prevent hourly spam)

      const usersRef = db.collection("users");
      const snapshot = await usersRef
        .where(
          "lastClaimed",
          "<=",
          admin.firestore.Timestamp.fromDate(twentyFourHoursAgo),
        )
        .get();

      let count = 0;

      const batchPromises = snapshot.docs.map(async (doc) => {
        const userData = doc.data();

        // Check if we already notified them recently (idempotency/spam prevention)
        const lastNotified = userData.lastDailyNotificationSent?.toDate();
        if (lastNotified && lastNotified > twentyFourHoursAgo) {
          return; // Already notified in this cycle
        }

        // Double check they actually have a token before trying
        if (!userData.fcmToken) return;

        // Send Notification
        await sendNotification(
          doc.id,
          "Bounty Reset! 💎",
          "Your Daily Bounty is ready. Claim your +50 XP now!",
        );

        // Update lastDailyNotificationSent to NOW
        // using db.collection...doc.update() directly to avoid concurrency issues with other writes if possible
        await db.collection("users").doc(doc.id).update({
          lastDailyNotificationSent:
            admin.firestore.FieldValue.serverTimestamp(),
        });

        count++;
      });

      await Promise.all(batchPromises);
      console.log(
        `✅ [Cron] Daily Bounty Check Complete. Sent ${count} alerts.`,
      );
    } catch (error) {
      console.error("❌ [Cron] Daily Reminder Failed:", error);
    }
  });

  console.log("📅 [Scheduler] Daily Bounty Reminder job initialized.");
};

export default setupDailyReminder;
