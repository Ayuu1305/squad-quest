import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";

const SwipeWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 1. Define the Tab Order (Left to Right)
  // This matches your Bottom Navbar order exactly.
  const tabs = [
    "/board",       // 1. Quests (Home)
    "/journey",     // 2. Journey
    "/leaderboard", // 3. Heroes
    "/shop",        // 4. Shop
    "/my-missions", // 5. Missions
    "/profile"      // 6. Profile
  ];

  // ✅ Pages that have their OWN internal swipes (Block Global Swipe here)
  const locallySwipeablePages = ["/my-missions", "/profile"];

  const handleSwipe = (direction) => {
    // 🛑 If we are on a page with local tabs, DO NOT switch pages globally
    if (locallySwipeablePages.includes(location.pathname)) return;

    const currentIndex = tabs.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (direction === "LEFT" && currentIndex < tabs.length - 1) {
      navigate(tabs[currentIndex + 1]);
    } else if (direction === "RIGHT" && currentIndex > 0) {
      navigate(tabs[currentIndex - 1]);
    }
  };

  // ✅ 3. Configure Swipe Handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("LEFT"),
    onSwipedRight: () => handleSwipe("RIGHT"),
    preventScrollOnSwipe: false, // Important: Allows scrolling down!
    trackMouse: false,           // Set to true if you want to test with mouse on PC
    delta: 50,                   // Minimum swipe distance (px) to trigger
  });

  return (
    // This div catches the swipe gestures
    <div {...handlers} className="min-h-screen">
      {children}
    </div>
  );
};

export default SwipeWrapper;