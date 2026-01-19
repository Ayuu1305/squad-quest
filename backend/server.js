import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://squad-quest-ca9f2.web.app",
      "https://squad-quest-ca9f2.firebaseapp.com",
    ],
    credentials: true,
  }),
);

app.use(express.json());

// ✅ Firebase Admin Init (supports both local file and environment variable)
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!admin.apps.length) {
  let serviceAccount;
  const localKeyPath = join(__dirname, "serviceAccountKey.json");

  // Try local file first (for local development)
  if (existsSync(localKeyPath)) {
    serviceAccount = JSON.parse(readFileSync(localKeyPath, "utf8"));
    console.log("🔑 Using local serviceAccountKey.json file");
  }
  // Fall back to environment variable (for production/Render)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log("☁️ Using FIREBASE_SERVICE_ACCOUNT_KEY from environment");
  } else {
    throw new Error(
      "❌ No Firebase credentials found. Please add serviceAccountKey.json or set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized");
}

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };

// Import Routes
import { verifyToken } from "./middleware/auth.js";
import {
  finalizeQuest,
  submitVibeCheck,
  joinQuest,
} from "./controllers/questController.js";
import { claimBounty } from "./controllers/bountyController.js";
import { getWeeklyLeaderboard } from "./controllers/leaderboardController.js";
import {
  deleteQuest,
  editQuest,
  leaveQuest,
} from "./controllers/questManagementController.js";
import { adminForceReset } from "./controllers/weeklyResetController.js";
import { initCronJobs } from "./services/cronService.js";

// Routes
app.post("/api/quest/join", verifyToken, joinQuest);
app.post("/api/quest/finalize", verifyToken, finalizeQuest);
app.post("/api/quest/vibe-check", verifyToken, submitVibeCheck);
app.post("/api/bounty/claim", verifyToken, claimBounty);
app.get("/api/leaderboard/weekly", verifyToken, getWeeklyLeaderboard);

// ✅ NEW: Quest Management Routes
app.delete("/api/quest/:questId", verifyToken, deleteQuest);
app.put("/api/quest/:questId", verifyToken, editQuest);
app.post("/api/quest/:questId/leave", verifyToken, leaveQuest);

// ✅ NEW: Admin Routes (Protected by x-admin-secret header)
app.post("/api/admin/reset-weekly-xp", adminForceReset);

app.get("/", (req, res) => {
  res.send("Squad Quest Backend is Running ✅");
});

// Keep-Alive Endpoint
app.get("/ping", (req, res) => {
  res.status(200).send("Server is awake!");
});

// Initialize Cron Jobs
initCronJobs();
import setupDailyReminder from "./jobs/dailyReminder.js";
setupDailyReminder();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
