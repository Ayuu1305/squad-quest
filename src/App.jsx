import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar";
import { Toaster, toast } from "react-hot-toast"; // Added toast
import { useGame } from "./context/GameContext";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react"; // Added useEffect
import { loadFirebase } from "./backend/firebase.lazy"; // ✅ Lazy load Firebase
import MaintenanceBanner from "./components/MaintenanceBanner"; // ✅ Quota exhaustion banner
import RewardModal from "./components/RewardModal"; // ✅ Reward Popup
import RewardListener from "./components/RewardListener"; // ✅ Reward Watcher
import SwipeWrapper from "./components/SwipeWrapper"; // ✅ Swipe Wrapper
import OnboardingModal from "./components/OnboardingModal"; // ✅ New User Onboarding
import ViolationWarningModal from "./components/ViolationWarningModal"; // ✅ Gender Mismatch Warnings
import BanScreen from "./components/BanScreen"; // ✅ Ban Enforcement
import { isBanned } from "./utils/banCheck"; // ✅ Ban status checker
import QuestBoardSkeleton from "./components/skeletons/QuestBoardSkeleton"; // ✅ Skeleton Loading
import AdminRoute from "./components/AdminRoute"; // ✅ Admin access control
import GenderSelectionModal from "./components/GenderSelectionModal";
import ProtectedVendorRoute from "./components/ProtectedVendorRoute";
import LandingPage from "./pages/LandingPage"; // Import LandingPage

