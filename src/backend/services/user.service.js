import { loadFirebase } from "../firebase.lazy.js";

export const syncHubLocation = async (hubId, lat, lng) => {
  try {
    const { db, doc, updateDoc } = await loadFirebase();

    const hubRef = doc(db, "hubs", hubId);
    await updateDoc(hubRef, {
      lat: lat,
      long: lng,
      coordinates: { latitude: lat, longitude: lng },
    });
  } catch (err) {
    console.warn("Hub location sync failed (Permissions):", err.code);
  }
};

export const createReport = async (reportData) => {
  const { db, collection, addDoc, serverTimestamp } = await loadFirebase();

  const reportsRef = collection(db, "reports");
  await addDoc(reportsRef, {
    ...reportData,
    timestamp: serverTimestamp(),
  });
};

export const logActivity = async (type, userName, action, target) => {
  // Global activity writes are now restricted to Cloud Functions for major events.
  // We keep this for non-critical client logs if allowed, but most will fail silently now.
  try {
    const { db, collection, addDoc, serverTimestamp } = await loadFirebase();

    await addDoc(collection(db, "global_activity"), {
      type,
      user: userName,
      action,
      target,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn(
      "Log Activity suppressed by rules (Client Write Blocked):",
      error,
    );
  }
};

export const checkStreak = async (userId) => {
  if (!userId) {
    console.warn("❌ [checkStreak] No userId provided");
    return { status: "error", message: "User ID required" };
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const { auth } = await loadFirebase();
    const token = await auth.currentUser.getIdToken();

    const response = await fetch(`${API_URL}/user/sync-streak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to sync streak");
    }

    const result = await response.json();
    console.log("✅ [checkStreak] Streak synced:", result);

    return result;
  } catch (error) {
    console.error("❌ [checkStreak] API Error:", error);
    return { status: "error", message: error.message };
  }
};

/**
 * Mark a reward as claimed to prevent re-showing on page refresh
 * @param {string} uid - User ID
 * @param {string} type - Reward type: "LEVEL", "BADGE", or "RANK"
 * @param {any} value - The value to persist (level number, badge ID, or rank name)
 */
export const markRewardAsClaimed = async (uid, type, value) => {
  if (!uid) {
    console.warn("❌ [markRewardAsClaimed] No UID provided");
    return;
  }

  try {
    const { db, doc, updateDoc, arrayUnion } = await loadFirebase();
    const userRef = doc(db, "users", uid);

    if (type === "LEVEL") {
      await updateDoc(userRef, {
        "claimedRewards.lastClaimedLevel": value,
      });
      console.log(`✅ Marked Level ${value} as claimed for user ${uid}`);
    } else if (type === "BADGE") {
      await updateDoc(userRef, {
        "claimedRewards.claimedBadges": arrayUnion(value),
      });
      console.log(`✅ Marked Badge ${value} as claimed for user ${uid}`);
    } else if (type === "RANK") {
      await updateDoc(userRef, {
        "claimedRewards.lastClaimedRank": value,
      });
      console.log(`✅ Marked Rank ${value} as claimed for user ${uid}`);
    }
  } catch (error) {
    console.error("❌ Failed to mark reward as claimed:", error);
    // Don't throw - allow dismissal to proceed even if write fails
  }
};

/**
 * Mark onboarding as complete for a user
 * @param {string} uid - User ID
 */
export const completeOnboarding = async (uid) => {
  if (!uid) {
    console.warn("❌ [completeOnboarding] No UID provided");
    return;
  }

  try {
    const { db, doc, updateDoc } = await loadFirebase();
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      hasSeenOnboarding: true,
      onboardingCompletedAt: new Date(),
    });

    console.log(`✅ Onboarding marked as complete for user ${uid}`);
  } catch (error) {
    console.error("❌ Failed to mark onboarding as complete:", error);
    throw error;
  }
};

export const syncServerTime = async () => {
  try {
    // For now, we'll return 0, but ensured it's a valid async function.
    return 0;
  } catch (e) {
    return 0;
  }
};

/**
 * Acknowledge a violation
 * @param {number} violationIndex - Index of the violation in the violations array
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const acknowledgeViolation = async (violationIndex) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const { auth } = await loadFirebase();
  const token = await auth.currentUser.getIdToken();

  const response = await fetch(`${API_URL}/user/acknowledge-violation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ violationIndex }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to acknowledge violation");
  }

  console.log(`✅ Violation ${violationIndex} acknowledged`);
  return data;
};
