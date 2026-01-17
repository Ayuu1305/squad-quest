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
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import { useGame } from "./context/GameContext";
import { useAuth } from "./context/AuthContext";

// Protects routes that require both login AND city selection
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { city } = useGame();

  if (loading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/login" />;
  if (!city) return <Navigate to="/" />;

  return children;
};

// Protects routes that require ONLY login
const UserProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/login" />;

  return children;
};

// Protects the city selection (Landing) - requires login but NO city yet
const CitySelectionRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { city } = useGame();

  if (loading) return null;
  // ✅ Check for existence AND verification
  if (!user || !user.emailVerified) return <Navigate to="/login" />;
  if (city) return <Navigate to="/board" />;

  return children;
};

// Redirects logged-in verified users away from Auth pages
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  // ✅ Only redirect if verified
  return user && user.emailVerified ? <Navigate to="/board" /> : children;
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
    ].includes(location.pathname) && user;

  return (
    <div className="bg-dark-bg min-h-screen text-white font-['Inter'] selection:bg-neon-purple selection:text-white">
      {user && !loading && user.emailVerified && !user.gender && (
        <GenderSelectionModal />
      )}

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

          {/* Protected Main Flow */}
          <Route
            path="/"
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>

      {showNavbar && <Navbar />}
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}

export default App;
