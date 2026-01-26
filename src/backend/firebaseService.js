import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  increment,
  setDoc,
  where,
  runTransaction,
  writeBatch,
  limit,
  startAfter,
  deleteDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { db, auth, googleProvider } from "./firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { updateClass } from "../utils/xp";
import { isShowdownActive } from "../utils/showdownUtils";
import { trackRead, trackWrite } from "../utils/firestoreMonitor"; // ✅ ADD TRACKING

/**
 * Creates a User profile if it doesn't exist.
 * Use the UID from Firebase Authentication.
 * SECURITY UPDATE: Writes ONLY to 'users' collection (safe fields).
 * Stats are now server-managed or read-only default.
 */
export const onboardHero = async (user) => {
  if (!user || !user.uid) {
    console.error("onboardHero aborted: Invalid user object", user);
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 1. Create Public Profile
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "New Hero",
        email: user.email,
        avatar:
          user.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        city: "Ahmedabad", // Default

        // ✅ Stats for Leaderboard & Indexing
        xp: 0,
        thisWeekXP: 0,
        lifetimeXP: 0, // ✅ All-Time leaderboard ranking
        level: 1,
        reliabilityScore: 100,
        questsCompleted: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Create Private Stats Document
      const userStatsRef = doc(db, "userStats", user.uid);
      await setDoc(userStatsRef, {
        xp: 0,
        thisWeekXP: 0,
        lifetimeXP: 0, // ✅ Total XP earned (never decreases)
        level: 1,
        reliabilityScore: 100,
        badges: [],
        daily_streak: 0,
        questsCompleted: 0, // ✅ Standardized Count
        feedbackCounts: {
          // ✅ Standardized Feedback Map
          leader: 0,
          tactician: 0,
          listener: 0,
          fearless: 0,
          mvp: 0,
        },
        createdAt: serverTimestamp(),
      });

      // ✅ NEW: Log new hero signup to global activity
      try {
        await addDoc(collection(db, "global_activity"), {
          type: "hero_joined",
          userId: user.uid,
          user: user.displayName || "New Hero",
          action: "joined the squad",
          target: "Squad Quest",
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Failed to log hero signup activity:", err);
      }

      console.log("New Hero Onboarded (Profile + Stats Locked)!");
    } else {
      console.log("Welcome back, Legend.");
    }
  } catch (error) {
    console.error("onboardHero failed:", error);
    // Don't throw, just log. allow login to proceed.
  }
};

export const updateHeroProfile = async (userId, data) => {
  const userRef = doc(db, "users", userId);
  // Security: Rules will only allow displayName, photoURL, city, class, gender
  await updateDoc(userRef, data);
};

// --- AUTHENTICATION ---
export const signUpWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    // Update name in Firebase Auth
    await updateProfile(userCredential.user, { displayName: name });
    // Pass the actual user object
    await onboardHero(userCredential.user);

    // 3. Send Verification Email
    await sendEmailVerification(userCredential.user);

    // 4. Sign out immediately to prevent auto-login before verification
    await auth.signOut();

    return userCredential.user;
  } catch (error) {
    console.error("signUpWithEmail failed:", error);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const user = userCredential.user;

  // ✅ ENFORCE EMAIL VERIFICATION
  if (!user.emailVerified) {
    // If not verified, we sign them out immediately to prevent session creation
    await auth.signOut();
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return user;
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await onboardHero(result.user);
  return result.user;
};

export const signOutUser = () => signOut(auth);

export const onAuthStateChangedListener = (callback) =>
  onAuthStateChanged(auth, callback);

export const resetHeroPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("resetHeroPassword failed:", error);
    throw error;
  }
};

// --- QUEST LOGIC ---

/**
 * SECURE JOIN: Uses Transaction + Subcollection
 */
// export const joinQuest = async (questId, secretCode = null) => {
//   try {
//     const token = await auth.currentUser.getIdToken();

//     const response = await fetch(`${API_URL}/quest/join`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ questId, secretCode }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Failed to join quest");
//     }

//     console.log("✅ Joined quest successfully:", data);
//     return data;
//   } catch (error) {
//     console.error("❌ Join Quest Error:", error);
//     throw error;
//   }
// };

// export const leaveQuest = async (questId, userId) => {
//   try {
//     const token = await getAuthToken();
//     const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

//     const response = await fetch(`${API_URL}/quest/${questId}/leave`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const result = await response.json();

//     if (!response.ok) {
//       throw new Error(result.error || "Failed to leave quest");
//     }

//     console.log(`✅ Left quest: ${questId}. XP penalty: -${result.xpPenalty}`);
//     return {
//       success: true,
//       xpPenalty: result.xpPenalty,
//       weeklyPenalty: result.weeklyPenalty,
//     };
//   } catch (error) {
//     console.error("❌ Leave quest failed:", error);
//     throw new Error(error.message || "Failed to leave quest");
//   }
// };

export const verifyQuestMember = async (questId, userId) => {
  // MVP Stub: Verification usually requires updates that might be restricted.
  // We'll leave this empty or basic log for now.
  console.log("Verify Quest Member (Stubbed for MVP Rules)");
};

