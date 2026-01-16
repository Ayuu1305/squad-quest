import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import admin from "firebase-admin"; // Default import
import { readFileSync } from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Setup
let serviceAccount;
try {
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";
  const serviceAccountData = JSON.parse(
    readFileSync(serviceAccountPath, "utf8")
  );

  initializeApp({
    credential: cert(serviceAccountData),
  });
  console.log("Firebase Admin Initialized with Service Account");
} catch (error) {
  console.log("Trying default application credentials...");
  try {
    initializeApp();
    console.log("Firebase Admin Initialized with Default Credentials");
  } catch (e) {
    console.error("Failed to initialize Firebase Admin:", e);
  }
}

export const db = getFirestore();
export const auth = getAuth();
export { admin }; // Export admin for legacy/namespace access in controllers

// Import Routes
import { verifyToken } from "./middleware/auth.js";
import {
  finalizeQuest,
  submitVibeCheck,
} from "./controllers/questController.js";
import { claimBounty } from "./controllers/bountyController.js";
import { getWeeklyLeaderboard } from "./controllers/leaderboardController.js";

// API Routes
app.post("/api/quest/finalize", verifyToken, finalizeQuest);
app.post("/api/quest/vibe-check", verifyToken, submitVibeCheck);
app.post("/api/bounty/claim", verifyToken, claimBounty);
app.get("/api/leaderboard/weekly", verifyToken, getWeeklyLeaderboard);

app.get("/", (req, res) => {
  res.send("Squad Quest Backend is Running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
