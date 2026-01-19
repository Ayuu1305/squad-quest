import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit"; // ✅ 1. Import the library
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true })); // Allow requests from your React Frontend
app.use(express.json());

// ----------------------------------------------------
// 🔥 FIREBASE SETUP
// ----------------------------------------------------
// (Assuming you use a service account key or default credentials)
// If you use a serviceAccountKey.json file, import it here:
// import serviceAccount from './serviceAccountKey.json' assert { type: "json" };

const firebaseApp = initializeApp({
  // credential: cert(serviceAccount) // Uncomment if using key file
  // If hosted on Render/Heroku/Google Cloud, it auto-detects credentials
});

// Export DB and Admin so controllers can use them
export const db = getFirestore(firebaseApp);
export const admin = firebaseApp;

// ----------------------------------------------------
// 🛡️ SECURITY: RATE LIMITING
// ----------------------------------------------------

// 1. General Limiter: Max 100 requests per 15 mins (Standard protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later."
});

// Apply global limiter to all routes
app.use(globalLimiter);

// 2. Strict Limiter: Max 10 requests per minute (For Join/Leave actions)
// This prevents someone from spam-clicking buttons or using bots
const actionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, 
  message: { error: "You are doing that too fast! Please slow down." }
});

// ----------------------------------------------------
// 📥 IMPORTS
// ----------------------------------------------------
// Import your controllers
import { 
  joinQuest, 
  leaveQuest, 
  finalizeQuest, 
  submitVibeCheck 
} from "./controllers/questController.js";

// Import your Auth Middleware
// (Ensure you have this file created as discussed previously)
import { verifyToken } from "./middleware/auth.js";

// ----------------------------------------------------
// 🛣️ ROUTES
// ----------------------------------------------------

// Health Check (To see if server is running)
app.get("/", (req, res) => {
  res.send("Squad Quest API is Online 🚀");
});

// ✅ QUEST ROUTES (Protected by Token & Rate Limit)

// Join Quest (Uses Strict Limiter)
app.post("/api/quest/join", verifyToken, actionLimiter, joinQuest);

// Leave Quest (Uses Strict Limiter)
app.post("/api/quest/leave", verifyToken, actionLimiter, leaveQuest);

// Finalize Quest / Claim Reward
app.post("/api/quest/finalize", verifyToken, finalizeQuest);

// Vibe Check / Peer Review
app.post("/api/quest/vibe-check", verifyToken, submitVibeCheck);

// ----------------------------------------------------
// 🚀 START SERVER
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running securely on port ${PORT}`);
});