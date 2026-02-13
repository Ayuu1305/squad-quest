import { loadFirebase } from "../firebase.lazy.js";
import { trackRead } from "../../utils/firestoreMonitor";

/**
 * Get vendor profile by vendor ID (user UID)
 */
export const getVendorProfile = async (vendorId) => {
  const { db, doc, getDoc } = await loadFirebase();
  const vendorRef = doc(db, "vendors", vendorId);
  const vendorSnap = await getDoc(vendorRef);

  if (!vendorSnap.exists()) {
    return null;
  }

  return { id: vendorSnap.id, ...vendorSnap.data() };
};

/**
 * Get vendor by hub ID
 */
export const getVendorByHubId = async (hubId) => {
  const { db, collection, query, where, getDocs } = await loadFirebase();
  const vendorsRef = collection(db, "vendors");
  const q = query(
    vendorsRef,
    where("hubId", "==", hubId),
    where("isActive", "==", true),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  // Return first active vendor for this hub
  const vendorDoc = snapshot.docs[0];
  return { id: vendorDoc.id, ...vendorDoc.data() };
};

/**
 * Get all hubs with vendor details (admin only)
 * Used for hub management dashboard
 */
export const getAllHubs = async () => {
  const { db, collection, getDocs } = await loadFirebase();
  const hubsRef = collection(db, "hubs");
  const snapshot = await getDocs(hubsRef);

  const hubs = [];
  for (const doc of snapshot.docs) {
    const hubData = { id: doc.id, ...doc.data() };

    // Fetch vendor details for each hub
    try {
      const vendor = await getVendorByHubId(doc.id);
      hubData.vendor = vendor;
    } catch (error) {
      console.warn(`Failed to fetch vendor for hub ${doc.id}:`, error);
      hubData.vendor = null;
    }

    hubs.push(hubData);
  }

  return hubs;
};

/**
 * Update hub details (admin only)
 */
export const updateHub = async (hubId, updates) => {
  const { db, doc, updateDoc, serverTimestamp } = await loadFirebase();
  const hubRef = doc(db, "hubs", hubId);

  await updateDoc(hubRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete hub (admin only)
 * Note: Vendor document is NOT deleted - vendors can create new hubs
 */
export const deleteHub = async (hubId) => {
  const { db, doc, deleteDoc } = await loadFirebase();
  const hubRef = doc(db, "hubs", hubId);
  await deleteDoc(hubRef);
};

/**
 * Mark quest as completed (vendor manual completion)
 */
export const markQuestComplete = async (questId) => {
  const { db, doc, updateDoc, serverTimestamp } = await loadFirebase();
  const questRef = doc(db, "quests", questId);

  await updateDoc(questRef, {
    status: "completed",
    completedAt: serverTimestamp(),
  });
};

/**
 * Subscribe to missions for a specific vendor's hub
 * Real-time listener for vendor dashboard
 */
export const subscribeToVendorMissions = (vendorId, hubId, callback) => {
  let unsubscribe = () => {};

  loadFirebase().then(
    ({ db, collection, query, where, orderBy, onSnapshot }) => {
      const questsRef = collection(db, "quests");

      // Filter missions by vendor's hub and show all statuses
      const q = query(
        questsRef,
        where("hubId", "==", hubId),
        orderBy("startTime", "desc"),
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          trackRead("subscribeToVendorMissions");

          const missions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          callback(missions);
        },
        (error) => {
          // ✅ SILENT: Permission denied is expected during logout cleanup
          if (error?.code === "permission-denied") {
            return; // Don't log warning - this is normal during logout
          }
          console.error("Error subscribing to vendor missions:", error);
        },
      );
    },
  );

  return () => unsubscribe && unsubscribe();
};

/**
 * Get mission statistics for vendor dashboard
 */
export const getVendorMissionStats = async (hubId, timeRange = "week") => {
  const { db, collection, query, where, getDocs, Timestamp } =
    await loadFirebase();

  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const questsRef = collection(db, "quests");
  const q = query(
    questsRef,
    where("hubId", "==", hubId),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
  );

  const snapshot = await getDocs(q);

  const stats = {
    totalMissions: snapshot.size,
    openMissions: 0,
    activeMissions: 0,
    completedMissions: 0,
    totalExpectedGuests: 0,
    averageGroupSize: 0,
  };

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    switch (data.status) {
      case "open":
        stats.openMissions++;
        break;
      case "active":
        stats.activeMissions++;
        break;
      case "completed":
        stats.completedMissions++;
        break;
    }

    // ✅ Use actual member count, not max capacity
    const actualMembers =
      data.members?.length || data.membersCount || data.currentPlayers || 0;
    stats.totalExpectedGuests += actualMembers;
  });

  stats.averageGroupSize =
    stats.totalMissions > 0
      ? Math.round(stats.totalExpectedGuests / stats.totalMissions)
      : 0;

  return stats;
};

/**
 * Create vendor account linked to hub
 */
