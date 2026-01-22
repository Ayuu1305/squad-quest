import { db } from "../server.js";

/**
 * Updates the user's avatar configuration.
 * Route: POST /api/user/avatar
 * Access: Protected
 */
export const updateAvatar = async (req, res) => {
  const { uid } = req.user;
  const { avatarConfig } = req.body;

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
