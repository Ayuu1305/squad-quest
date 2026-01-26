import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";

const SwipeWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Define your Tab Order
  const tabs = [
    "/board",
    "/journey",
    "/leaderboard",
    "/shop",
    "/my-missions",
    "/profile",
  ];

  // 2. Block swipes on specific pages (Maps, Horizontal Scroll Lists, etc.)
  const locallySwipeablePages = ["/my-missions", "/profile"];

  const handleSwipe = (direction) => {
    // If we are on a blocked page, do nothing
    if (locallySwipeablePages.includes(location.pathname)) return;

    const currentIndex = tabs.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (direction === "LEFT" && currentIndex < tabs.length - 1) {
      navigate(tabs[currentIndex + 1]);
    } else if (direction === "RIGHT" && currentIndex > 0) {
      navigate(tabs[currentIndex - 1]);
    }
  };

  // ✅ 3. The "Professional" Configuration
  const handlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("LEFT"),
    onSwipedRight: () => handleSwipe("RIGHT"),
    
    // 🔥 CORE OPTIMIZATION:
    preventScrollOnSwipe: false, // Allows scrolling down while touching
    trackMouse: false,           // Ignore mouse on desktop (focus on touch)
    trackTouch: true,            // Force touch tracking
    delta: 75,                   // 75px is the "Goldilocks" zone (not too sensitive, not too hard)
    swipeDuration: 500,          // Allow 500ms for the swipe (supports relaxed flicks)
    rotationAngle: 0,            // Ignore rotation
  });

  return (
    // ✅ 4. The Magic CSS Style
    // 'touch-action: pan-y' tells the browser: 
    // "Let the user scroll Up/Down, but capture Left/Right for the app."
    <div 
      {...handlers} 
      className="min-h-screen"
      style={{ touchAction: "pan-y" }} 
    >
      {children}
    </div>
  );
};

export default SwipeWrapper;