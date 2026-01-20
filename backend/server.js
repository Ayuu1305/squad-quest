import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth"; // Added this for Auth

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use("/ping", (req, res) => {
  res.status(200).send("pong");
});

// ----------------------------------------------------
// 🔥 FIREBASE SETUP (The part that needs fixing)
// ----------------------------------------------------

let serviceAccount;

try {
  // Option 1: Running on Render (Production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("🔍 Checking Render Environment Variable...");
    // We try to parse the JSON string from the Environment Variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("✅ Successfully parsed Service Account from Env Var.");
  } 
  // Option 2: Running Locally (Development)
  else {
    console.log("⚠️ No Render Env Var found. Looking for local file...");
    // If you have a local file, you can uncomment this:
    // serviceAccount = await import('./serviceAccountKey.json', { assert: { type: "json" } });
  }

} catch (error) {
  console.error("❌ CRITICAL ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT.");
  console.error("Did you paste the WHOLE JSON content into the Render value?");
  console.error("Error details:", error.message);
}

// Initialize Firebase
// If serviceAccount is undefined, this will throw the "metadata.google.internal" error
const firebaseApp = initializeApp({
  credential: cert(serviceAccount) 
});

// Export DB and Admin
export const db = getFirestore(firebaseApp);
export const admin = firebaseApp;
// export const auth = getAuth(firebaseApp); // Export auth if needed

// ----------------------------------------------------
// 🛡️ SECURITY: RATE LIMITING
// ----------------------------------------------------

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests from this IP, please try again later."
});
app.use(globalLimiter);

const actionLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: { error: "You are doing that too fast! Please slow down." }
});

// ----------------------------------------------------
// 📥 IMPORTS
// ----------------------------------------------------
// Make sure these paths match your actual folders!
import { 
  joinQuest, 
  leaveQuest, 
  finalizeQuest, 
  submitVibeCheck 
} from "./controllers/questController.js";

import { verifyToken } from "./middleware/auth.js"; // Check this filename!

// ----------------------------------------------------
// 🛣️ ROUTES
// ----------------------------------------------------

app.get("/", (req, res) => {
  res.send("Squad Quest API is Online 🚀");
});

app.post("/api/quest/join", verifyToken, actionLimiter, joinQuest);
app.post("/api/quest/leave", verifyToken, actionLimiter, leaveQuest);
app.post("/api/quest/finalize", verifyToken, finalizeQuest);
app.post("/api/quest/vibe-check", verifyToken, submitVibeCheck);

// ----------------------------------------------------
// 🚀 START SERVER
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running securely on port ${PORT}`);
});