import { loadFirebase } from "../firebase.lazy";
import toast from "react-hot-toast";

/**
 * Join Request Service
 * Manages host approval requests for women-only quests
 */

/**
 * Request to join a women-only quest
 * @param {string} questId - Quest ID
 * @param {Object} questData - Quest details (title, hostId)
 * @param {Object} userData - User details (uid, name, gender, level, etc.)
 * @returns {Promise<string>} Request ID
 */
export const requestJoinApproval = async (questId, questData, userData) => {
  try {
    const { db, collection, addDoc, serverTimestamp } = await loadFirebase();

    const requestData = {
      // Quest info
      questId,
      questTitle: questData.title || "Untitled Quest",
      hostId: questData.hostId,

      // User info
      userId: userData.uid,
      userName: userData.name || "Unknown User",
      userGender: userData.gender || "Not specified",
      userLevel: userData.level || 1,
      userQuestsCompleted: userData.questsCompleted || 0,
      userPhotoVerifications: userData.photoVerificationCount || 0,
      userVerifiedGender: userData.verifiedGender || null,
      userReliabilityScore: userData.reliabilityScore || 100,
      userAvatarSeed: userData.avatarSeed || userData.uid,
      userAvatar: userData.avatar || null,

      // Request metadata
      status: "pending",
      requestedAt: serverTimestamp(),
      respondedAt: null,
      respondedBy: null,
    };

    const requestRef = await addDoc(
      collection(db, "joinRequests"),
      requestData,
    );

    console.log("✅ [JoinRequest] Request created:", requestRef.id);

    // TODO: Send FCM notification to host
    // await sendHostNotification(questData.hostId, { ... });

    return requestRef.id;
  } catch (error) {
    console.error("❌ [JoinRequest] Failed to create request:", error);
    throw error;
  }
};

/**
 * Approve a join request
 */
export const approveJoinRequest = async (requestId, hostId) => {
  try {
    // 1. IMPORT setDoc (Needed for subcollection)
    const { db, doc, getDoc, updateDoc, setDoc, serverTimestamp, arrayUnion } =
      await loadFirebase();

    // 2. Get request data
    const requestRef = doc(db, "joinRequests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) throw new Error("Request not found");
    const requestData = requestSnap.data();

    // 3. Security Checks
    if (requestData.hostId !== hostId) throw new Error("Unauthorized");
    if (requestData.status !== "pending") throw new Error(`Request already ${requestData.status}`);

    // 4. Update request status (History)
    await updateDoc(requestRef, {
      status: "approved",
      respondedAt: serverTimestamp(),
      respondedBy: hostId,
    });

    console.log("✅ [JoinRequest] Status Approved");

    // 5. Add to Quest Document (ARRAY) -> Triggers "Enter Lobby" logic
    const questRef = doc(db, "quests", requestData.questId);
    await updateDoc(questRef, {
      members: arrayUnion(requestData.userId),
    });

    // 6. ✅ CRITICAL FIX: Add to Members Subcollection -> Fixes "Squad Count"
    const memberSubRef = doc(db, "quests", requestData.questId, "members", requestData.userId);
    await setDoc(memberSubRef, {
      uid: requestData.userId,
      name: requestData.userName,
      avatar: requestData.userAvatar || null,
      joinedAt: serverTimestamp(),
      role: "member",
      // Add any other user fields you need for the squad list
    });

    console.log("✅ [JoinRequest] User added to Array AND Subcollection");
    toast.success(`${requestData.userName} has been accepted!`);
  } catch (error) {
    console.error("❌ Approval failed:", error);
    toast.error(error.message || "Failed to approve");
    throw error;
  }
};

/**
 * Deny a join request
 * @param {string} requestId - Request ID
 * @param {string} hostId - Host user ID (for verification)
 * @returns {Promise<void>}
 */
export const denyJoinRequest = async (requestId, hostId) => {
  try {
    const { db, doc, getDoc, updateDoc, serverTimestamp } =
      await loadFirebase();

    // Get request data
    const requestRef = doc(db, "joinRequests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Request not found");
    }

    const requestData = requestSnap.data();

    // Verify host owns the quest
    if (requestData.hostId !== hostId) {
      throw new Error("Unauthorized: Only the host can deny requests");
    }

    // Verify request is still pending
    if (requestData.status !== "pending") {
      throw new Error(`Request already ${requestData.status}`);
    }

    // Update request status
    await updateDoc(requestRef, {
      status: "denied",
      respondedAt: serverTimestamp(),
      respondedBy: hostId,
    });

    console.log("❌ [JoinRequest] Request denied:", requestId);

    // TODO: Send FCM notification to user
    // await sendUserNotification(requestData.userId, "denied", { ... });

    toast.success("Request denied");
  } catch (error) {
    console.error("❌ [JoinRequest] Failed to deny request:", error);
    toast.error(error.message || "Failed to deny request");
    throw error;
  }
};

/**
 * Subscribe to pending join requests for a quest (real-time)
 * @param {string} questId - Quest ID
 * @param {string} hostId - Host ID (REQUIRED for Security Rules)
 * @param {Function} callback - Callback function(requests)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPendingRequests = (questId, hostId, callback) => {
  const setupListener = async () => {
    try {
      const { db, collection, query, where, onSnapshot, orderBy } =
        await loadFirebase();

      const requestsRef = collection(db, "joinRequests");
      
      // 🔒 SECURITY FIX: We MUST filter by hostId to satisfy Firestore Rules
      const q = query(
        requestsRef,
        where("questId", "==", questId),
        where("hostId", "==", hostId), // 👈 ADD THIS LINE
        where("status", "==", "pending"),
        orderBy("requestedAt", "desc")
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const requests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(requests);
        },
        (error) => {
          console.error("❌ [JoinRequest] Listener error:", error);
          // Common error: Missing Index. Check console for a link!
        }
      );
    } catch (error) {
      console.error("❌ [JoinRequest] Failed to setup listener:", error);
      return () => {}; 
    }
  };

  let unsubscribe = () => {};
  setupListener().then((unsub) => {
    unsubscribe = unsub;
  });

  return () => unsubscribe();
};

/**
 * Get user's join request status for a quest
 * @param {string} questId - Quest ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Request object or null
 */
export const getUserRequestStatus = async (questId, userId) => {
  try {
    const { db, collection, query, where, getDocs, orderBy, limit } =
      await loadFirebase();

    const requestsRef = collection(db, "joinRequests");
    const q = query(
      requestsRef,
      where("questId", "==", questId),
      where("userId", "==", userId),
      orderBy("requestedAt", "desc"),
      limit(1),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("❌ [JoinRequest] Failed to get user request:", error);
    return null;
  }
};
