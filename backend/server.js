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

// ✅ Firebase Admin Init (Production - Render)
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error(
      "❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required",
    );
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

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
} from "./controllers/questController.js";
import { claimBounty } from "./controllers/bountyController.js";
import { getWeeklyLeaderboard } from "./controllers/leaderboardController.js";
import {
  deleteQuest,
  editQuest,
  leaveQuest,
} from "./controllers/questManagementController.js";

// Routes
app.post("/api/quest/finalize", verifyToken, finalizeQuest);
app.post("/api/quest/vibe-check", verifyToken, submitVibeCheck);
app.post("/api/bounty/claim", verifyToken, claimBounty);
app.get("/api/leaderboard/weekly", verifyToken, getWeeklyLeaderboard);

// ✅ NEW: Quest Management Routes
app.delete("/api/quest/:questId", verifyToken, deleteQuest);
app.put("/api/quest/:questId", verifyToken, editQuest);
app.post("/api/quest/:questId/leave", verifyToken, leaveQuest);

app.get("/", (req, res) => {
  res.send("Squad Quest Backend is Running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