export const createVendorAccount = async (vendorData) => {
  const { db, doc, setDoc, serverTimestamp } = await loadFirebase();

  const vendorId = vendorData.uid; // Firebase Auth UID
  const vendorRef = doc(db, "vendors", vendorId);

  await setDoc(vendorRef, {
    role: "vendor",
    uid: vendorId, // Good practice to store UID inside the doc too
    email: vendorData.email,
    hubId: vendorData.hubId,
    hubName: vendorData.hubName,
    hubAddress: vendorData.hubAddress,
    category: vendorData.category,
    city: vendorData.city,
    ownerName: vendorData.ownerName,
    phoneNumber: vendorData.phoneNumber,
    isActive: true,
    notificationPreferences: {
      email: true,
      sms: false,
      inApp: true,
      fcm: true,
    },
    fcmToken: vendorData.fcmToken || null,
    createdAt: serverTimestamp(),
  });

  return vendorId;
};

/**
 * Update vendor FCM token for push notifications
 */
export const updateVendorFCMToken = async (vendorId, fcmToken) => {
  const { db, doc, updateDoc } = await loadFirebase();

  const vendorRef = doc(db, "vendors", vendorId);
  await updateDoc(vendorRef, {
    fcmToken,
    fcmTokenUpdatedAt: new Date(),
  });
};

/**
 * Send notification to vendor when new mission is created at their hub
 * This will be called from createQuest function
 */
export const notifyVendorOfNewMission = async (questData) => {
  console.log("🔍 [VENDOR NOTIFY] Starting notification process...");
  console.log("🔍 [VENDOR NOTIFY] Quest data:", {
    hubId: questData.hubId,
    questId: questData.questId,
    title: questData.title,
    hostName: questData.hostName,
  });

  try {
    const vendor = await getVendorByHubId(questData.hubId);

    if (!vendor) {
      console.log(
        `⚠️ [VENDOR NOTIFY] No vendor found for hub: ${questData.hubId}`,
      );
      return;
    }

    console.log("✅ [VENDOR NOTIFY] Vendor found:", {
      vendorId: vendor.id,
      hubId: vendor.hubId,
      hubName: vendor.hubName,
    });

    // Store notification in Firestore for in-app display (ALWAYS create this)
    const { db, collection, addDoc, serverTimestamp, auth } =
      await loadFirebase();

    // Check current auth state
    const currentUser = auth.currentUser;
    console.log("🔐 [VENDOR NOTIFY] Auth state:", {
      isAuthenticated: !!currentUser,
      userId: currentUser?.uid,
      email: currentUser?.email,
    });

    const notificationData = {
      vendorId: vendor.id,
      questId: questData.questId || "unknown",
      hubId: questData.hubId,
      title: "🎯 New Mission Alert!",
      body: `${questData.hostName} created "${questData.title}" at ${new Date(questData.startTime?.seconds * 1000 || questData.startTime).toLocaleString()}`,
      read: false,
      createdAt: serverTimestamp(),
    };

    console.log(
      "📝 [VENDOR NOTIFY] Attempting to create notification with data:",
      notificationData,
    );

    await addDoc(collection(db, "vendor_notifications"), notificationData);

    console.log(
      "✅ [VENDOR NOTIFY] Notification created successfully for vendor:",
      vendor.id,
    );

    // 📱 Send actual FCM push notification via backend API
    if (vendor.fcmToken) {
      try {
        const response = await fetch("/api/notifications/send-vendor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: vendor.id,
            title: "🎯 New Mission Alert!",
            body: `${questData.hostName} created "${questData.title}" at ${new Date(questData.startTime?.seconds * 1000 || questData.startTime).toLocaleString()}`,
            data: {
              type: "new_mission",
              questId: questData.questId || "unknown",
              hubId: questData.hubId,
            },
          }),
        });

        if (response.ok) {
          console.log("✅ [VENDOR NOTIFY] FCM push sent successfully");
        } else {
          console.error(
            "❌ [VENDOR NOTIFY] FCM push failed:",
            await response.text(),
          );
        }
      } catch (error) {
        console.error("❌ [VENDOR NOTIFY] FCM push error:", error);
      }
    } else {
      console.log("⚠️ [VENDOR NOTIFY] No FCM token for vendor");
    }

    return true;
  } catch (error) {
    console.error("❌ [VENDOR NOTIFY] Error details:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    return false;
  }
};

/**
 * Get unread notifications for vendor
 */
export const getVendorNotifications = async (vendorId, limit = 20) => {
  const {
    db,
    collection,
    query,
    where,
    orderBy,
    limit: limitFn,
    getDocs,
  } = await loadFirebase();

  const notificationsRef = collection(db, "vendor_notifications");
  const q = query(
    notificationsRef,
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limitFn(limit),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  const { db, doc, updateDoc } = await loadFirebase();

  const notificationRef = doc(db, "vendor_notifications", notificationId);
  await updateDoc(notificationRef, {
    read: true,
    readAt: new Date(),
  });
};
/**
 * Mark all notifications as read for a vendor
 */
export const markAllNotificationsAsRead = async (vendorId) => {
  const { db, collection, query, where, getDocs, writeBatch } =
    await loadFirebase();

  const notificationsRef = collection(db, "vendor_notifications");
  const q = query(
    notificationsRef,
    where("vendorId", "==", vendorId),
    where("read", "==", false),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  // Use batch write for better performance
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};
