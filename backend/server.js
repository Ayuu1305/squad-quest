import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

// Load environment variables FIRST
dotenv.config();

// ----------------------------------------------------
// 🔥 FIREBASE ADMIN SDK SETUP (Hybrid-Proof)
// ----------------------------------------------------

let serviceAccount;

try {
  console.log("🔍 Attempting to load Firebase Service Account...");

  // Priority 1: Cloud (Render/Vercel) - Environment Variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("☁️  Found FIREBASE_SERVICE_ACCOUNT env var (Cloud Mode)");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("✅ Parsed Service Account from Environment Variable");
  }
  // Priority 2: Local Development - Read from file
  else {
    console.log("💻 No env var found. Attempting local file read...");
    const rawData = fs.readFileSync("./serviceAccountKey.json", "utf8");
    serviceAccount = JSON.parse(rawData);
    console.log("✅ Loaded Service Account from file");
    console.log("   Project ID:", serviceAccount.project_id);
  }
} catch (error) {
  console.error("\n❌ CRITICAL FIREBASE ERROR ❌");
  console.error("Could not load Firebase Service Account.");
  console.error("Error:", error.message);
  console.error("\n👉 TIPS:");
  console.error(
    "   - Local: Ensure 'serviceAccountKey.json' is in the 'backend' folder",
  );
  console.error(
    "   - Cloud: Set FIREBASE_SERVICE_ACCOUNT env var with full JSON content\n",
  );
  process.exit(1);
}

// Initialize Firebase Admin
const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

// Export Firebase services
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const messaging = getMessaging(firebaseApp);
export { FieldValue };

console.log("✅ Firebase Admin SDK Initialized Successfully!");

// ----------------------------------------------------
// 🚀 EXPRESS SERVER SETUP
// ----------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------------------------------------
// 🌐 CORS CONFIGURATION (Hybrid-Proof)
// ----------------------------------------------------

const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:3000", // CRA default
  "http://127.0.0.1:5173",
  "https://squad-quest-ca9f2.web.app", // Firebase Hosting
  "https://squad-quest-ca9f2.firebaseapp.com",
  "https://squad-quest.onrender.com", // Render
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("⚠️ CORS blocked origin:", origin);
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  }),
);

// ----------------------------------------------------
// 🛡️ SECURITY MIDDLEWARE
// ----------------------------------------------------

import { sanitizeInput, requestSizeLimiter } from "./middleware/sanitize.js";
import {
  globalLimiter,
  bountyLimiter,
  vibeLimiter,
  questActionLimiter,
  chatLimiter,
} from "./middleware/rateLimiter.js";
import { validate } from "./middleware/validation.js";

// 1. Request size limiting (prevent memory attacks)
app.use(requestSizeLimiter(100)); // Max 100KB payload

// 2. Parse JSON bodies
app.use(express.json());

// 3. Sanitize all inputs (XSS protection)
app.use(sanitizeInput);

// 4. Global rate limiting
app.use("/api", globalLimiter);

// Health check endpoint
app.use("/ping", (req, res) => {
  res.status(200).send("pong");
});

// ----------------------------------------------------
// 📥 CONTROLLER IMPORTS
// ----------------------------------------------------

import {
  joinQuest,
  leaveQuest,
  finalizeQuest,
  submitVibeCheck,
} from "./controllers/questController.js";

import {
  deleteQuest,
  editQuest,
} from "./controllers/questManagementController.js";

import { getWeeklyLeaderboard } from "./controllers/leaderboardController.js";
import { claimBounty } from "./controllers/bountyController.js";
import {
  buyItem,
  seedCoupons,
  getUserRedemptions,
} from "./controllers/shopController.js";
import { syncStreak } from "./controllers/streakController.js";
import {
  updateAvatar,
  acknowledgeViolation,
} from "./controllers/userController.js"; // ✅ Added acknowledgeViolation
import { verifyToken } from "./middleware/auth.js";
import { requireAdmin } from "./middleware/isAdmin.js";
import { initArchiver } from "./jobs/questArchiver.js";
import { initCronJobs } from "./services/cronService.js"; // ✅ Weekly Reset Scheduler
import {
  fixLifetimeXP,
  syncInventoryBadges,
  syncPublicAvatars,
} from "./controllers/migrationController.js";
import { adminForceReset } from "./controllers/weeklyResetController.js"; // ✅ Admin Reset

// ----------------------------------------------------
// 🛣️ API ROUTES
// ----------------------------------------------------

// Root endpoint
app.get("/", (req, res) => {
  res.send("Squad Quest API is Online 🚀");
});

// 💰 Daily Bounty Route (with rate limiting + validation)
app.post("/api/bounty/claim", verifyToken, bountyLimiter, claimBounty);

// 🛒 Shop Routes
app.post("/api/shop/buy", verifyToken, buyItem);
app.post("/api/shop/seed-coupons", verifyToken, seedCoupons); // Admin only
app.get("/api/shop/redemptions", verifyToken, getUserRedemptions);

// 🔧 Migration Routes

app.post(
  "/api/admin/fix-lifetime-xp",
  verifyToken,
  requireAdmin,
  fixLifetimeXP,
); // Admin only
app.post(
  "/api/admin/sync-inventory-badges",
  verifyToken,
  requireAdmin,
  syncInventoryBadges,
); // Admin only
app.post(
  "/api/admin/sync-public-avatars",
  verifyToken,
  requireAdmin,
  syncPublicAvatars,
); // Admin only
app.post("/api/admin/reset-weekly-xp", adminForceReset); // ✅ Manual Reset (Secret protected)

// 🔥 Streak Management
app.post("/api/user/sync-streak", verifyToken, syncStreak);

// 👤 User Management (with validation)
app.post(
  "/api/user/avatar",
  verifyToken,
  validate("avatarConfig"),
  updateAvatar,
);

// 🚨 Violation Management
app.post("/api/user/acknowledge-violation", verifyToken, acknowledgeViolation);

// 📊 Leaderboard Routes
app.get("/api/leaderboard/weekly", getWeeklyLeaderboard);

// ⚔️ Quest Routes (with validation + rate limiting)
app.post(
  "/api/quest/join",
  verifyToken,
  questActionLimiter,
  validate("joinQuest"),
  joinQuest,
);
app.post(
  "/api/quest/leave",
  verifyToken,
  questActionLimiter,
  validate("leaveQuest"),
  leaveQuest,
);
app.post(
  "/api/quest/finalize",
  verifyToken,
  validate("finalizeQuest"),
  finalizeQuest,
);
app.post(
  "/api/quest/vibe-check",
  verifyToken,
  vibeLimiter,
  validate("submitVibeCheck"),
  submitVibeCheck,
);

// 📝 Quest Management Routes (Edit/Delete)
app.delete("/api/quest/:questId", verifyToken, deleteQuest);
app.put("/api/quest/:questId", verifyToken, editQuest);

// ----------------------------------------------------
// 🚀 START SERVER
// ----------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n🚀 Squad Quest API Server`);
  console.log(`   Port: ${PORT}`);
  console.log(
    `   Mode: ${process.env.FIREBASE_SERVICE_ACCOUNT ? "CLOUD" : "LOCAL"}`,
  );
  console.log(`   Status: READY\n`);

  // Initialize scheduled jobs
  initArchiver(db); // ✅ Quest archiver (daily 3 AM)
  initCronJobs(); // ✅ Weekly XP reset (Monday 00:00 IST)
});
