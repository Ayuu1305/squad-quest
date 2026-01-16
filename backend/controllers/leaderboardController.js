import { db } from "../server.js";

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const getWeeklyLeaderboard = async (req, res) => {
  try {
    const { city } = req.query;
    const targetCity = city || "Ahmedabad";

    // --- LAZY WEEKLY RESET CHECK ---
    const metaRef = db.collection("meta").doc("weekly_reset");
    const metaSnap = await metaRef.get();
    const now = new Date();
    const currentWeekStart = getStartOfWeek(now).toISOString();

    let shouldReset = false;

    if (!metaSnap.exists) {
      shouldReset = true;
    } else {
      const lastReset = metaSnap.data().lastResetISO;
      if (lastReset !== currentWeekStart) {
        shouldReset = true;
      }
    }

    if (shouldReset) {
      console.log("⚠️ TRIGGERING WEEKLY LEADERBOARD RESET...");
      const usersRef = db.collection("users");
      // Find all users with thisWeekXP > 0
      // We process in batches of 500 if mostly needed, but for MVP standard batch is fine
      // Warning: If thousands of users, this might timeout. For now simple batch.
      const snapshot = await usersRef.where("thisWeekXP", ">", 0).get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { thisWeekXP: 0 });
          // Also update userStats if we want perfect sync, but leaderboard reads 'users'
          const statsRef = db.collection("userStats").doc(doc.id);
          batch.update(statsRef, { thisWeekXP: 0 });
        });
        await batch.commit();
      }

      // Update Meta
      await metaRef.set({ lastResetISO: currentWeekStart });
      console.log("✅ Weekly Reset Complete.");
    }

    // --- FETCH LEADERBOARD ---
    // Query 'users' collection directly
    const usersRef = db.collection("users");
    const q = usersRef
      .where("city", "==", targetCity)
      .orderBy("thisWeekXP", "desc") // Weekly Leaderboard uses NEW field
      .limit(50);

    const snapshot = await q.get();

    const leaderboard = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || "Unknown",
        avatar: data.avatar || "",
        thisWeekXP: data.thisWeekXP || 0, // Ensure specific fields
        xp: data.xp || 0,
        level: data.level || 1,
      };
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("getWeeklyLeaderboard Error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};
