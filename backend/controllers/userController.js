import { db } from "../server.js";

/**
 * Updates the user's avatar configuration.
 * Route: POST /api/user/avatar
 * Access: Protected
 */
export const updateAvatar = async (req, res) => {
  const { uid } = req.user;
  // ✅ Use validated data (from validation middleware)
  const { avatarConfig } = req.validatedData || req.body;

  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!avatarConfig || typeof avatarConfig !== "object") {
    return res.status(400).json({ error: "Invalid avatar config" });
  }

  try {
    console.log(`🎨 Updating avatar for user: ${uid}`);

    // Update BOTH collections for consistency
    const userStatsRef = db.collection("userStats").doc(uid);
    const publicUserRef = db.collection("users").doc(uid);

    const updatePayload = {
      avatarConfig,
      updatedAt: new Date(),
    };

    // Dual-write to ensure leaderboard shows correct avatar
    await Promise.all([
      userStatsRef.set(updatePayload, { merge: true }),
      publicUserRef.set(updatePayload, { merge: true }),
    ]);

    console.log(`✅ Avatar synced to both userStats and users collections`);

    return res.status(200).json({ success: true, message: "Avatar updated" });
  } catch (error) {
    console.error("Error updating avatar:", error);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
};

/**
 * Acknowledge a violation - marks it as seen by the user
 * Route: POST /api/user/acknowledge-violation
 * Access: Protected
 */
export const acknowledgeViolation = async (req, res) => {
  const { violationIndex } = req.validatedData || req.body;
  const userId = req.user.uid;

  console.log(
    `📝 [AcknowledgeViolation] User ${userId} acknowledging violation index ${violationIndex}`,
  );

  if (violationIndex === undefined || violationIndex === null) {
    return res.status(400).json({ error: "violationIndex is required" });
  }

  try {
    const userStatsRef = db.collection("userStats").doc(userId);
    const userStatsSnap = await userStatsRef.get();

    if (!userStatsSnap.exists) {
      return res.status(404).json({ error: "User stats not found" });
    }

    const violations = userStatsSnap.data().violations || [];

    if (violationIndex < 0 || violationIndex >= violations.length) {
      return res.status(400).json({ error: "Invalid violation index" });
    }

    // Mark the specific violation as acknowledged
    violations[violationIndex].acknowledged = true;

    // Update Firestore
    await userStatsRef.update({
      violations,
      updatedAt: new Date(),
    });

    console.log(
      `✅ [AcknowledgeViolation] User ${userId} acknowledged violation ${violationIndex}`,
    );

    return res.json({
      success: true,
      message: "Violation acknowledged",
    });
  } catch (error) {
    console.error("Acknowledge Violation Error:", error);
    return res.status(500).json({ error: "Failed to acknowledge violation" });
  }
};
