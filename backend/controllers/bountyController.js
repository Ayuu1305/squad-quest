import { db } from "../server.js";
import { FieldValue } from "firebase-admin/firestore";
import { calculateLevelFromXP } from "../utils/leveling.js";

export const claimBounty = async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const userStatsRef = db.collection("userStats").doc(userId);
  const publicUserRef = db.collection("users").doc(userId);

  try {
    const result = await db.runTransaction(async (t) => {
      // ✅ 1. FETCH ALL DATA FIRST using t.getAll
      const [statsSnap, publicSnap] = await t.getAll(
        userStatsRef,
        publicUserRef,
      );

      const stats = statsSnap.exists ? statsSnap.data() : {};
      const publicData = publicSnap.exists ? publicSnap.data() : {};
      const userName = publicData.name || "Hero";
      let streakFrozen = false; // Track if freeze was used

      const now = new Date();

      // ✅ Defensive Date Parsing
      // ✅ Defensive Date Parsing (Default to Epoch 1970 if missing)
      let lastClaimed = new Date(0); // 1970-01-01 (Allows immediate claim)

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

      // 2. Cooldown Check (25 hours)
      if (lastClaimed && !isNaN(lastClaimed.getTime())) {
        const diffHours = (now - lastClaimed) / (1000 * 60 * 60);
        if (diffHours < 25) {
          throw new Error("Cooldown active");
        }
      }

      // 3. Streak Logic with Freeze Protection
      let streak = stats.daily_streak || 0;

      if (lastClaimed && !isNaN(lastClaimed.getTime())) {
        const diffHours = (now - lastClaimed) / (1000 * 60 * 60);

        if (diffHours > 48) {
          // 🧊 STREAK FREEZE INTERVENTION: Check inventory before reset
          const freezeCount = stats.inventory?.streak_freeze || 0;

          if (freezeCount > 0) {
            // ✅ SAVED BY FREEZE: Consume 1 freeze and preserve streak
            console.log(
              `🧊 [Bounty] Streak Freeze activated! User: ${userId}, Streak: ${streak}`,
            );

            // Mark streak as frozen (for toast notification)
            streakFrozen = true;

            // Freeze will be consumed in the main update payload below
            // Keep streak as is (don't reset)
          } else {
            // ❌ NO FREEZE: Reset streak
            console.log(
              `💔 [Bounty] Streak broken! User: ${userId}, Old Streak: ${streak}`,
            );
            streak = 1; // Reset
          }
        } else {
          streak += 1; // Keep going
        }
      } else {
        streak = 1; // First time
      }

      // 4. Progressive Multiplier Rewards
      // Base: 50 XP, Growth: +5% per streak day, Cap: 150 XP (3.0x)
      const baseXP = 50;
      const multiplier = 1 + streak * 0.05; // 5% per day
      const uncappedXP = Math.floor(baseXP * multiplier);
      const earnedXP = Math.min(uncappedXP, 150); // Cap at 150 XP

      console.log(
        `💰 [Bounty] Streak: ${streak}, Multiplier: ${multiplier.toFixed(2)}x, XP: ${earnedXP}/${uncappedXP}`,
      );

      // --- LEVELING LOGIC ---
      const currentXP = stats.xp || 0;
      const newXP = currentXP + earnedXP;
      const { level: newLevel } = calculateLevelFromXP(newXP);

      const updatePayload = {
        xp: FieldValue.increment(earnedXP),
        thisWeekXP: FieldValue.increment(earnedXP),
        lifetimeXP: FieldValue.increment(earnedXP), // 🎖️ LIFETIME
        level: newLevel,
        daily_streak: streak,
        last_claimed_at: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // 🧊 If freeze was used, consume it atomically
      if (streakFrozen) {
        updatePayload["inventory.streak_freeze"] = FieldValue.increment(-1);
        console.log(
          `🧊 [Bounty] Consuming 1 Streak Freeze for user: ${userId}`,
        );
      }

      // 5. Commit Updates
      t.set(userStatsRef, updatePayload, { merge: true });
      t.set(publicUserRef, updatePayload, { merge: true });

      // 6. Activity Log
      const activityRef = db.collection("global_activity").doc();
      t.set(activityRef, {
        type: "bounty",
        user: userName,
        userId: userId,
        action: "claimed daily bounty",
        target: `${earnedXP} XP`,
        userAura: "gold",
        timestamp: FieldValue.serverTimestamp(),
      });

      return { userName, streakFrozen }; // ✅ Return both values
    });

    console.log(
      "✅ [LiveFeed] Bounty claimed and logged to global_activity for user:",
      result.userName,
    );
    res.json({
      success: true,
      message: "Bounty claimed",
      streakFrozen: result.streakFrozen, // ✅ Notify frontend if freeze was used
    });
  } catch (error) {
    if (error.message === "Cooldown active") {
      return res.status(403).json({ error: "Cooldown active", cooldown: true });
    }
    console.error("claimBounty Error:", error);
    // ✅ Return the actual error message to help debugging
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
