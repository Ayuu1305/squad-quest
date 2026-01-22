import { db, FieldValue } from "../server.js";

/**
 * Sync Streak Endpoint
 * Checks if user's streak is safe or needs protection/reset
 * Handles automatic Streak Freeze consumption
 */
export const syncStreak = async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const userStatsRef = db.collection("userStats").doc(userId);

  try {
    const result = await db.runTransaction(async (t) => {
      // 1. Read current user stats
      const statsSnap = await t.get(userStatsRef);

      if (!statsSnap.exists) {
        return { status: "ok", message: "User stats not found" };
      }

      const stats = statsSnap.data();
      const now = new Date();

      // Parse last_claimed_at (handle both Timestamp and Date)
      let lastClaimed = new Date(0); // Default to epoch if missing

      if (stats.last_claimed_at) {
        if (typeof stats.last_claimed_at.toDate === "function") {
          lastClaimed = stats.last_claimed_at.toDate();
        } else {
          const timestamp = new Date(stats.last_claimed_at);
          if (!isNaN(timestamp.getTime())) {
            lastClaimed = timestamp;
          }
        }
      }

      // 2. Calculate hours since last claim
      const diffHours = (now - lastClaimed) / (1000 * 60 * 60);

      // Scenario A: Safe (< 48 hours)
      if (diffHours < 48 || isNaN(diffHours)) {
        return { status: "ok", message: "Streak is safe" };
      }

      // Scenario B: Missed Day (>= 48 hours)
      const currentStreak = stats.daily_streak || 0;
      const freezeCount = stats.inventory?.streak_freeze || 0;

      if (freezeCount > 0) {
        // ✅ PROTECT: Use Streak Freeze
        console.log(
          `🧊 [Streak Sync] User ${userId} protected with Streak Freeze. Streak: ${currentStreak}`,
        );

        // Time travel to 25 hours ago (allows immediate claim)
        const timeTravel = new Date(now);
        timeTravel.setHours(timeTravel.getHours() - 25);

        t.update(userStatsRef, {
          "inventory.streak_freeze": freezeCount - 1,
          last_claimed_at: timeTravel,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          status: "protected",
          message: "Streak Freeze Activated! 🧊",
          streakSaved: currentStreak,
        };
      } else {
        // ❌ RESET: No freeze available
        console.log(
          `💔 [Streak Sync] User ${userId} streak reset. Old streak: ${currentStreak}`,
        );

        t.update(userStatsRef, {
          daily_streak: 0,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          status: "reset",
          message: "Streak lost.",
          oldStreak: currentStreak,
        };
      }
    });

    console.log(
      `✅ [Streak Sync] User ${userId}: ${result.status} (${result.message})`,
    );

    res.json(result);
  } catch (error) {
    console.error("Streak sync error:", error);
    res.status(500).json({
      error: error.message || "Failed to sync streak",
    });
  }
};
