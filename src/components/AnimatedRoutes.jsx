import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import PageTransition, { ROUTE_ORDER } from "./PageTransition";

// Import your page components
import Landing from "../pages/Landing";
import QuestBoard from "../pages/QuestBoard";
import Leaderboard from "../pages/Leaderboard";
import Shop from "../pages/Shop";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import CreateQuest from "../pages/CreateQuest";
import Lobby from "../pages/Lobby";
import Verification from "../pages/Verification";
import Review from "../pages/Review";
import HeroJourney from "../pages/HeroJourney";
import Login from "../pages/Login";
import Signup from "../pages/Signup";

/**
 * AnimatedRoutes - Manages page transitions with swipe animations
 *
 * Features:
 * - Detects swipe direction based on route order
 * - Wraps main navigable pages with PageTransition
 * - Preserves non-swipeable pages (login, modals, etc.)
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  const [direction, setDirection] = useState(0);
  const [prevLocation, setPrevLocation] = useState(location.pathname);

  useEffect(() => {
    const prevIndex = ROUTE_ORDER.findIndex((route) =>
      prevLocation.startsWith(route),
    );
    const currentIndex = ROUTE_ORDER.findIndex((route) =>
      location.pathname.startsWith(route),
    );

    if (prevIndex !== -1 && currentIndex !== -1) {
      setDirection(currentIndex > prevIndex ? 1 : -1);
    } else {
      setDirection(0);
    }

    setPrevLocation(location.pathname);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <Routes location={location} key={location.pathname}>
        {/* Swipeable Main Pages */}
        <Route
          path="/city-select"
          element={
            <PageTransition direction={direction}>
              <Landing />
            </PageTransition>
          }
        />
        <Route
          path="/board"
          element={
            <PageTransition direction={direction}>
              <QuestBoard />
            </PageTransition>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PageTransition direction={direction}>
              <Leaderboard />
            </PageTransition>
          }
        />
        <Route
          path="/shop"
          element={
            <PageTransition direction={direction}>
              <Shop />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition direction={direction}>
              <Profile />
            </PageTransition>
          }
        />

        {/* Non-Swipeable Pages (No PageTransition wrapper) */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create-quest" element={<CreateQuest />} />
        <Route path="/lobby/:questId" element={<Lobby />} />
        <Route path="/verify/:questId" element={<Verification />} />
        <Route path="/review/:questId" element={<Review />} />
        <Route path="/journey" element={<HeroJourney />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
