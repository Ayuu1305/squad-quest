import { sendNotification } from "../services/notificationService.js";
import { db } from "../server.js";

/**
 * Send FCM notification to a user
 * POST /api/notifications/send
 */
export const sendUserNotification = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use existing sendNotification service
    await sendNotification(userId, title, body, data || {});

    res.json({ success: true });
  } catch (error) {
    console.error("❌ [User Notification API] Error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send FCM notification to a vendor
 * POST /api/notifications/send-vendor
 */
export const sendVendorNotification = async (req, res) => {
  try {
    const { vendorId, title, body, data } = req.body;

    if (!vendorId || !title || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch vendor's FCM token
    const vendorDoc = await db.collection("vendors").doc(vendorId).get();
    if (!vendorDoc.exists()) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const vendorData = vendorDoc.data();
    const fcmToken = vendorData.fcmToken;

    if (!fcmToken) {
      return res.status(400).json({ error: "No FCM token for vendor" });
    }

    // Build and send FCM message
    const { messaging } = await import("../server.js");
    const message = {
      notification: { title, body },
      data: data || {},
      token: fcmToken,
    };

    await messaging.send(message);
    console.log(`🔔 [Vendor Notification] Sent to ${vendorId}: "${title}"`);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ [Vendor Notification API] Error:", error);

    // Handle invalid token
    if (error.code === "messaging/registration-token-not-registered") {
      const { FieldValue } = await import("../server.js");
      await db.collection("vendors").doc(req.body.vendorId).update({
        fcmToken: FieldValue.delete(),
      });
    }

    res.status(500).json({ error: error.message });
  }
};
