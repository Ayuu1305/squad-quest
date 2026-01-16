const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Scheduled Weekly Reset: Monday 00:00 IST
exports.resetWeeklyLeaderboard = functions.pubsub
  .schedule("0 0 * * 1")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const db = admin.firestore();
    console.log("Starting Weekly Leaderboard Reset...");

    try {
      // 1. Identify the Weekly Legend (Top XP Earner)
      const championsSnapshot = await db
        .collection("users")
        .orderBy("thisWeekXP", "desc")
        .limit(1)
        .get();

      if (!championsSnapshot.empty) {
        const championDoc = championsSnapshot.docs[0];
        const championData = championDoc.data();
        const champName = championData.name || "Unknown Hero";

        console.log(
          `Weekly Legend Identified: ${champName} (${championDoc.id})`
        );

        // Award Badge
        await championDoc.ref.update({
          badges: admin.firestore.FieldValue.arrayUnion({
            id: `legend_${Date.now()}`,
            name: "Weekly Legend",
            icon: "Crown",
            awardedAt: new Date().toISOString(),
          }),
        });

        // Send Global Notification (Topic: 'all_users')
        await admin.messaging().send({
          topic: "all_users",
          notification: {
            title: " The Showdown is Over!",
            body: `Congratulations to ${champName}, our new Weekly Legend! The board has been wiped clean.`,
          },
          data: {
            type: "weekly_reset",
            legend: champName,
          },
        });
      }

      // 2. Reset All Users' Weekly XP
      const usersSnapshot = await db.collection("users").get();

      const batchSize = 500;
      let currentBatch = db.batch();
      let opCount = 0;
      const batches = [];

      usersSnapshot.docs.forEach((doc) => {
        currentBatch.update(doc.ref, {
          thisWeekXP: 0,
          weekly_stats_last_reset: admin.firestore.FieldValue.serverTimestamp(),
        });
        opCount++;

        if (opCount >= batchSize) {
          batches.push(currentBatch.commit());
          currentBatch = db.batch();
          opCount = 0;
        }
      });

      if (opCount > 0) {
        batches.push(currentBatch.commit());
      }

      await Promise.all(batches);
      console.log(
        `Weekly reset completed. Processed ${usersSnapshot.size} heroes.`
      );
    } catch (error) {
      console.error("Critical Error in Weekly Reset:", error);
    }

    return null;
  });

// --- SECURE GAME LOGIC ---

/**
 * 1) finalizeQuestCompletion
 * Triggered when a user writes to quests/{questId}/verifications/{uid}
 */