export const saveQuestVerification = async (questId, uid, payload) => {
  if (!questId) throw new Error("questId missing");
  if (!uid) throw new Error("uid missing");

  // ✅ Check membership FIRST
  const memberRef = doc(db, "quests", questId, "members", uid);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    throw new Error("Not a quest member. Join quest first.");
  }

  // ✅ Write verification doc
  const verificationRef = doc(db, "quests", questId, "verifications", uid);

  await setDoc(
    verificationRef,
    {
      uid,
      questId,
      completed: true,
      rewarded: false, // ✅ Backend will set to true only after awarding XP
      completedAt: serverTimestamp(),
      locationVerified: Boolean(payload?.locationVerified),
      codeVerified: Boolean(payload?.codeVerified),
      photoURL: payload?.photoURL || "",
    },
    { merge: true },
  );

  // ✅ Mark quest completed for THIS USER (THIS FIXES YOUR REDIRECT LOOP)
  // Allowed by rules: status, completedBy, updatedAt
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, {
    completedBy: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });

  return true;
};

export const syncHubLocation = async (hubId, lat, lng) => {
  try {
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

export const createQuest = async (questData) => {
  const questsRef = collection(db, "quests");
  let roomCode = null;
  if (questData.isPrivate) {
    roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // ✅ FIX: Include host in members directly instead of calling joinQuest
  const newQuest = {
    ...questData,
    roomCode: roomCode || null,
    members: [questData.hostId], // Host is already a member
    currentPlayers: 1, // Start with 1 player (the host)
    status: "open",
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(questsRef, newQuest);

  // ✅ CRITICAL FIX: Add Host to 'members' subcollection so QuestCard UI updates!
  const membersRef = collection(db, "quests", docRef.id, "members");
  await setDoc(doc(membersRef, questData.hostId), {
    uid: questData.hostId,
    joinedAt: serverTimestamp(),
    role: "host",
    name: questData.hostName || "Host",
    avatar: questData.hostAvatar || "",
  });

  // ✅ Log quest creation to global activity
  try {
    await addDoc(collection(db, "global_activity"), {
      type: "quest_created",
      userId: questData.hostId,
      user: questData.hostName || "Unknown Hero",
      action: `posted new mission`,
      target: questData.title || "New Mission",
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Failed to log quest creation activity:", err);
  }

  return docRef.id;
};

// --- BACKEND API CONNECTOR ---
// ✅ MOVED ABOVE joinQuestByCode to fix ReferenceError (hoisting)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthToken = async () => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  return await auth.currentUser.getIdToken();
};

// ✅ Join Quest via Backend API
export const joinQuest = async (questId, secretCode = null) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/quest/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ questId, secretCode }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to join quest");
  }
  return data;
};

export const joinQuestByCode = async (code) => {
  const questsRef = collection(db, "quests");
  const cleanCode = code.trim().toUpperCase();

  console.log("Searching for code:", cleanCode); // ✅ Debug Log

  // First, try to find by room code
  const roomCodeQuery = query(
    questsRef,
    where("roomCode", "==", cleanCode),
    where("status", "==", "open"),
  );

  let querySnapshot = await getDocs(roomCodeQuery);

  // If no room code match, try secret code for private quests
  if (querySnapshot.empty) {
    const secretCodeQuery = query(
      questsRef,
      where("secretCode", "==", cleanCode),
      where("isPrivate", "==", true),
      where("status", "==", "open"),
    );
    querySnapshot = await getDocs(secretCodeQuery);
  }

  if (querySnapshot.empty) {
    throw new Error("Invalid Code - No quest found with this code");
  }

  const questDoc = querySnapshot.docs[0];
  const questId = questDoc.id;
  const questData = questDoc.data();

  // For private quests with secret code, pass the code for validation
  if (questData.isPrivate && questData.secretCode) {
    await joinQuest(questId, cleanCode);
  } else {
    await joinQuest(questId);
  }

  return questId;
};

// (API_URL, getAuthToken, and joinQuest moved above joinQuestByCode)

// ✅ Leave Quest via Backend API
export const leaveQuest = async (questId) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/quest/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ questId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to leave quest");
  }
  return data;
};

export const finalizeQuest = async (questId, verificationData) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/quest/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      questId,
      ...verificationData,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    // Handle "already claimed" gracefully if needed, or throw
    if (data.alreadyClaimed) return data;
    throw new Error(data.error || "Failed to finalize quest");
  }
  return data;
};

export const claimDailyBounty = async () => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/bounty/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Failed to claim bounty");
    error.status = response.status;
    throw error;
  }
  return data;
};

