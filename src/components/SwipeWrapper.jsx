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

  // 2. Block swipes on specific pages
  const locallySwipeablePages = ["/leaderboard","/shop","/my-missions", "/profile" ];

  const handleDragEnd = (event, info) => {
    // If blocked page, do nothing (shouldn't trigger anyway due to checks below)
    if (locallySwipeablePages.includes(location.pathname)) return;

    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const currentIndex = tabs.indexOf(location.pathname);
    
    // Thresholds: Drag 100px OR Flick fast (velocity > 500)
    const swipeThreshold = 100;
    const swipeVelocity = 500;

    // SWIPE RIGHT (Go Backwards: Board <- Journey)
    if (offset > swipeThreshold || velocity > swipeVelocity) {
      if (currentIndex > 0) {
        navigate(tabs[currentIndex - 1]);
      }
    } 
    // SWIPE LEFT (Go Forward: Board -> Journey)
    else if (offset < -swipeThreshold || velocity < -swipeVelocity) {
      if (currentIndex < tabs.length - 1 && currentIndex !== -1) {
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
      dragElastic={0.2} 
      
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