exports.finalizeQuestCompletion = functions.firestore
  .document("quests/{questId}/verifications/{uid}")
  .onWrite(async (change, context) => {
    const { questId, uid } = context.params;
    const db = admin.firestore();

    // If document was deleted, do nothing
    if (!change.after.exists) return null;

    const verificationData = change.after.data();

    // Check if idempotent (prevent double rewards)
    if (verificationData.rewarded === true) {
      console.log(`Quest ${questId} already rewarded for user ${uid}`);
      return null;
    }

    try {
      // 1. Verify membership
      const memberRef = db.doc(`quests/${questId}/members/${uid}`);
      const memberSnap = await memberRef.get();
      if (!memberSnap.exists) {
        console.error(`User ${uid} is not a member of quest ${questId}`);
        return null;
      }

      // 2. Get Quest Data
      const questRef = db.doc(`quests/${questId}`);
      const questSnap = await questRef.get();
      if (!questSnap.exists) {
        console.error(`Quest ${questId} not found`);
        return null;
      }
      const questData = questSnap.data();

      // 3. Calculate XP & Stats
      let earnedXP = 100; // Base XP

      // Punctuality check
      const startTime = questData.startTime?.toDate
        ? questData.startTime.toDate()
        : new Date(questData.startTime);
      const completionTime = verificationData.completedAt?.toDate
        ? verificationData.completedAt.toDate()
        : new Date();
      const timeDiffMins = Math.abs(completionTime - startTime) / (1000 * 60);
      const isOnTime = timeDiffMins <= 5;

      if (isOnTime) earnedXP += 25;

      const isLeader =
        questData.partyLeader === uid || questData.hostId === uid;
      const hasPhoto =
        verificationData.photoURL && verificationData.photoURL !== "";

      if (hasPhoto) {
        earnedXP += 20;
        if (isLeader) {
          // Leader bonus based on member count
          const membersSnap = await db
            .collection(`quests/${questId}/members`)
            .get();
          const memberCount = membersSnap.size;
          earnedXP += Math.max(0, memberCount - 1) * 10;
        }
      } else {
        // Reduced XP if no photo
        earnedXP = Math.floor(earnedXP * 0.5);
      }

      // Showdown Multiplier (x2)
      // Logic from showdownUtils.js
      const day = completionTime.getDay(); // 0 is Sunday
      const hours = completionTime.getHours();
      const isShowdown = day === 0 && hours >= 21;

      if (isShowdown) {
        earnedXP *= 2;
      }

      // 4. Update User Stats securely
      const userRef = db.doc(`users/${uid}`);
      const userSnap = await userRef.get();
      const userData = userSnap.data() || {};
      const currentXP = userData.xp || 0;
      const currentLevel = userData.level || 1;
      const currentThisWeekXP = userData.thisWeekXP || 0;
      const currentReliability = userData.reliabilityScore || 90;

      const newXP = currentXP + earnedXP;
      const newThisWeekXP = currentThisWeekXP + earnedXP;
      const newLevel =
        Math.floor(newXP / (currentLevel * 100)) > 0
          ? currentLevel + 1
          : currentLevel;
      const leveledUp = newLevel > currentLevel;
      const newReliability = Math.min(100, currentReliability + 1);

      const userUpdate = {
        xp: newXP,
        level: newLevel,
        thisWeekXP: newThisWeekXP,
        reliabilityScore: newReliability,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (leveledUp) {
        // Add level up badge if needed
        userUpdate.badges = admin.firestore.FieldValue.arrayUnion({
          id: `level_${newLevel}`,
          name: `Level ${newLevel} Reached`,
          icon: "Sparkles",
          awardedAt: new Date().toISOString(),
        });
      }

      await userRef.update(userUpdate);

      // 5. Mark verification as rewarded (Idempotency)
      await change.after.ref.update({ rewarded: true, earnedXP });

      // 6. Log Global Activity
      const userName = userData.name || "Hero";
      const activityRef = db.collection("global_activity").doc();
      await activityRef.set({
        type: "mission_completed",
        user: userName,
        action: "completed mission",
        target: questData.title || "Unknown Quest",
        xpGained: earnedXP,
        leveledUp: leveledUp,
        newLevel: newLevel,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `Successfully rewarded ${uid} for quest ${questId}: ${earnedXP} XP`
      );
    } catch (error) {
      console.error("Error in finalizeQuestCompletion:", error);
    }
    return null;
  });

/**
 * 2) claimDailyBounty
 * Callable function for users to claim their daily reward safely.
 */
exports.claimDailyBounty = functions.https.onCall(async (data, context) => {
  // Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const uid = context.auth.uid;
  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);

  try {
    return await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User profile not found."
        );
      }

      const userData = userSnap.data();
      const lastClaimed = userData.last_claimed_at?.toDate
        ? userData.last_claimed_at.toDate()
        : null;
      const now = new Date();

      // Check 25-hour cooldown
      if (lastClaimed) {
        const diffMs = now - lastClaimed;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 25) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Bounty on cooldown. Wait 25 hours."
          );
        }
      }

      // Check Streak Logic
      let currentStreak = userData.daily_streak || 0;
      if (lastClaimed) {
        const diffMs = now - lastClaimed;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours <= 48) {
          currentStreak += 1;
        } else {
          currentStreak = 1; // Reset streak if more than 48h
        }
      } else {
        currentStreak = 1;
      }

      // Calculate XP
      const multiplier = Math.min(2.0, 1.0 + currentStreak * 0.05);
      const baseXP = 50;
      const totalXP = Math.floor(baseXP * multiplier);

      // Update User
      const newXP = (userData.xp || 0) + totalXP;
      const newThisWeekXP = (userData.thisWeekXP || 0) + totalXP;
      const currentLevel = userData.level || 1;
      const newLevel =
        Math.floor(newXP / (currentLevel * 100)) > 0
          ? currentLevel + 1
          : currentLevel;
      const leveledUp = newLevel > currentLevel;

      const userUpdate = {
        xp: newXP,
        thisWeekXP: newThisWeekXP,
        level: newLevel,
        daily_streak: currentStreak,
        last_claimed_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (leveledUp) {
        userUpdate.badges = admin.firestore.FieldValue.arrayUnion({
          id: `level_${newLevel}`,
          name: `Level ${newLevel} Reached`,
          icon: "Sparkles",
          awardedAt: new Date().toISOString(),
        });
      }

      transaction.update(userRef, userUpdate);

      // Log Global Activity
      const activityRef = db.collection("global_activity").doc();
      transaction.set(activityRef, {
        type: "daily_bounty",
        user: userData.name || "Hero",
        action: "claimed daily bounty",
        target: `${totalXP} XP`,
        xpGained: totalXP,
        streak: currentStreak,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        xpGained: totalXP,
        newXP: newXP,
        streak: currentStreak,
        leveledUp: leveledUp,
        newLevel: newLevel,
      };
    });
  } catch (error) {
    console.error("Error in claimDailyBounty:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Bounty claim failed.");
  }
});

// HTTP Trigger for Manual Testing
exports.testWeeklyReset = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  try {
    // Start Reset Logic (Same as Cron)
    const championsSnapshot = await db
      .collection("users")
      .orderBy("thisWeekXP", "desc")
      .limit(1)
      .get();
    if (!championsSnapshot.empty) {
      const doc = championsSnapshot.docs[0];
      await doc.ref.update({
        badges: admin.firestore.FieldValue.arrayUnion({
          id: `legend_test_${Date.now()}`,
          name: "Weekly Legend (Test)",
          icon: "Crown",
          awardedAt: new Date().toISOString(),
        }),
      });
    }

    // Reset stats (Limit to 50 for testing safety)
    const users = await db.collection("users").limit(50).get();
    const batch = db.batch();
    users.docs.forEach((doc) => {
      batch.update(doc.ref, {
        thisWeekXP: 0,
        weekly_stats_last_reset: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    res.send("Weekly Reset Logic Executed Successfully (Test Mode).");
  } catch (error) {
    console.error(error);
    res.status(500).send(error.toString());
  }
});