const QuestBoard = lazy(() => import("./pages/QuestBoard"));
const QuestDetails = lazy(() => import("./pages/QuestDetails"));
const Lobby = lazy(() => import("./pages/Lobby"));
const Verification = lazy(() => import("./pages/Verification"));
const Profile = lazy(() => import("./pages/Profile"));
const Review = lazy(() => import("./pages/Review"));
const CreateQuest = lazy(() => import("./pages/CreateQuest"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const MyMissions = lazy(() => import("./pages/MyMissions"));
const WorldGuide = lazy(() => import("./pages/WorldGuide"));
const HeroJourney = lazy(() => import("./pages/HeroJourney"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminCompetition = lazy(() => import("./pages/admin/AdminCompetition")); // ✅ Admin competition management
const ManageHubs = lazy(() => import("./pages/admin/ManageHubs")); // ✅ Hub Management
const Settings = lazy(() => import("./pages/Settings"));
const CompetitionDetails = lazy(() => import("./pages/CompetitionDetails"));

// Vendor Pages
const VendorLogin = lazy(() => import("./pages/vendor/VendorLogin"));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const HubSignup = lazy(() => import("./pages/vendor/HubSignup"));

// Protects routes that require both login AND city selection
// Protects routes that require both login AND city selection
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { city, gameLoading } = useGame();

  if (loading || gameLoading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/" />;

  // ✅ Block ONLY permanent bans from accessing routes
  const banStatus = isBanned(user);
  if (banStatus.banned && banStatus.type === "permanent") {
    // Permanent bans fully blocked (BanScreen shows via App.jsx)
    return null;
  }

  // ✅ Temporary bans CAN access pages (but features will be disabled)

  if (!city) return <Navigate to="/city-select" />;

  return children;
};

// 🚫 NEW: Blocks BOTH temporary AND permanent bans from specific routes
const BanRestrictedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { city, gameLoading } = useGame();

  if (loading || gameLoading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/" />;

  // 🚫 Block ALL banned users (temporary + permanent)
  const banStatus = isBanned(user);
  if (banStatus.banned) {
    // Redirect banned users to QuestBoard (they can view but not access shop/create)
    return <Navigate to="/board" />;
  }

  if (!city) return <Navigate to="/city-select" />;

  return children;
};

// Protects routes that require ONLY login
// Protects routes that require ONLY login
const UserProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { gameLoading } = useGame();

  if (loading || gameLoading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/" />;

  return children;
};

// Protects the city selection (Landing) - requires login but NO city yet
// Protects the city selection (Landing) - requires login but NO city yet
const CitySelectionRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { city, gameLoading } = useGame();

  if (loading || gameLoading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/login" />;
  if (city) return <Navigate to="/board" />;

  return children;
};

// Updated AuthRoute to handle City Selection flow
// Updated AuthRoute to handle City Selection flow
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { city, gameLoading } = useGame(); // Need city context here

  if (loading || gameLoading) return null;

  if (user && user.emailVerified) {
    // If they have a city, go to game. If not, go to selection.
    return city ? <Navigate to="/board" /> : <Navigate to="/city-select" />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Show navbar only on main hub pages when logged in (NOT on vendor pages)
  const showNavbar =
    [
      "/board",
      "/profile",
      "/leaderboard",
      "/my-missions",
      "/world-guide",
      "/journey",
      "/shop",
    ].includes(location.pathname) &&
    user &&
    !location.pathname.startsWith("/vendor") &&
    !location.pathname.startsWith("/hub");

  // ✅ Check if user is banned
  const banStatus = user ? isBanned(user) : { banned: false };

  // ✅ Handle logout for banned users
  const handleBannedUserLogout = async () => {
    try {
      const { auth } = await loadFirebase();
      await auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  // ... inside your App component ...

  useEffect(() => {
    // Global Error Handler for "Missing Chunks"
    const handleChunkError = (event) => {
      if (
        event?.message &&
        /Failed to fetch dynamically imported module/.test(event.message)
      ) {
        console.warn("New version detected. Reloading...");
        window.location.reload();
      }
    };

    window.addEventListener("error", handleChunkError);
    return () => window.removeEventListener("error", handleChunkError);
  }, []);

  // ✅ FCM Token Management (FIXED)
  useEffect(() => {
    const setupNotifications = async () => {
      // 1. Guard Clause: Need user
      if (!user?.uid) return;

      try {
        const { messaging, db, doc, updateDoc, getToken } =
          await loadFirebase();
        if (!messaging) return;

        // 2. Check Permission (Silent check first)
        if (Notification.permission !== "granted") {
          // Optional: Request permission only if you want to annoy them immediately
          // Otherwise, wait for a user action (better UX)
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;
        }

        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
          // 🛑 CRITICAL CHECK: compare with the value in memory to prevent loop
          if (user.fcmToken !== currentToken) {
            console.log("🔔 [FCM] Saving new token to Firestore...");
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { fcmToken: currentToken });
            console.log("✅ [FCM] Token updated.");
          } else {
            // Debug log only (optional)
            // console.log("✅ [FCM] Token already matches.");
          }
        }
      } catch (err) {
        console.error("❌ [FCM] Error:", err);
      }
    };

    setupNotifications();
    // 🛑 THE FIX: Watch 'user.uid', NOT the entire 'user' object
  }, [user?.uid]);

  // ✅ Foreground Message Listener
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe = () => {};

    loadFirebase().then(({ messaging, onMessage }) => {
      if (!messaging) return;

      console.log("🔔 [FCM] Foreground listener initialized");
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("🔔 [FCM] Foreground message received!", payload);
        toast(payload.notification.body, {
          icon: "📣",
          style: {
            background: "#0f0f23",
            color: "#ffffff",
            border: "1px solid #a855f7",
          },
          duration: 5000,
        });
      });
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ✅ Handle Violation Acknowledgment
  const handleAcknowledgeViolation = async (violation, violationIndex) => {
    try {
      console.log("🔍 [Acknowledge] Starting...", {
        violation,
        violationIndex,
      });

      const { acknowledgeViolation } =
        await import("./backend/services/user.service");

      // Helper to normalize timestamps for comparison
      const getTimestampValue = (ts) => {
        if (!ts) return null;
        if (ts.seconds) return ts.seconds; // Firestore Timestamp {seconds, nanoseconds}
        if (ts.toDate) return Math.floor(ts.toDate().getTime() / 1000); // Timestamp object
        return Math.floor(new Date(ts).getTime() / 1000); // ISO string or Date
      };

      // Find violation by comparing normalized timestamp values AND strike number
      const targetTime = getTimestampValue(violation.timestamp);
      const actualIndex = user.violations.findIndex((v) => {
        const vTime = getTimestampValue(v.timestamp);
        return vTime === targetTime && v.strike === violation.strike;
      });

      console.log("🔍 [Acknowledge] Search result:", {
        targetTime,
        actualIndex,
      });

      if (actualIndex !== -1) {
        await acknowledgeViolation(actualIndex);
        console.log(
          `✅ Acknowledged strike ${violation.strike} at index ${actualIndex}`,
        );

        toast.success("Acknowledgment recorded", {
          icon: "✅",
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
          },
        });
      } else {
        console.error("❌ [Acknowledge] Violation not found in array!");
        toast.error("Could not find violation");
      }
    } catch (error) {
      console.error("❌ [Acknowledge] Error:", error);
      toast.error("Failed to acknowledge");
    }
  };

  // ✅ Filter unacknowledged violations BEFORE rendering modal
  const unacknowledgedViolations =
    user?.violations?.filter(
      (v) => v.acknowledged === false || v.acknowledged === undefined,
    ) || [];

  return (
    <div className="bg-dark-bg min-h-screen text-white font-['Inter'] selection:bg-neon-purple selection:text-white">
      {/* ✅ QUOTA EXHAUSTION WARNING - Shows on ALL pages */}
      <MaintenanceBanner />

      {/* ✅ BAN SCREEN - Shows ONLY for PERMANENT bans */}
      {user &&
        !loading &&
        banStatus.banned &&
        banStatus.type === "permanent" && (
          <BanScreen banInfo={banStatus} onLogout={handleBannedUserLogout} />
        )}

      {/* Only show modals and app content if user is NOT permanently banned */}
      {user && !loading && banStatus.type !== "permanent" && (
        <>
          {user.emailVerified && !user.gender && <GenderSelectionModal />}

          {user.emailVerified && !user.hasSeenOnboarding && <OnboardingModal />}

          {/* ✅ VIOLATION WARNING MODAL - Only show if there are unacknowledged violations */}
          {unacknowledgedViolations.length > 0 && (
            <ViolationWarningModal
              violations={unacknowledgedViolations}
              onAcknowledge={handleAcknowledgeViolation}
            />
          )}
        </>
      )}

      <SwipeWrapper>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-dark-bg">
              <div className="w-10 h-10 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <Login />
                  </AuthRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <AuthRoute>
                    <Signup />
                  </AuthRoute>
                }
              />

              {/* 1. PUBLIC LANDING PAGE (Root) */}
              <Route path="/" element={<LandingPage />} />

              {/* 2. CITY SELECTION (Moved from / to /city-select) */}
              <Route
                path="/city-select"
                element={
                  <CitySelectionRoute>
                    <Landing />
                  </CitySelectionRoute>
                }
              />

              <Route
                path="/board"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<QuestBoardSkeleton />}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <QuestBoard />
                      </motion.div>
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/quest/:id"
                element={
                  <BanRestrictedRoute>
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                    >
                      <QuestDetails />
                    </motion.div>
                  </BanRestrictedRoute>
                }
              />

              <Route
                path="/create-quest"
                element={
                  <BanRestrictedRoute>
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                    >
                      <CreateQuest />
                    </motion.div>
                  </BanRestrictedRoute>
                }
              />

              <Route
                path="/lobby/:id"
                element={
                  <BanRestrictedRoute>
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                    >
                      <Lobby />
                    </motion.div>
                  </BanRestrictedRoute>
                }
              />

              <Route
                path="/verify/:id"
                element={
                  <BanRestrictedRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                    >
                      <Verification />
                    </motion.div>
                  </BanRestrictedRoute>
                }
              />

              <Route
                path="/review/:id"
                element={
                  <BanRestrictedRoute>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Review />
                    </motion.div>
                  </BanRestrictedRoute>
                }
              />

              <Route
                path="/my-missions"
                element={
                  <BanRestrictedRoute>
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                    >
                      <MyMissions />
                    </motion.div>
                  </BanRestrictedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <UserProtectedRoute>
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                    >
                      <Profile />
                    </motion.div>
                  </UserProtectedRoute>
                }
              />

              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Leaderboard />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/competition/:id"
                element={
                  <ProtectedRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <CompetitionDetails />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/journey"
                element={
                  <ProtectedRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                    >
                      <HeroJourney />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/world-guide"
                element={
                  <ProtectedRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                    >
                      <WorldGuide />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/shop"
                element={
                  <BanRestrictedRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                    >
                      <ShopPage />
                    </motion.div>
                  </BanRestrictedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <UserProtectedRoute>
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                    >
                      <Settings />
                    </motion.div>
                  </UserProtectedRoute>
                }
              />

              {/* Vendor Routes */}
              <Route
                path="/vendor/login"
                element={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <VendorLogin />
                  </motion.div>
                }
              />

              <Route
                path="/vendor/dashboard"
                element={
                  <ProtectedVendorRoute>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <VendorDashboard />
                    </motion.div>
                  </ProtectedVendorRoute>
                }
              />

              {/* Vendor Hub Signup - Admin Only */}
              <Route
                path="/hub/signup"
                element={
                  <AdminRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <HubSignup />
                    </motion.div>
                  </AdminRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/secret-admin"
                element={
                  <AdminRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                    >
                      <AdminDashboard />
                    </motion.div>
                  </AdminRoute>
                }
              />

              {/* ✨ NEW: Hub Management Dashboard */}
              <Route
                path="/admin/manage-hubs"
                element={
                  <AdminRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                    >
                      <ManageHubs />
                    </motion.div>
                  </AdminRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                    >
                      <AdminCompetition />
                    </motion.div>
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </SwipeWrapper>

      {showNavbar && <Navbar />}
      <Toaster position="top-center" reverseOrder={false} />

      {/* ✅ REWARD SYSTEM - Global Components */}
      <RewardModal />
      <RewardListener />
    </div>
  );
}

export default App;
