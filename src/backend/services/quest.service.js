import { loadFirebase } from "../firebase.lazy.js";
import { trackRead } from "../../utils/firestoreMonitor";

// --- BACKEND API CONNECTOR ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthToken = async () => {
  const { auth } = await loadFirebase();
  if (!auth.currentUser) throw new Error("User not authenticated");
  return await auth.currentUser.getIdToken();
};

export const createQuest = async (questData) => {
  const { db, collection, addDoc, serverTimestamp, doc, setDoc } =
    await loadFirebase();

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
  const { db, collection, query, where, getDocs } = await loadFirebase();

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
  let unsubscribe = () => {};

  loadFirebase().then(({ db, doc, onSnapshot }) => {
    const questRef = doc(db, "quests", questId);

    unsubscribe = onSnapshot(
      questRef,
      (docSnap) => {
        trackRead("subscribeToQuest");

        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() });
        } else {
          callback(null);
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
  });

  return () => unsubscribe && unsubscribe();
};

// ✅ Helper: Check if user is a member of a quest (True Source of Truth)
export const isUserQuestMember = async (questId, uid) => {
  if (!questId || !uid) return false;
  try {
    const { db, doc, getDoc } = await loadFirebase();
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
    const { db, doc, getDoc } = await loadFirebase();
    const ref = doc(db, "quests", questId, "verifications", uid);
    const snap = await getDoc(ref);
    return snap.exists() && snap.data()?.completed === true;
  } catch (error) {
    console.warn("Verification check failed:", error);
    return false;
  }
};

// ✅ Save Quest Verification (Client-Side)
export const saveQuestVerification = async (questId, uid, payload) => {
   const { db, serverTimestamp, doc, setDoc, updateDoc, getDoc, arrayUnion } =
    await loadFirebase();
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


// ✅ Modified for Pagination (Initial Load)
export const subscribeToAllQuests = (callback, cityFilter = null) => {
  let unsubscribe = () => {};

  loadFirebase().then(
    ({ db, collection, query, orderBy, limit, where, onSnapshot }) => {
      const questsRef = collection(db, "quests");

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

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          trackRead("subscribeToAllQuests");
          const quests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const lastVisible = snapshot.docs[snapshot.docs.length - 1];
          callback(quests, lastVisible);
        },
        (error) => {
          if (error?.code === "permission-denied") return;
          console.error("Error subscribing to all quests:", error);
        },
      );
    },
  );

  return () => unsubscribe && unsubscribe();
};

// ✅ NEW: Pagination Service
export const fetchMoreQuests = async (lastDoc, cityFilter = null) => {
  if (!lastDoc) return { quests: [], lastVisible: null };

  const { db, collection, query, orderBy, startAfter, limit, where, getDocs } =
    await loadFirebase();

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

  const { db, doc, updateDoc, serverTimestamp } = await loadFirebase();
  const questRef = doc(db, "quests", questId);

  await updateDoc(questRef, {
    status,
    updatedAt: serverTimestamp(),
  });
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
