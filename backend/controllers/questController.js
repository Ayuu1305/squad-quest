import { db, admin } from "../server.js";
import { calculateLevelFromXP } from "../utils/leveling.js";

export const finalizeQuest = async (req, res) => {
  const { questId, photoURL } = req.body;
  const uid = req.user.uid;

  if (!questId) return res.status(400).json({ error: "Missing questId" });

  try {
    const result = await db.runTransaction(async (t) => {
      const questRef = db.collection("quests").doc(questId);
      const userStatsRef = db.collection("userStats").doc(uid);
      const userRef = db.collection("users").doc(uid);

      const verificationRef = db
        .collection("quests")
        .doc(questId)
        .collection("verifications")
        .doc(uid);

      const memberRef = db
        .collection("quests")
        .doc(questId)
        .collection("members")
        .doc(uid);

      const [questDoc, statsDoc, verifyDoc, memberDoc, userDoc] =
        await t.getAll(
          questRef,
          userStatsRef,
          verificationRef,
          memberRef,
          userRef,
        );

      if (!questDoc.exists) throw new Error("Quest not found");
      if (!memberDoc.exists) throw new Error("User not a member of this quest");

      const qData = questDoc.data();

      // ✅ Idempotency
      if (verifyDoc.exists && verifyDoc.data().rewarded) {
        return { success: true, alreadyClaimed: true };
      }

      // ✅ XP Calculation
      let earnedXP = 100;
      let bonuses = [];

      const startTime = qData.startTime?.toDate?.();
      if (startTime) {
        const now = new Date();
        const diffMinutes = (now - startTime) / 1000 / 60;
        if (diffMinutes <= 5 && diffMinutes >= -15) {
          earnedXP += 25;
          bonuses.push("PUNCTUALITY");
        }
      }

      if (photoURL && photoURL.length > 10) {
        earnedXP += 20;
        bonuses.push("PHOTO_EVIDENCE");
      }

      if (qData.hostId === uid) {
        earnedXP += 20;
        bonuses.push("HOST_BONUS");
      }

      // Sunday showdown x2
      const isSunday = new Date().getDay() === 0;
      if (isSunday) {
        earnedXP *= 2;
        bonuses.push("SHOWDOWN_SUNDAY");
      }

      // ✅ Current stats
      const currentStats = statsDoc.exists
        ? statsDoc.data()
        : { xp: 0, level: 1, reliabilityScore: 0, badges: [], thisWeekXP: 0 };

      const newXP = (currentStats.xp || 0) + earnedXP;
      const newReliability = (currentStats.reliabilityScore || 0) + 1;

      // ✅ Level calc - Using new utility function
      const { level: newLevel } = calculateLevelFromXP(newXP);

      // ✅ Badges
      let newBadges = Array.isArray(currentStats.badges)
        ? currentStats.badges
        : [];

      if (!newBadges.includes("FIRST_MISSION")) newBadges.push("FIRST_MISSION");
      if (bonuses.includes("PUNCTUALITY") && !newBadges.includes("EARLY_BIRD"))
        newBadges.push("EARLY_BIRD");

      // ✅ Write into userStats (private truth)
      t.set(
        userStatsRef,
        {
          xp: newXP,
          level: newLevel,
          reliabilityScore: newReliability,
          thisWeekXP: admin.firestore.FieldValue.increment(earnedXP),
          badges: newBadges,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // ✅ Sync into users (mandatory for leaderboard) - Use increment to prevent race conditions
      t.set(
        userRef,
        {
          xp: admin.firestore.FieldValue.increment(earnedXP),
          level: newLevel,
          reliabilityScore: newReliability,
          thisWeekXP: admin.firestore.FieldValue.increment(earnedXP),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // ✅ mark verification rewarded
      t.set(
        verificationRef,
        {
          rewarded: true,
          earnedXP,
          rewardedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // ✅ global activity log - Quest Completion
      const activityRef = db.collection("global_activity").doc();
      t.set(activityRef, {
        type: "quest",
        userId: uid,
        user: memberDoc.data().name || "Unknown Hero",
        action: `completed ${qData.title || "a quest"}`,
        target: qData.title || "Quest",
        earnedXP,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ✅ NEW: Log badge unlocks
      const newlyUnlockedBadges = newBadges.filter(
        (badge) => !currentStats.badges || !currentStats.badges.includes(badge),
      );

      newlyUnlockedBadges.forEach((badge) => {
        const badgeActivityRef = db.collection("global_activity").doc();
        t.set(badgeActivityRef, {
          type: "badge",
          userId: uid,
          user: memberDoc.data().name || "Unknown Hero",
          action: `unlocked ${badge} badge`,
          target: badge,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return {
        success: true,
        earnedXP,
        newLevel: newLevel,
        bonuses,
        newBadges,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Finalize Quest Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const submitVibeCheck = async (req, res) => {
  const { questId, reviews } = req.body;
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
      const userIds = Object.keys(reviews);
      const reviewedUserRefs = userIds
        .filter((id) => id !== reviewerId)
        .map((id) => db.collection("users").doc(id));
      const reviewedUserStatsRefs = userIds
        .filter((id) => id !== reviewerId)
        .map((id) => db.collection("userStats").doc(id));

      const reviewerRef = db.collection("users").doc(reviewerId);
      const reviewerStatsRef = db.collection("userStats").doc(reviewerId);

      // READ EVERYTHING FIRST
      const allRefs = [
        ...reviewedUserRefs,
        ...reviewedUserStatsRefs,
        reviewerRef,
        reviewerStatsRef,
      ];
      const allSnaps = await t.getAll(...allRefs);

      // Create a map for easy access
      const snapMap = new Map();
      allSnaps.forEach((snap) => {
        if (snap.exists) snapMap.set(snap.ref.path, snap.data());
      });

      const reviewerDataFromMap = snapMap.get(reviewerRef.path) || {};

      // 3. APPLY UPDATES
      const reviewerXP = reviewerDataFromMap.xp || 0;
      const reviewerReward = 50;
      const { level: newReviewerLevel } = calculateLevelFromXP(
        reviewerXP + reviewerReward,
      );

      // Update Reviewer - Use increment to prevent race conditions
      const reviewerPayload = {
        xp: admin.firestore.FieldValue.increment(reviewerReward),
        level: newReviewerLevel,
        thisWeekXP: admin.firestore.FieldValue.increment(reviewerReward),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      t.update(reviewerRef, reviewerPayload);
      t.set(reviewerStatsRef, reviewerPayload, { merge: true });

      // Update Reviewed Users
      userIds.forEach((targetId) => {
        if (targetId === reviewerId) return;
        const tags = reviews[targetId];
        if (!tags || tags.length === 0) return;

        const targetRef = db.collection("users").doc(targetId);
        const targetStatsRef = db.collection("userStats").doc(targetId);
        const targetData = snapMap.get(targetRef.path) || {};

        const xpReward = tags.length * 5;
        const currentXP = targetData.xp || 0;
        const newXP = currentXP + xpReward;
        const { level: newLevel } = calculateLevelFromXP(newXP);

        const targetPayload = {
          xp: admin.firestore.FieldValue.increment(xpReward),
          level: newLevel,
          thisWeekXP: admin.firestore.FieldValue.increment(xpReward),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add vibe tags increment
        tags.forEach((tag) => {
          targetPayload[`vibeTags.${tag}`] =
            admin.firestore.FieldValue.increment(1);
        });

        t.set(targetRef, targetPayload, { merge: true });
        t.set(targetStatsRef, targetPayload, { merge: true });
      });

      // 4. Activity Log
      const activityRef = db.collection("global_activity").doc();
      t.set(activityRef, {
        type: "vibe_check",
        userId: reviewerId,
        user: reviewerDataFromMap.name || "Hero",
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
