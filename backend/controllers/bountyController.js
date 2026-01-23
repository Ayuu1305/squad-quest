import { db } from "../server.js";
import { FieldValue, FieldPath } from "firebase-admin/firestore";
import { calculateLevelFromXP } from "../utils/leveling.js";

export const claimBounty = async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const userStatsRef = db.collection("userStats").doc(userId);
  const publicUserRef = db.collection("users").doc(userId);

  try {
    const result = await db.runTransaction(async (t) => {
      // ✅ 1. FETCH ALL DATA FIRST using t.getAll
      // ✅ 1. FETCH ALL DATA FIRST (Explicitly to prevent swapping)
      const statsSnap = await t.get(userStatsRef);
      const publicSnap = await t.get(publicUserRef);

      console.log(`🔍 [Bounty] Path Check:`);
      console.log(`   stats path: ${statsSnap.ref.path}`);
      console.log(`   public path: ${publicSnap.ref.path}`);

      const stats = statsSnap.exists ? statsSnap.data() : {};
      const publicData = publicSnap.exists ? publicSnap.data() : {};
      const userName = publicData.name || "Hero";
      let streakFrozen = false; // Track if freeze was used

      const now = new Date();

      // ✅ Defensive Date Parsing
      // ✅ Defensive Date Parsing (Default to Epoch 1970 if missing)
      // ✅ Defensive Date Parsing (Default to Epoch 1970 if missing)
      let lastClaimed = new Date(0); // 1970-01-01 (Allows immediate claim)

      // 🔥 FIX: Support both 'last_claimed_at' (standard) and 'last_claimed' (manual/legacy)
      const rawTimestamp = stats.last_claimed_at || stats.last_claimed;

      console.log(`🔍 [Bounty] Checking Cooldown for ${userId}`);
      console.log(
        `   Stats last_claimed_at: ${stats.last_claimed_at ? "Fail/Date" : "Missing"}`,
      );
      console.log(
        `   Stats last_claimed: ${stats.last_claimed ? "Fail/Date" : "Missing"}`,
      );
      console.log(`   Raw Timestamp Found:`, rawTimestamp);

      if (rawTimestamp) {
        if (typeof rawTimestamp.toDate === "function") {
          lastClaimed = rawTimestamp.toDate();
        } else {
          const timestamp = new Date(rawTimestamp);
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
      let earnedXP = Math.min(uncappedXP, 150); // Cap at 150 XP

      // 🚀 NEURO-BOOST MULTIPLIER LOGIC (SIMPLIFIED - MAP ONLY)
      let boostMultiplier = 1;
      const invMap = stats.inventory || {};

      // ✅ READ ONLY FROM MAP
      const currentNeuroCount =
        typeof invMap.neuro_boost === "number" ? invMap.neuro_boost : 0;

      if (currentNeuroCount > 0) {
        boostMultiplier = 2; // 2x XP
        earnedXP = earnedXP * boostMultiplier;

        console.log(
          `🚀 [Bounty] Neuro-Boost activated! Count: ${currentNeuroCount}. Multiplier: 2x`,
        );
      }

      console.log(
        `💰 [Bounty] Streak: ${streak}, Multiplier: ${multiplier.toFixed(2)}x, Boost: ${boostMultiplier}x, XP: ${earnedXP}`,
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

      // 🚀 If boost was used, update ONE TRUTH SOURCE using Separate Updates
      // 🚀 If boost was used, update ONE TRUTH SOURCE (MAP)
      if (boostMultiplier > 1) {
        // Calculate new count safely
        const invMap = stats.inventory || {};
        const currentCount =
          typeof invMap.neuro_boost === "number" ? invMap.neuro_boost : 0;
        const newCount = Math.max(0, currentCount - 1); // Prevent negative

        // 1. Commit Main Payload (XP, Streak, LastClaimed)
        // Ensure we don't accidentally update inventory in main payload
        delete updatePayload["inventory.neuro_boost"];

        t.set(userStatsRef, updatePayload, { merge: true });
        t.set(publicUserRef, updatePayload, { merge: true });

        // 2. Perform Explicit Map Write (Force Correct Path)
        t.update(
          userStatsRef,
          new FieldPath("inventory", "neuro_boost"),
          newCount,
        );
        t.update(
          publicUserRef,
          new FieldPath("inventory", "neuro_boost"),
          newCount,
        );

        console.log(
          `🚀 [Bounty] Consumed Boost. Count: ${currentCount} -> ${newCount}`,
        );
      } else {
        // No boost used, regular commit
        t.set(userStatsRef, updatePayload, { merge: true });
        t.set(publicUserRef, updatePayload, { merge: true });
      }

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

      return { userName, streakFrozen, earnedXP, boostMultiplier }; // ✅ Return detailed stats
    });

    console.log(
      "✅ [LiveFeed] Bounty claimed and logged to global_activity for user:",
      result.userName,
    );
    res.json({
      success: true,
      message: "Bounty claimed",
      streakFrozen: result.streakFrozen, // ✅ Notify frontend if freeze was used
      earnedXP: result.earnedXP, // 💰 Actual XP given
      boostMultiplier: result.boostMultiplier, // 🚀 Multiplier used
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
