import { db, admin } from "../server.js";
import { calculateLevelFromXP } from "../utils/leveling.js";

export const claimBounty = async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const userStatsRef = db.collection("userStats").doc(userId);
  const publicUserRef = db.collection("users").doc(userId);

  try {
    await db.runTransaction(async (t) => {
      // ✅ 1. FETCH ALL DATA FIRST using t.getAll
      const [statsSnap, publicSnap] = await t.getAll(
        userStatsRef,
        publicUserRef
      );

      const stats = statsSnap.exists ? statsSnap.data() : {};
      const publicData = publicSnap.exists ? publicSnap.data() : {};
      const userName = publicData.name || "Hero";

      const now = new Date();

      // ✅ Defensive Date Parsing
      let lastClaimed = null;
      if (stats.last_claimed_at) {
        if (typeof stats.last_claimed_at.toDate === "function") {
          lastClaimed = stats.last_claimed_at.toDate();
        } else {
          lastClaimed = new Date(stats.last_claimed_at);
        }
      }

      // 2. Cooldown Check (25 hours)
      if (lastClaimed && !isNaN(lastClaimed.getTime())) {
        const diffHours = (now - lastClaimed) / (1000 * 60 * 60);
        if (diffHours < 25) {
          throw new Error("Cooldown active");
        }
      }

      // 3. Streak Logic
      let streak = stats.daily_streak || 0;
      if (lastClaimed && !isNaN(lastClaimed.getTime())) {
        const diffHours = (now - lastClaimed) / (1000 * 60 * 60);
        if (diffHours > 48) {
          streak = 1; // Reset
        } else {
          streak += 1; // Keep going
        }
      } else {
        streak = 1; // First time
      }

      // 4. Rewards
      const earnedXP = 50 + (streak > 5 ? 25 : 0);

      // --- LEVELING LOGIC ---
      const currentXP = stats.xp || 0;
      const newXP = currentXP + earnedXP;
      const { level: newLevel } = calculateLevelFromXP(newXP);

      const updatePayload = {
        xp: newXP,
        thisWeekXP: admin.firestore.FieldValue.increment(earnedXP),
        level: newLevel,
        daily_streak: streak,
        last_claimed_at: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

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
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({ success: true, message: "Bounty claimed" });
  } catch (error) {
    if (error.message === "Cooldown active") {
      return res.status(403).json({ error: "Cooldown active", cooldown: true });
    }
    console.error("claimBounty Error:", error);
    // ✅ Return the actual error message to help debugging
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
