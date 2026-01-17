import { db, admin } from "../server.js";

/**
 * DELETE QUEST - Host only
 * Deletes quest document and all subcollections (members, chat, verifications)
 */
export const deleteQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const userId = req.user.uid;

    if (!questId) {
      return res.status(400).json({ error: "Quest ID required" });
    }

    // 1. Verify quest exists and user is host
    const questRef = db.collection("quests").doc(questId);
    const questSnap = await questRef.get();

    if (!questSnap.exists) {
      return res.status(404).json({ error: "Quest not found" });
    }

    const questData = questSnap.data();

    if (questData.hostId !== userId) {
      return res.status(403).json({ error: "Only quest host can delete" });
    }

    // 2. Delete all subcollections
    const batch = db.batch();

    // Delete members subcollection
    const membersSnapshot = await questRef.collection("members").get();
    membersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete chat subcollection
    const chatSnapshot = await questRef.collection("chat").get();
    chatSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete verifications subcollection
    const verificationsSnapshot = await questRef
      .collection("verifications")
      .get();
    verificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 3. Delete quest document
    batch.delete(questRef);

    // 4. Commit all deletes
    await batch.commit();

    // 5. Clean up joinedQuests from all members (optional, on best-effort basis)
    try {
      if (questData.members && Array.isArray(questData.members)) {
        const cleanupBatch = db.batch();
        questData.members.forEach((memberId) => {
          const joinedQuestRef = db
            .collection("users")
            .doc(memberId)
            .collection("joinedQuests")
            .doc(questId);
          cleanupBatch.delete(joinedQuestRef);
        });
        await cleanupBatch.commit();
      }
    } catch (cleanupError) {
      console.warn("Cleanup failed (non-critical):", cleanupError?.message);
    }

    return res.status(200).json({
      success: true,
      message: `Quest ${questId} deleted successfully`,
    });
  } catch (error) {
    console.error("❌ Delete Quest Error:", error);
    return res.status(500).json({
      error: "Failed to delete quest",
      details: error.message,
    });
  }
};

/**
 * EDIT QUEST - Host only
 * Updates quest details (excluding protected fields)
 */
export const editQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const userId = req.user.uid;
    const updates = req.body;

    if (!questId) {
      return res.status(400).json({ error: "Quest ID required" });
    }

    // 1. Verify quest exists and user is host
    const questRef = db.collection("quests").doc(questId);
    const questSnap = await questRef.get();

    if (!questSnap.exists) {
      return res.status(404).json({ error: "Quest not found" });
    }

    const questData = questSnap.data();

    if (questData.hostId !== userId) {
      return res.status(403).json({ error: "Only quest host can edit" });
    }

    // 2. Filter out protected fields
    const protectedFields = [
      "members",
      "membersCount",
      "completedBy",
      "createdAt",
      "hostId",
      "id",
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (!protectedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // 3. Add updatedAt timestamp
    filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // 4. Update quest
    await questRef.update(filteredUpdates);

    return res.status(200).json({
      success: true,
      message: "Quest updated successfully",
      updated: filteredUpdates,
    });
  } catch (error) {
    console.error("❌ Edit Quest Error:", error);
    return res.status(500).json({
      error: "Failed to edit quest",
      details: error.message,
    });
  }
};

/**
 * LEAVE QUEST - Member only (not host)
 * Removes member from quest and applies 2% XP penalty
 */
export const leaveQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const userId = req.user.uid;

    if (!questId) {
      return res.status(400).json({ error: "Quest ID required" });
    }

    // 1. Verify quest exists
    const questRef = db.collection("quests").doc(questId);
    const questSnap = await questRef.get();

    if (!questSnap.exists) {
      return res.status(404).json({ error: "Quest not found" });
    }

    const questData = questSnap.data();

    // Don't allow host to leave (they should delete instead)
    if (questData.hostId === userId) {
      return res
        .status(403)
        .json({ error: "Host cannot leave quest. Delete it instead." });
    }

    // 2. Check if user is a member
    const memberRef = questRef.collection("members").doc(userId);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      return res
        .status(400)
        .json({ error: "You are not a member of this quest" });
    }

    // 3. Check if leaving within 1 hour of quest start (penalty applies only then)
    let isWithinOneHour = false;
    const questStartTime = questData.startTime;

    if (questStartTime) {
      const startTimeMs = questStartTime.toDate
        ? questStartTime.toDate().getTime()
        : new Date(questStartTime).getTime();
      const now = Date.now();
      const oneHourMs = 60 * 60 * 1000; // 1 hour in milliseconds
      const timeUntilStart = startTimeMs - now;

      // Apply penalty if: quest already started OR less than 1 hour until start
      isWithinOneHour = timeUntilStart <= oneHourMs;
    }

    // 4. Get user data for XP calculation (only if within 1 hour)
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    let xpPenalty = 0;
    let weeklyPenalty = 0;

    if (isWithinOneHour && userSnap.exists) {
      const userData = userSnap.data();
      const currentXP = userData.xp || 0;
      const currentWeeklyXP = userData.thisWeekXP || 0;

      // Calculate 2% penalty (minimum 1 XP if they have any)
      xpPenalty = currentXP > 0 ? Math.max(1, Math.floor(currentXP * 0.02)) : 0;
      weeklyPenalty =
        currentWeeklyXP > 0
          ? Math.max(1, Math.floor(currentWeeklyXP * 0.02))
          : 0;

      console.log(
        `⚠️ Leaving within 1 hour - Penalty applies: XP=${xpPenalty}, Weekly=${weeklyPenalty}`,
      );
    } else {
      console.log(`✅ Leaving with more than 1 hour remaining - No penalty`);
    }

    // 4. Batch all updates
    const batch = db.batch();

    // Update quest - remove from members array and decrement count
    batch.update(questRef, {
      members: admin.firestore.FieldValue.arrayRemove(userId),
      membersCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Delete member document
    batch.delete(memberRef);

    // Delete from user's joinedQuests
    const joinedQuestRef = db
      .collection("users")
      .doc(userId)
      .collection("joinedQuests")
      .doc(questId);
    batch.delete(joinedQuestRef);

    // Apply XP penalty to user (both xp and thisWeekXP)
    if (xpPenalty > 0) {
      batch.update(userRef, {
        xp: admin.firestore.FieldValue.increment(-xpPenalty),
        thisWeekXP: admin.firestore.FieldValue.increment(-weeklyPenalty),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(
        `📉 Applying penalty to user: xp=-${xpPenalty}, thisWeekXP=-${weeklyPenalty}`,
      );
    }

    // Commit all changes
    await batch.commit();

    console.log(
      `✅ User ${userId} left quest ${questId}. XP penalty: -${xpPenalty} (weekly: -${weeklyPenalty})`,
    );

    res.json({
      success: true,
      message: "Left quest successfully",
      xpPenalty,
      weeklyPenalty,
    });
  } catch (error) {
    console.error("Leave quest error:", error);
    res.status(500).json({ error: error.message || "Failed to leave quest" });
  }
};
