import { db } from "../server.js";

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
export const resetAllWeeklyXP = async () => {
  const startTime = Date.now();
  console.log("🔄 Starting Weekly XP Reset...");

  try {
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
      lastWeeklyResetDate: admin.firestore.FieldValue.serverTimestamp(),
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
