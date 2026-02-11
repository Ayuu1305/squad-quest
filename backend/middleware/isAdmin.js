import { db } from "../server.js";

/**
 * Admin verification middleware
 * Checks if the authenticated user has admin privileges
 * Must be used AFTER verifyToken middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Get user document to check admin status
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      console.log(
        `⛔ Admin check failed: User ${req.user.uid} not found in database`,
      );
      return res.status(404).json({
        error: "User not found",
      });
    }

    const userData = userDoc.data();

    // Check if user has admin flag
    if (userData.isAdmin !== true) {
      console.log(`⛔ Admin access denied for user: ${req.user.uid}`);
      return res.status(403).json({
        error: "Forbidden: Admin privileges required",
      });
    }

    // User is admin, allow access
    console.log(`✅ Admin access granted: ${req.user.uid}`);
    next();
  } catch (error) {
    console.error("❌ Admin verification error:", error);
    return res.status(500).json({
      error: "Server error during admin verification",
    });
  }
};
