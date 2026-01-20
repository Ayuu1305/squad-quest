import { getAuth } from "firebase-admin/auth";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // DEBUG: Log incoming request info
  console.log("\n🔐 Auth Middleware Debug:");
  console.log("   Path:", req.path);
  console.log(
    "   Auth Header:",
    authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : "MISSING",
  );

  // 1. Check if header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("   ❌ REJECTED: No valid Bearer token");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  // 2. Extract the token
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify using firebase-admin directly
    // ✅ This fixes the error because we don't need server.js anymore
    const decodedToken = await getAuth().verifyIdToken(token);

    // 4. Attach user info to request so controllers can use it
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res
      .status(403)
      .json({ error: "Unauthorized: Invalid or expired token" });
  }
};
