import { db, FieldValue } from "../server.js";

/**
 * POST /api/verification/check-badge
 * Authenticated route. Checks if the calling user qualifies for the
 * verifiedGender badge and grants it if so.
 *
 * THIS IS THE ONLY CODE PATH IN THE ENTIRE APP THAT WRITES verifiedGender.
 * It runs server-side using the Admin SDK, which bypasses Firestore rules.
 * The client cannot influence the outcome beyond triggering this endpoint.
 */
export const checkVerifiedBadge = async (req, res) => {
  const userId = req.user.uid; // Set by verifyToken middleware

  try {
    console.log(`🔍 [VerifiedBadge] Checking badge eligibility for ${userId}`);

    // --- Step 1: Read the user document to get their gender and current status ---
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // If already verified, nothing to do
    if (userData.verifiedGender) {
      return res.status(200).json({
        granted: false,
        reason: "Already verified",
      });
    }

    // Must have a gender set before verification can be granted
    if (!userData.gender) {
      return res.status(200).json({
        granted: false,
        reason: "No gender set on profile",
      });
    }

    // --- Step 2: Count verification documents that have a non-empty photoURL ---
    // Only documents where:
    //   - uid matches this user (cannot be faked server-side)
    //   - photoURL is non-empty (photo was submitted)
    //   - rewarded is true (backend has confirmed the quest completion was legitimate)
    //
    // The `rewarded` field is only set to true by the backend finalizeQuest
    // controller after XP is awarded, which means fabricated verification
    // documents that were never finalized by the backend will NOT be counted.
    const verificationsQuery = await db
      .collectionGroup("verifications")
      .where("uid", "==", userId)
      .where("photoURL", "!=", "")
      .where("rewarded", "==", true)
      .get();

    const photoVerifCount = verificationsQuery.size;

    console.log(
      `📸 [VerifiedBadge] User ${userId} has ${photoVerifCount} backend-confirmed photo verifications`,
    );

    // --- Step 3: Grant badge if threshold is met ---
    if (photoVerifCount < 3) {
      return res.status(200).json({
        granted: false,
        reason: `${photoVerifCount}/3 confirmed photo verifications`,
        count: photoVerifCount,
      });
    }

    // --- Step 4: Write verifiedGender using Admin SDK ---
    // This is the ONLY write path for verifiedGender in the entire app.
    await userRef.update({
      verifiedGender: userData.gender, // "Male" or "Female"
      verifiedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `✅ [VerifiedBadge] Granted verifiedGender="${userData.gender}" to user ${userId} (${photoVerifCount} photos)`,
    );

    return res.status(200).json({
      granted: true,
      verifiedGender: userData.gender,
    });
  } catch (error) {
    console.error("[VerifiedBadge] Error:", error);
    return res.status(500).json({ error: "Failed to check verified badge" });
  }
};
