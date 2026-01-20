import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
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

app.use(express.json());

// Health check endpoint
app.use("/ping", (req, res) => {
  res.status(200).send("pong");
});

// ----------------------------------------------------
// 🛡️ RATE LIMITING
// ----------------------------------------------------

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(globalLimiter);

const actionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "You are doing that too fast! Please slow down." },
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
import { verifyToken } from "./middleware/auth.js";

// ----------------------------------------------------
// 🛣️ API ROUTES
// ----------------------------------------------------

// Root endpoint
app.get("/", (req, res) => {
  res.send("Squad Quest API is Online 🚀");
});

// 💰 Daily Bounty Route
app.post("/api/bounty/claim", verifyToken, claimBounty);

// 📊 Leaderboard Routes
app.get("/api/leaderboard/weekly", getWeeklyLeaderboard);

// ⚔️ Quest Routes
app.post("/api/quest/join", verifyToken, actionLimiter, joinQuest);
app.post("/api/quest/leave", verifyToken, actionLimiter, leaveQuest);
app.post("/api/quest/finalize", verifyToken, finalizeQuest);
app.post("/api/quest/vibe-check", verifyToken, submitVibeCheck);

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
});