export const getWeeklyLeaderboard = async () => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/leaderboard/weekly`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch leaderboard");
  }
  return data;
};

export const subscribeToQuest = (questId, callback) => {
  const questRef = doc(db, "quests", questId);

  return onSnapshot(
    questRef,
    (docSnap) => {
      trackRead("subscribeToQuest"); // ✅ TRACK READ

      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        // ✅ DELETION DETECTION: Quest was deleted, notify callback with null
        console.warn(
          `🚫 [subscribeToQuest] Quest ${questId} no longer exists (deleted)`,
        );
        callback(null); // Signal deletion to listeners
      }
    },
    (error) => {
      if (error?.code === "permission-denied") {
        console.warn(`Quest read blocked: ${questId}`);
        return;
      }
      console.error(`Error subscribing to quest ${questId}:`, error);
    },
  );
};

// ✅ Helper: Check if user is a member of a quest (True Source of Truth)
export const isUserQuestMember = async (questId, uid) => {
  if (!questId || !uid) return false;
  try {
    const ref = doc(db, "quests", questId, "members", uid);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch (error) {
    console.warn("Membership check failed:", error);
    return false;
  }
};

// ✅ Helper: Check if user has personally verified a quest
export const getUserVerificationStatus = async (questId, uid) => {
  if (!questId || !uid) return false;
  try {
    const ref = doc(db, "quests", questId, "verifications", uid);
    const snap = await getDoc(ref);
    return snap.exists() && snap.data()?.completed === true;
  } catch (error) {
    console.warn("Verification check failed:", error);
    return false;
  }
};

// ✅ Modified for Pagination (Initial Load)
export const subscribeToAllQuests = (callback, cityFilter = null) => {
  const questsRef = collection(db, "quests");

  // ✅ LIMIT 10 for Initial Load (Faster)
  let q = query(questsRef, orderBy("createdAt", "desc"), limit(10));

  if (cityFilter) {
    q = query(
      questsRef,
      where("city", "==", cityFilter),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      trackRead("subscribeToAllQuests"); // ✅ TRACK READ
      const quests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // ✅ Pass lastVisible doc to callback securely
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      callback(quests, lastVisible);
    },
    (error) => {
      // ✅ Ignore permission denied spam
      if (error?.code === "permission-denied") {
        console.warn("Quests read blocked by rules (permission-denied).");
        return;
      }
      console.error("Error subscribing to all quests:", error);
    },
  );
};

// ✅ NEW: Pagination Service
export const fetchMoreQuests = async (lastDoc, cityFilter = null) => {
  if (!lastDoc) return { quests: [], lastVisible: null };

  const questsRef = collection(db, "quests");
  let q = query(
    questsRef,
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(10),
  );

  if (cityFilter) {
    q = query(
      questsRef,
      where("city", "==", cityFilter),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(10),
    );
  }

  const snapshot = await getDocs(q);
  const quests = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { quests, lastVisible };
};

/**
 * Updates quest status (ONLY host can do this due to Firestore rules)
 */
export const updateQuestStatus = async (questId, status) => {
  if (!questId) throw new Error("questId is required");
  if (!status) throw new Error("status is required");

  const questRef = doc(db, "quests", questId);

  await updateDoc(questRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

// --- CHAT LOGIC ---

export const sendSquadMessage = async (questId, userId, text, senderName) => {
  if (!text.trim()) return;
  // Secure Path: quests/{id}/chat
  const messagesRef = collection(db, "quests", questId, "chat");
  await addDoc(messagesRef, {
    text: text,
    senderId: userId,
    senderName: senderName,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToSquadChat = (questId, callback) => {
  const q = query(
    collection(db, "quests", questId, "chat"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      trackRead("subscribeToSquadChat"); // ✅ TRACK READ
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error(
        `Error subscribing to squad chat for quest ${questId}:`,
        error,
      );
    },
  );
};

// --- REFINED XP & LEVEL LOGIC ---

// --- LEGACY STUBS (Kept for compatibility if imported elsewhere, but effectively disabled) ---

export const checkLevelUp = async () => {
  console.warn("checkLevelUp is server-side only now.");
  return false;
};

export const awardXP = async () => {
  console.warn("awardXP is server-side only now.");
};

export const finalizeUserQuestStats = async () => {
  console.warn("finalizeUserQuestStats is server-side only now.");
};

export const resetWeeklyLeaderboardManual = async () => {
  console.warn("Manual Reset disabled.");
  return false;
};

export const checkStreak = async (userId) => {
  if (!userId) {
    console.warn("❌ [checkStreak] No userId provided");
    return { status: "error", message: "User ID required" };
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

// Old claimDailyBounty was here, removed to avoid duplicate.

/**
 * Simulated Cloud Function: Weekly Reset (Sunday 11:59PM logic)
 * DISABLED: Security Rules block client-side batch updates.
 */
export const simulateWeeklyReset = async () => {
  console.log("🔒 Security: simulateWeeklyReset disabled on client.");
  return false;
};

export const syncServerTime = async () => {
  try {
    // For now, we'll return 0, but ensured it's a valid async function.
    return 0;
  } catch (e) {
    return 0;
  }
};

export const submitVibeChecks = async (questId, reviews) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/quest/vibe-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      questId,
      reviews,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to submit vibe checks");
  }
  return data;
};

// ✅ NEW: Delete Quest (Backend API - Host only)
export const deleteQuestAPI = async (questId) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/quest/${questId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete quest");
  }
  return data;
};

// ✅ NEW: Edit Quest (Backend API - Host only)
export const editQuestAPI = async (questId, updates) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/quest/${questId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to edit quest");
  }
  return data;
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
