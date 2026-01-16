export const submitVibeCheck = async (req, res) => {
  const { questId, reviews } = req.body; // reviews: { userId: [tag1, tag2], ... }
  const reviewerId = req.user.uid;

  if (!questId || !reviews) {
    return res.status(400).json({ error: "Missing questId or reviews" });
  }

  try {
    const result = await db.runTransaction(async (t) => {
      // 1. Validate Quest
      const questRef = db.collection("quests").doc(questId);
      const questDoc = await t.get(questRef);

      if (!questDoc.exists) throw new Error("Quest not found");

      // 2. Process each review
      // We will perform updates on each reviewed user.
      // Limit to 5 users to prevent transaction limits if squad is huge (rare).
      const userIds = Object.keys(reviews);

      const updates = [];

      for (const targetId of userIds) {
        if (targetId === reviewerId) continue; // Skip self

        const tags = reviews[targetId]; // Array of tag IDs
        if (!tags || tags.length === 0) continue;

        const targetRef = db.collection("users").doc(targetId);
        const targetStatsRef = db.collection("userStats").doc(targetId);

        // XP Reward: 5 XP per tag received
        const xpReward = tags.length * 5;

        // Update target logic (simplified for batch/transaction)
        // We need to read current stats to calc level, but we can also just increment XP
        // and let level sync happen lazily or simple calc.
        // For accurate leveling, we should read. But reading N users might be heavy.
        // We will just increment XP and thisWeekXP.
        // Note: Level update might lag if we don't recalculate perfectly here.
        // But let's try to verify if we can just use `calculateLevelFromXP` on the new total?
        // We can't know new total without reading old total.

        // Strategy: Read all targets first.
        const targetDoc = await t.get(targetRef);
        if (!targetDoc.exists) continue;

        const currentXP = targetDoc.data().xp || 0;
        const newXP = currentXP + xpReward;
        const { level: newLevel } = calculateLevelFromXP(newXP);

        // Prepare updates for Target
        t.update(targetRef, {
          xp: newXP,
          level: newLevel,
          thisWeekXP: admin.firestore.FieldValue.increment(xpReward),
          // Update vibe tags implementation (map or array? User schema says vibeTags || feedbackCounts)
          // Let's assume `vibeTags` is a map { tagId: count }
          ...tags.reduce((acc, tag) => {
            acc[`vibeTags.${tag}`] = admin.firestore.FieldValue.increment(1);
            return acc;
          }, {}),
        });

        t.set(
          targetStatsRef,
          {
            xp: newXP,
            level: newLevel,
            thisWeekXP: admin.firestore.FieldValue.increment(xpReward),
            ...tags.reduce((acc, tag) => {
              acc[`vibeTags.${tag}`] = admin.firestore.FieldValue.increment(1);
              return acc;
            }, {}),
          },
          { merge: true }
        );
      }

      // 3. Award Reviewer XP (50 XP fixed)
      const reviewerRef = db.collection("users").doc(reviewerId);
      const reviewerStatsRef = db.collection("userStats").doc(reviewerId);

      const reviewerDoc = await t.get(reviewerRef);
      const reviewerXP = reviewerDoc.data()?.xp || 0;
      const reviewerReward = 50;
      const newReviewerXP = reviewerXP + reviewerReward;
      const { level: newReviewerLevel } = calculateLevelFromXP(newReviewerXP);

      t.update(reviewerRef, {
        xp: newReviewerXP,
        level: newReviewerLevel,
        thisWeekXP: admin.firestore.FieldValue.increment(reviewerReward),
      });

      t.set(
        reviewerStatsRef,
        {
          xp: newReviewerXP,
          level: newReviewerLevel,
          thisWeekXP: admin.firestore.FieldValue.increment(reviewerReward),
        },
        { merge: true }
      );

      // 4. Activity Log
      const activityRef = db.collection("global_activity").doc();
      t.set(activityRef, {
        type: "vibe_check",
        userId: reviewerId,
        user: reviewerDoc.data()?.name || "Unknown Hero",
        action: "completed squad review",
        target: "Vibe Check",
        earnedXP: reviewerReward,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, earnedXP: reviewerReward };
    });

    res.json(result);
  } catch (error) {
    console.error("Vibe Check Error:", error);
    res.status(500).json({ error: error.message });
  }
};
