import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Landing from "./pages/Landing";
import QuestBoard from "./pages/QuestBoard";
import QuestDetails from "./pages/QuestDetails";
import Lobby from "./pages/Lobby";
import Verification from "./pages/Verification";
import Profile from "./pages/Profile";
import Review from "./pages/Review";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateQuest from "./pages/CreateQuest";
import Leaderboard from "./pages/Leaderboard";
import MyMissions from "./pages/MyMissions";
import WorldGuide from "./pages/WorldGuide";
import HeroJourney from "./pages/HeroJourney";
import ShopPage from "./pages/ShopPage";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Navbar from "./components/Navbar";
import { Toaster, toast } from "react-hot-toast"; // Added toast
import { useGame } from "./context/GameContext";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react"; // Added useEffect
import { messaging, db } from "./backend/firebaseConfig"; // Added Messaging & DB
import { getToken, onMessage } from "firebase/messaging"; // Added FCM functions
import { doc, updateDoc } from "firebase/firestore"; // Added Firestore functions
import MaintenanceBanner from "./components/MaintenanceBanner"; // ✅ Quota exhaustion banner
import RewardModal from "./components/RewardModal"; // ✅ Reward Popup
import RewardListener from "./components/RewardListener"; // ✅ Reward Watcher
import SwipeWrapper from "./components/SwipeWrapper"; // ✅ Swipe Wrapper

// Protects routes that require both login AND city selection
// Protects routes that require both login AND city selection
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { city, gameLoading } = useGame();

  if (loading || gameLoading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/" />;
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

import LandingPage from "./pages/LandingPage"; // Import LandingPage

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

import GenderSelectionModal from "./components/GenderSelectionModal";

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Show navbar only on main hub pages when logged in
  const showNavbar =
    [
      "/board",
      "/profile",
      "/leaderboard",
      "/my-missions",
      "/world-guide",
      "/journey",
      "/shop",
    ].includes(location.pathname) && user;

  // ✅ FCM Token Management
  useEffect(() => {
    const setupNotifications = async () => {
      if (!user || !messaging) return;

      try {
        console.log("🔔 [FCM] Requesting notification permission...");
        const permission = await Notification.requestPermission();
        console.log("🔔 [FCM] Permission result:", permission);

        if (permission === "granted") {
          console.log("🔔 [FCM] Generating token...");
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, // User must provide this
          });

          if (currentToken) {
            console.log(
              "✅ [FCM] Token generated:",
              currentToken.substring(0, 20) + "...",
            );
            if (user?.fcmToken !== currentToken) {
              // Save token to user profile ONLY if different
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, { fcmToken: currentToken });
              console.log(
                "✅ [FCM] Token updated in Firestore for user:",
                user.uid,
              );
            } else {
              console.log("✅ [FCM] Token already up-to-date.");
            }
          } else {
            console.warn("⚠️ [FCM] No token received");
          }
        }
      } catch (err) {
        console.error("❌ [FCM] Permission/token error:", err);
      }
    };

    setupNotifications();
  }, [user]);

  // ✅ Foreground Message Listener
  useEffect(() => {
    if (!messaging) return;

    console.log("🔔 [FCM] Foreground listener initialized");
    const unsubscribe = onMessage(messaging, (payload) => {
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

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-dark-bg min-h-screen text-white font-['Inter'] selection:bg-neon-purple selection:text-white">
      {/* ✅ QUOTA EXHAUSTION WARNING - Shows on ALL pages */}
      <MaintenanceBanner />

      {user && !loading && user.emailVerified && !user.gender && (
        <GenderSelectionModal />
      )}

      <SwipeWrapper>
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <QuestBoard />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quest/:id"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <QuestDetails />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-quest"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                  >
                    <CreateQuest />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/lobby/:id"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                  >
                    <Lobby />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/verify/:id"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                  >
                    <Verification />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/review/:id"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Review />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-missions"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                  >
                    <MyMissions />
                  </motion.div>
                </ProtectedRoute>
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
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                  >
                    <ShopPage />
                  </motion.div>
                </ProtectedRoute>
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

            <Route
              path="/secret-admin"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                  >
                    <AdminDashboard />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
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
