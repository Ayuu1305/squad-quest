import { db, messaging, FieldValue } from "../server.js";

const cleanNotificationText = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
};

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

    // Clean title and body for native notification display
    const cleanTitle = cleanNotificationText(title);
    const cleanBody = cleanNotificationText(body);

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
        title: cleanTitle,
        body: cleanBody,
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
