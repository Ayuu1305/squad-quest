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

    // Fetch vendor doc
    const vendorDoc = await db.collection("vendors").doc(vendorId).get();
    if (!vendorDoc.exists) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const vendorData = vendorDoc.data();

    // ✅ Support both single token (legacy) and multiple tokens (multi-device)
    const tokenSet = new Set();
    if (vendorData.fcmToken) tokenSet.add(vendorData.fcmToken);
    if (Array.isArray(vendorData.fcmTokens)) {
      vendorData.fcmTokens.forEach((t) => t && tokenSet.add(t));
    }
    const tokens = Array.from(tokenSet);

    if (tokens.length === 0) {
      return res.status(400).json({ error: "No FCM tokens for vendor" });
    }

    // Build and send FCM message to all devices
    const { messaging } = await import("../server.js");
    const multicastMessage = {
      notification: { title, body },
      data: data || {},
      tokens, // Send to all registered devices
    };

    const batchResponse =
      await messaging.sendEachForMulticast(multicastMessage);
    console.log(
      `🔔 [Vendor Notification] Sent to ${vendorId}: "${title}" — ${batchResponse.successCount}/${tokens.length} delivered`,
    );

    // 🧹 Clean up invalid/expired tokens
    const { FieldValue } = await import("../server.js");
    const invalidTokens = [];
    batchResponse.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error?.code === "messaging/registration-token-not-registered"
      ) {
        invalidTokens.push(tokens[idx]);
      }
    });

    if (invalidTokens.length > 0) {
      const updatedTokens = tokens.filter((t) => !invalidTokens.includes(t));
      await db
        .collection("vendors")
        .doc(vendorId)
        .update({
          fcmTokens: updatedTokens,
          fcmToken: updatedTokens[0] || FieldValue.delete(),
        });
      console.log(
        `🧹 [Vendor Notification] Pruned ${invalidTokens.length} invalid token(s)`,
      );
    }

    res.json({ success: true, delivered: batchResponse.successCount });
  } catch (error) {
    console.error("❌ [Vendor Notification API] Error:", error);
    res.status(500).json({ error: error.message });
  }
};
