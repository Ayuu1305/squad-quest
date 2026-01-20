import { db } from "../server.js";
import { FieldValue } from "firebase-admin/firestore";
import { calculateLevelFromXP } from "../utils/leveling.js";
import { sendNotification } from "../services/notificationService.js";

export const joinQuest = async (req, res) => {
  const { questId, secretCode } = req.body;
  const uid = req.user.uid;

  if (!questId) return res.status(400).json({ error: "Missing questId" });

  try {
    const result = await db.runTransaction(async (t) => {
      const questRef = db.collection("quests").doc(questId);
      const userRef = db.collection("users").doc(uid);
      const memberRef = questRef.collection("members").doc(uid);

      const [questDoc, userDoc, memberDoc] = await t.getAll(
        questRef,
        userRef,
        memberRef,
      );

      if (!questDoc.exists) throw new Error("Quest not found");
      const questData = questDoc.data();

      if (questData.status !== "open") throw new Error("Quest is not open");

      // Check Capacity
      const currentMembers = questData.membersCount || 0;
      if (currentMembers >= questData.maxPlayers)
        throw new Error("Quest is full");

      // Private Quest Check
      if (
        questData.isPrivate &&
        questData.secretCode !== secretCode &&
        questData.hostId !== uid
      ) {
        throw new Error("Invalid secret code");
      }

      // Level Gating Check
      const THREAT_LEVEL_REQUIREMENTS = { 1: 0, 2: 10, 3: 25, 4: 40, 5: 50 };
      const requiredLevel =
        THREAT_LEVEL_REQUIREMENTS[questData.difficulty || 1] || 0;
      const userLevel = userDoc.data()?.level || 1;

      if (userLevel < requiredLevel) {
        throw new Error(
          `Clearance Denied: You need to be Level ${requiredLevel} to join this mission.`,
        );
      }

      // Check if already joined
      if (memberDoc.exists) return { success: true, alreadyJoined: true };

      // Add Member to quest
      t.set(memberRef, {
        uid,
        name: userDoc.data()?.name || "Unknown Hero",
        joinedAt: FieldValue.serverTimestamp(),
        role: "member",
      });

      // ✅ Add to user's joinedQuests subcollection (for MyMissions page)
      const joinedQuestRef = db
        .collection("users")
        .doc(uid)
        .collection("joinedQuests")
        .doc(questId);
      t.set(joinedQuestRef, {
        joinedAt: FieldValue.serverTimestamp(),
        role: "member",
      });

      // Update Quest - Add to members array AND increment count
      t.update(questRef, {
        members: FieldValue.arrayUnion(uid),
        membersCount: FieldValue.increment(1),
      });

      return {
        success: true,
        questTitle: questData.title,
        hostId: questData.hostId,
        currentMembers: currentMembers + 1, // predicted count
        maxPlayers: questData.maxPlayers,
        hotZoneNotified: questData.hotZoneNotified,
        questData, // pass for notification logic outside transaction
      };
    });

    // ✅ SEND SUCCESS RESPONSE IMMEDIATELY (DB transaction is complete)
    res.json(result);

    // 🔥 Fire & Forget: Send notifications in background (don't await)
    if (result.success && !result.alreadyJoined) {
      const {
        hostId,
        questTitle,
        currentMembers,
        maxPlayers,
        hotZoneNotified,
      } = result;
      const joinerName = req.user.name || "A Hero";

      // Event B: Host Alert (New Member) - Background
      if (hostId && hostId !== uid) {
        sendNotification(
          hostId,
          "New Squad Member! 🚀",
          `${joinerName} just joined "${questTitle}". Check the lobby.`,
        ).catch((err) =>
          console.error("⚠️ [Background] Host notification failed:", err),
        );
      }

      // Event C: Hot Zone Alert (75% Capacity) - Background
      const usage = currentMembers / maxPlayers;
      if (usage >= 0.75 && !hotZoneNotified) {
        sendNotification(
          hostId,
          "🔥 Hot Zone Active!",
          `Your quest "${questTitle}" is ${Math.round(usage * 100)}% full! It's filling up fast.`,
        ).catch((err) =>
          console.error("⚠️ [Background] Hot Zone notification failed:", err),
        );

        // Update flag to prevent spam (also background)
        db.collection("quests")
          .doc(questId)
          .update({ hotZoneNotified: true })
          .catch((err) =>
            console.error("⚠️ [Background] Hot Zone flag update failed:", err),
          );
      }

      // 🔔 Live Feed: Log hero_joined activity
      const userName = req.user.name || "A Hero";
      console.log("🔔 [LiveFeed] Attempting to log hero_joined:", {
        uid,
        userName,
        questTitle,
      });
      db.collection("global_activity")
        .add({
          type: "hero_joined",
          userId: uid,
          user: userName,
          action: `joined ${questTitle}`,
          target: questTitle,
          timestamp: FieldValue.serverTimestamp(),
        })
        .then(() =>
          console.log("✅ [LiveFeed] hero_joined logged successfully"),
        )
        .catch((err) =>
          console.error("❌ [LiveFeed] hero_joined log FAILED:", err),
        );
    }
  } catch (error) {
    console.error("Join Quest Error:", error);
    res.status(500).json({ error: error.message });
  }
};

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
          thisWeekXP: FieldValue.increment(earnedXP),
          questsCompleted: FieldValue.increment(1), // ✅ NEW: Standardized Count
          badges: newBadges,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // ✅ Sync into users (mandatory for leaderboard)
      t.set(
        userRef,
        {
          xp: FieldValue.increment(earnedXP),
          level: newLevel,
          reliabilityScore: newReliability,
          thisWeekXP: FieldValue.increment(earnedXP),
          questsCompleted: FieldValue.increment(1), // ✅ Public Profile Sync
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // ✅ mark verification rewarded
      t.set(
        verificationRef,
        {
          rewarded: true,
          earnedXP,
          rewardedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return {
        success: true,
        earnedXP,
        newLevel: newLevel,
        bonuses,
        newBadges,
        questTitle: qData.title,
        memberName: memberDoc.data().name,
        currentStats,
      };
    });

    // ✅ SEND RESPONSE IMMEDIATELY (Critical data saved)
    res.json(result);

    // 🔥 Fire & Forget: Background activity logging
    if (result.success && !result.alreadyClaimed) {
      const { questTitle, memberName, earnedXP, newBadges, currentStats } =
        result;

      // Log quest completion in background
      console.log("🔔 [LiveFeed] Attempting to log quest completion:", {
        uid,
        memberName,
        questTitle,
        earnedXP,
      });
      db.collection("global_activity")
        .add({
          type: "quest",
          userId: uid,
          user: memberName || "Unknown Hero",
          action: `completed ${questTitle || "a quest"}`,
          target: questTitle || "Quest",
          earnedXP,
          timestamp: FieldValue.serverTimestamp(),
        })
        .then(() =>
          console.log("✅ [LiveFeed] Quest completion logged successfully"),
        )
        .catch((err) =>
          console.error("❌ [LiveFeed] Quest completion log FAILED:", err),
        );

      // Log badge unlocks in background
      const newlyUnlockedBadges = result.newBadges.filter(
        (badge) => !currentStats.badges || !currentStats.badges.includes(badge),
      );

      newlyUnlockedBadges.forEach((badge) => {
        db.collection("global_activity")
          .add({
            type: "badge",
            userId: uid,
            user: memberName || "Unknown Hero",
            action: `unlocked ${badge} badge`,
            target: badge,
            timestamp: FieldValue.serverTimestamp(),
          })
          .catch((err) =>
            console.error("⚠️ [Background] Badge activity log failed:", err),
          );
      });
    }
  } catch (err) {
    console.error("Finalize Quest Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

// Add this to backend/controllers/questController.js

export const leaveQuest = async (req, res) => {
  const { questId } = req.body;
  const uid = req.user.uid;

  if (!questId) return res.status(400).json({ error: "Missing questId" });

  try {
    const result = await db.runTransaction(async (t) => {
      const questRef = db.collection("quests").doc(questId);
      const userRef = db.collection("users").doc(uid);
      const userStatsRef = db.collection("userStats").doc(uid);

      // References to the subcollections we need to delete
      const memberRef = questRef.collection("members").doc(uid);
      const joinedQuestRef = userRef.collection("joinedQuests").doc(questId);

      const [questDoc, memberDoc, userStatsDoc] = await t.getAll(
        questRef,
        memberRef,
        userStatsRef,
      );

      if (!questDoc.exists) throw new Error("Quest not found");
      if (!memberDoc.exists)
        throw new Error("You are not a member of this quest");

      const questData = questDoc.data();

      // 🛡️ SECURITY: Host cannot leave their own quest (must delete instead)
      if (questData.hostId === uid) {
        throw new Error("Hosts cannot leave. You must delete the quest.");
      }

      // ⚖️ PENALTY LOGIC
      // If leaving less than 2 hours before start, apply penalty
      let xpPenalty = 0;
      const startTime = questData.startTime?.toDate();
      const now = new Date();

      if (startTime) {
        const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

        // If "flaking" last minute (less than 2 hours)
        if (hoursUntilStart < 2 && hoursUntilStart > -1) {
          xpPenalty = 50; // Deduction amount
        }
      }

      // 1. Remove from Quest Members Subcollection
      t.delete(memberRef);

      // 2. Remove from User's "My Missions" List
      t.delete(joinedQuestRef);

      // 3. Update Quest Document (Array & Count)
      t.update(questRef, {
        members: FieldValue.arrayRemove(uid),
        membersCount: FieldValue.increment(-1),
      });

      // 4. Apply Penalty (if any)
      if (xpPenalty > 0) {
        t.update(userRef, {
          xp: FieldValue.increment(-xpPenalty),
          reliabilityScore: FieldValue.increment(-5), // Hit their reputation
        });

        // Update private stats too
        if (userStatsDoc.exists) {
          t.update(userStatsRef, {
            xp: FieldValue.increment(-xpPenalty),
            reliabilityScore: FieldValue.increment(-5),
          });
        }
      }

      return {
        success: true,
        questTitle: questData.title,
        hostId: questData.hostId,
        leaverName: memberDoc.data().name || "A member",
        xpPenalty,
      };
    });

    res.json(result);

    // 🔥 Fire & Forget: Notify the Host that someone bailed
    if (result.success && result.hostId) {
      sendNotification(
        result.hostId,
        "Squad Update ⚠️",
        `${result.leaverName} has left "${result.questTitle}". A spot just opened up!`,
      ).catch((err) => console.error("Leave notification failed:", err));
    }
  } catch (error) {
    console.error("Leave Quest Error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * BADGE THRESHOLDS DEFINITION
 * Keys match frontend VibeReview.jsx vibetags IDs
 */
const BADGE_THRESHOLDS = {
  leader: { count: 5, id: "SQUAD_LEADER" },
  storyteller: { count: 5, id: "MASTER_STORYTELLER" },
  funny: { count: 5, id: "ICEBREAKER" },
  listener: { count: 5, id: "EMPATHETIC_SOUL" },
  teamplayer: { count: 5, id: "TEAM_PLAYER" },
  intellectual: { count: 5, id: "PHILOSOPHER" },
};

export const submitVibeCheck = async (req, res) => {
  const { questId, reviews } = req.body;
  const reviewerId = req.user.uid;

  console.log("📝 [VibeCheck] Request received:", {
    questId,
    reviews,
    reviewerId,
  });

  if (!questId || !reviews) {
    return res.status(400).json({ error: "Missing questId or reviews" });
  }

  try {
    const result = await db.runTransaction(async (t) => {
      console.log("📝 [VibeCheck] Transaction started");
      // 1. Validate Quest
      const questRef = db.collection("quests").doc(questId);
      const questDoc = await t.get(questRef);

      if (!questDoc.exists) throw new Error("Quest not found");

      // Verify reviewer was a member (security check)
      const reviewerMemberRef = questRef.collection("members").doc(reviewerId);
      const reviewerMemberSnap = await t.get(reviewerMemberRef);
      if (!reviewerMemberSnap.exists) {
        throw new Error("You were not a member of this quest");
      }

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

      // Update Reviewer
      const reviewerPayload = {
        xp: FieldValue.increment(reviewerReward),
        level: newReviewerLevel,
        thisWeekXP: FieldValue.increment(reviewerReward),
        updatedAt: FieldValue.serverTimestamp(),
      };
      t.update(reviewerRef, reviewerPayload);
      t.set(reviewerStatsRef, reviewerPayload, { merge: true });

      // Update Reviewed Users
      userIds.forEach((targetId) => {
        if (targetId === reviewerId) return;
        const tags = reviews[targetId]; // Array of tags e.g. ["leader", "tactician"]
        if (!tags || tags.length === 0) return;

        const targetRef = db.collection("users").doc(targetId);
        const targetStatsRef = db.collection("userStats").doc(targetId);
        const targetStatsData = snapMap.get(targetStatsRef.path) || {};

        const xpReward = tags.length * 5;
        const currentXP = targetStatsData.xp || 0;
        const newXP = currentXP + xpReward;
        const { level: newLevel } = calculateLevelFromXP(newXP);

        const targetPayload = {
          xp: FieldValue.increment(xpReward),
          level: newLevel,
          thisWeekXP: FieldValue.increment(xpReward),
          updatedAt: FieldValue.serverTimestamp(),
        };

        // ✅ FEEDBACK & BADGE LOGIC
        const currentFeedback =
          targetStatsData.feedbackCounts || targetStatsData.vibeTags || {};
        const currentBadges = targetStatsData.badges || [];
        const newBadges = [...currentBadges];
        let badgeUnlocked = false;

        tags.forEach((tag) => {
          // 1. Increment Count
          targetPayload[`feedbackCounts.${tag}`] = FieldValue.increment(1);

          // 2. Check Badge Threshold
          const currentCount = (currentFeedback[tag] || 0) + 1; // +1 because we are adding one now
          const threshold = BADGE_THRESHOLDS[tag];

          if (threshold && currentCount >= threshold.count) {
            if (!newBadges.includes(threshold.id)) {
              newBadges.push(threshold.id);
              badgeUnlocked = true;

              // Log Activity for Badge
              const logRef = db.collection("global_activity").doc();
              t.set(logRef, {
                type: "badge",
                userId: targetId,
                user: snapMap.get(targetRef.path)?.name || "Hero",
                action: `earned ${threshold.id.replace("_", " ")} badge`,
                target: threshold.id,
                timestamp: FieldValue.serverTimestamp(),
              });
            }
          }
        });

        if (badgeUnlocked) {
          targetPayload.badges = newBadges;
        }

        console.log("📝 [VibeCheck] Writing feedback for user:", targetId);
        console.log("📝 [VibeCheck] targetRef path:", targetRef.path);
        console.log("📝 [VibeCheck] targetStatsRef path:", targetStatsRef.path);
        console.log("📝 [VibeCheck] Payload:", JSON.stringify(targetPayload));

        // Write to users collection (for leaderboard compatibility)
        t.set(targetRef, targetPayload, { merge: true });

        // Write to userStats collection (for Profile page)
        t.set(targetStatsRef, targetPayload, { merge: true });
      });

      // 4. Activity Log for Reviewer
      const activityRef = db.collection("global_activity").doc();
      t.set(activityRef, {
        type: "vibe_check",
        userId: reviewerId,
        user: reviewerDataFromMap.name || "Hero",
        action: "completed squad review",
        target: "Vibe Check",
        earnedXP: reviewerReward,
        timestamp: FieldValue.serverTimestamp(),
      });

      return { success: true, earnedXP: reviewerReward };
    });

    res.json(result);
  } catch (error) {
    console.error("Vibe Check Error:", error);
    res.status(500).json({ error: error.message });
  }
};
