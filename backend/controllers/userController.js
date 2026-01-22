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

    // Update userStats with the new config
    // We use userStats because that's where the secure/private data lives
    const userStatsRef = db.collection("userStats").doc(uid);

    await userStatsRef.set(
      {
        avatarConfig,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return res.status(200).json({ success: true, message: "Avatar updated" });
  } catch (error) {
    console.error("Error updating avatar:", error);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
};
