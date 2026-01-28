import { db } from "../server.js";
import { FieldValue } from "firebase-admin/firestore";
import { calculateLevelFromXP } from "../utils/leveling.js";
import { sendNotification } from "../services/notificationService.js";
/**
 * Get the start of the current week (last Monday 00:00 IST)
 */
const getWeekStartDate = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
};

/**
 * Batch reset ALL users' thisWeekXP to 0
 * Uses Firestore batched writes (max 500 per batch)
 */
/**
 * Batch reset ALL users' thisWeekXP to 0
 * Uses Firestore batched writes (max 500 per batch)
 */
export const resetAllWeeklyXP = async () => {
  const startTime = Date.now();
  console.log("🔄 Starting Weekly XP Reset...");

  try {
    // ---------------------------------------------------------
    // 1️⃣ SUNDAY SHOWDOWN: REWARD WINNERS
    // ---------------------------------------------------------
    const usersRef = db.collection("users");
    const winnersSnapshot = await usersRef
      .orderBy("thisWeekXP", "desc")
      .limit(3)
      .get();

    console.log(`🏆 Processing ${winnersSnapshot.size} winners...`);

    for (let i = 0; i < winnersSnapshot.docs.length; i++) {
      const doc = winnersSnapshot.docs[i];
      const userData = doc.data();
      const uid = doc.id;
      const rank = i + 1;

      // Define Rewards
      let xpReward = 0;
      let newBorder = null;
      let newBadge = null;
      let reliabilityReward = 0;
      let buffParams = null; // For Squad XP Boost

      if (rank === 1) {
        xpReward = 5000;
        newBorder = "golden_glitch";
        newBadge = "apex_trophy";
        // Active Buff: Squad XP Boost (1 week duration)
        buffParams = {
          active: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 Days
        };
      } else if (rank === 2) {
        xpReward = 2500;
        newBorder = "silver_shimmer";
        newBadge = "elite_trophy";
        reliabilityReward = 20;
      } else if (rank === 3) {
        xpReward = 1000;
        newBorder = "bronze_plate";
        newBadge = "vanguard_trophy";
      }

      // Calculate New Level
      const currentXP = userData.xp || 0;
      const totalXP = currentXP + xpReward;
      const { level: newLevel } = calculateLevelFromXP(totalXP);

      // Prepare Update Payload
      const updates = {
        xp: FieldValue.increment(xpReward),
        lifetimeXP: FieldValue.increment(xpReward),
        level: newLevel,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (newBorder) updates.activeBorder = newBorder;
      if (reliabilityReward > 0) {
        updates.reliabilityScore = FieldValue.increment(reliabilityReward);
      }
      if (newBadge) {
        updates.badges = FieldValue.arrayUnion(newBadge);
      }
      if (buffParams) {
        updates["activeBuffs.squadXpBoost"] = buffParams;
      }

      // Apply Updates to BOTH collections (Sync Profile)
      // We process these individually (not batched) to ensure critical rewards are saved
      const userRef = db.collection("users").doc(uid);
      const statsRef = db.collection("userStats").doc(uid);

      await Promise.all([
        userRef.update(updates),
        statsRef.set(updates, { merge: true }),
      ]);

      // Notification
      const titles = [
        "👑 Sunday Showdown Champion!",
        "🥈 Sunday Showdown Runner-up!",
        "🥉 Sunday Showdown Podium!",
      ];
      const bodies = [
        `You ranked #1 this week! Received +${xpReward} XP, Apex Trophy & XP Buff!`,
        `You ranked #2 this week! Received +${xpReward} XP & Elite Trophy!`,
        `You ranked #3 this week! Received +${xpReward} XP & Vanguard Trophy!`,
      ];

      await sendNotification(uid, titles[i], bodies[i]);
      console.log(`✅ Rewarded Rank ${rank}: ${userData.name || uid}`);
    }

    // ---------------------------------------------------------
    // 2️⃣ RESET LOGIC (Existing)
    // ---------------------------------------------------------
    const usersSnapshot = await db.collection("users").get();
    const totalUsers = usersSnapshot.size;
    console.log(`📊 Found ${totalUsers} users to reset`);

    if (totalUsers === 0) {
      return { success: true, usersReset: 0, duration: 0 };
    }

    const batchSize = 500;
    let currentBatch = db.batch();
    let opCount = 0;
    let batchCount = 0;
    const batches = [];

    for (const doc of usersSnapshot.docs) {
      currentBatch.update(doc.ref, {
        thisWeekXP: 0,
        lastWeeklyResetDate: FieldValue.serverTimestamp(),
      });
      opCount++;

      if (opCount >= batchSize) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        batchCount++;
        opCount = 0;
        console.log(`📦 Batch ${batchCount} queued (${batchSize} users)`);
      }
    }

    // Commit remaining operations
    if (opCount > 0) {
      batches.push(currentBatch.commit());
      batchCount++;
      console.log(`📦 Final batch queued (${opCount} users)`);
    }

    // Execute all batches
    await Promise.all(batches);

    const duration = Date.now() - startTime;
    console.log(
      `✅ Weekly XP Reset completed: ${totalUsers} users in ${duration}ms`,
    );

    return {
      success: true,
      usersReset: totalUsers,
      batches: batchCount,
      duration,
    };
  } catch (error) {
    console.error("❌ Weekly XP Reset Error:", error);
    throw error;
  }
};

/**
 * Lazy Reset: Check if user's weekly XP needs to be reset
 * Call this before returning user data
 */
export const lazyResetUserXP = async (userId, userData, userRef) => {
  const weekStart = getWeekStartDate();
  const lastReset = userData.lastWeeklyResetDate?.toDate
    ? userData.lastWeeklyResetDate.toDate()
    : userData.lastWeeklyResetDate
      ? new Date(userData.lastWeeklyResetDate)
      : null;

  // If no reset date or reset was before this week started
  if (!lastReset || lastReset < weekStart) {
    console.log(`🔄 Lazy Reset triggered for user ${userId}`);

    await userRef.update({
      thisWeekXP: 0,
      lastWeeklyResetDate: FieldValue.serverTimestamp(), // FIXED: Removed admin.firestore
    });

    // Return updated data
    return {
      ...userData,
      thisWeekXP: 0,
      lastWeeklyResetDate: new Date(),
    };
  }

  return userData;
};

/**
 * Admin Force Reset Endpoint Handler
 * POST /api/admin/reset-weekly-xp
 */
export const adminForceReset = async (req, res) => {
  // Check admin secret - MUST be set in environment
  const adminSecret = req.headers["x-admin-secret"];
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret) {
    console.error("❌ ADMIN_SECRET not configured in environment!");
    return res
      .status(500)
      .json({ error: "Server misconfigured: ADMIN_SECRET not set" });
  }

  if (adminSecret !== expectedSecret) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid admin secret" });
  }

  try {
    console.log("🔐 Admin Force Reset initiated by:", req.ip);
    const result = await resetAllWeeklyXP();

    res.json({
      success: true,
      message: "Weekly XP reset completed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Admin Force Reset Error:", error);
    res.status(500).json({
      success: false,
      error: "Reset failed",
      message: error.message,
    });
  }
};
