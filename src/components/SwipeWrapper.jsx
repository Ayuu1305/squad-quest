import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";

const SwipeWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const x = useMotionValue(0);

  // 1. Define your Tab Order
  const tabs = [
    "/board",
    "/journey",
    "/leaderboard",
    "/shop",
    "/my-missions",
    "/profile",
  ];

  // 2. Block swipes on pages with internal horizontal scrolling/sections
  // These pages have their own internal swipe logic (tabs, carousels, etc.)
  const locallySwipeablePages = [
    "/my-missions", // Has 2 sections
    "/profile", // Has 3 sections
    "/leaderboard", // Has 3 sections (All-Time, Weekly, City)
    "/shop", // Has 2 sections (Categories)
  ];

  const handleDragEnd = (event, info) => {
    // If blocked page, do nothing
    if (locallySwipeablePages.includes(location.pathname)) return;

    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const currentIndex = tabs.indexOf(location.pathname);

    if (currentIndex === -1) return;

    // 🔥 INSTAGRAM-OPTIMIZED THRESHOLDS 🔥
    // Lower thresholds = More responsive (feels faster)
    const swipeThreshold = 80; // Reduced from 100px
    const swipeVelocity = 300; // Reduced from 500 (more sensitive to flicks)

    // SWIPE RIGHT (Go Backwards: Board <- Journey)
    if (offset > swipeThreshold || velocity > swipeVelocity) {
      if (currentIndex > 0) {
        navigate(tabs[currentIndex - 1]);
      }
    }
    // SWIPE LEFT (Go Forward: Board -> Journey)
    else if (offset < -swipeThreshold || velocity < -swipeVelocity) {
      if (currentIndex < tabs.length - 1) {
        navigate(tabs[currentIndex + 1]);
      }
    }
  };

  // Check if swipes are allowed on this page
  const isSwipeDisabled = locallySwipeablePages.includes(location.pathname);

  return (
    <motion.div
      className="min-h-screen w-full touch-pan-y"
      // 3. THE INSTAGRAM PHYSICS ENGINE
      drag={isSwipeDisabled ? false : "x"} // Only drag horizontally
      // Constraints=0 creates "Rubber Banding" (Resistance)
      // This makes it feel like you are "pulling" the page
      dragConstraints={{ left: 0, right: 0 }}
      // Elasticity: How "stretchy" the drag is.
      // 0.2 = Heavy/Premium feel (Like Instagram)
      // 0.8 = Loose/Bouncy feel
      dragElastic={0.15}
      // Momentum-based inertia (Instagram uses this!)
      dragMomentum={true}
      // Reduced friction = smoother glide
      dragTransition={{
        bounceStiffness: 600,
        bounceDamping: 20,
      }}
      // Handle the release
      onDragEnd={handleDragEnd}
      // Ensure vertical scrolling still works perfectly
      style={{ x, touchAction: "pan-y" }}
    >
      {children}
    </motion.div>
  );
};

export default SwipeWrapper;
