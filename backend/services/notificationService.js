import { db, messaging, FieldValue } from "../server.js";

/**
 * Sends an FCM notification to a specific user.
 *
 * @param {string} userId - The UID of the user to notify.
 * @param {string} title - Notification Title.
 * @param {string} body - Notification Body.
 * @param {object} data - Optional data payload.
 */
export const sendNotification = async (userId, title, body, data = {}) => {
  try {
    if (!userId) return;

    // Fetch user's FCM token
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      console.log(`🔕 [Notification] No FCM token for user: ${userId}`);
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK", // Standard or customize for PWA
      },
      token: fcmToken,
    };

    // Send the message
    await messaging.send(message);
    console.log(`🔔 [Notification] Sent to ${userId}: "${title}"`);
  } catch (error) {
    if (error.code === "messaging/registration-token-not-registered") {
      console.warn(
        `⚠️ [Notification] Invalid Token for user ${userId}. Cleaning up...`,
      );
      // Optional: Delete the invalid token from Firestore
      await db.collection("users").doc(userId).update({
        fcmToken: FieldValue.delete(),
      });
    } else {
      console.error(`❌ [Notification] Failed to send:`, error);
    }
  }
};
