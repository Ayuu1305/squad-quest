import { db, admin } from "../server.js";
import { calculateLevelFromXP } from "../utils/leveling.js";
import { sendNotification } from "../services/notificationService.js";

// ... existing imports ...

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

      // Check if already joined
      if (memberDoc.exists) return { success: true, alreadyJoined: true };

      // Add Member
      t.set(memberRef, {
        uid,
        name: userDoc.data()?.name || "Unknown Hero",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "member",
      });

      // Update Quest Counts
      t.update(questRef, {
        membersCount: admin.firestore.FieldValue.increment(1),
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

    // ✅ NOTIFICATIONS (Outside Transaction to avoid blocking)
    if (result.success && !result.alreadyJoined) {
      const {
        hostId,
        questTitle,
        currentMembers,
        maxPlayers,
        hotZoneNotified,
      } = result;
      const joinerName = req.user.name || "A Hero";

      // Event B: Host Alert (New Member)
      if (hostId && hostId !== uid) {
        await sendNotification(
          hostId,
          "New Squad Member! 🚀",
          `${joinerName} just joined "${questTitle}". Check the lobby.`,
        );
      }

      // Event C: Hot Zone Alert (75% Capacity)
      const usage = currentMembers / maxPlayers;
      if (usage >= 0.75 && !hotZoneNotified) {
        // Notify Host
        await sendNotification(
          hostId,
          "🔥 Hot Zone Active!",
          `Your quest "${questTitle}" is ${Math.round(usage * 100)}% full! It's filling up fast.`,
        );

        // Update flag to prevent spam
        await db.collection("quests").doc(questId).update({
          hotZoneNotified: true,
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Join Quest Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ... existing exports ...
