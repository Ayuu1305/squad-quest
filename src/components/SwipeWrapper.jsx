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

  const handleDragStart = (event) => {
    // Store the drag start target to check later
    event.currentTarget.dragStartTarget = event.target;
  };

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const currentIndex = tabs.indexOf(location.pathname);

    if (currentIndex === -1) return;

    // 🔥 SMART DETECTION: Check if drag started inside a scrollable container
    // This allows internal section swipes to work while still enabling page navigation
    const target = event.currentTarget.dragStartTarget;
    let element = target;

    // Walk up the DOM tree to check if we're inside a horizontally scrollable element
    while (element && element !== event.currentTarget) {
      const style = window.getComputedStyle(element);
      const overflowX = style.overflowX;

      // If we find a horizontal scroll container, don't navigate
      if (overflowX === "scroll" || overflowX === "auto") {
        const canScrollHorizontally = element.scrollWidth > element.clientWidth;
        if (canScrollHorizontally) {
          return; // Let the internal swipe handle it
        }
      }

      element = element.parentElement;
    }

    // 🔥 INSTAGRAM-OPTIMIZED THRESHOLDS 🔥
    const swipeThreshold = 80;
    const swipeVelocity = 300;

    // SWIPE RIGHT (Go Backwards)
    if (offset > swipeThreshold || velocity > swipeVelocity) {
      if (currentIndex > 0) {
        navigate(tabs[currentIndex - 1]);
      }
    }
    // SWIPE LEFT (Go Forward)
    else if (offset < -swipeThreshold || velocity < -swipeVelocity) {
      if (currentIndex < tabs.length - 1) {
        navigate(tabs[currentIndex + 1]);
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full"
      // 🔥 INSTAGRAM-OPTIMIZED PHYSICS 🔥
      drag="x" // Always enable horizontal drag
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      dragMomentum={true}
      dragTransition={{
        bounceStiffness: 600,
        bounceDamping: 20,
      }}
      // Track where drag starts
      onDragStart={handleDragStart}
      // Handle the release
      onDragEnd={handleDragEnd}
      // CRITICAL: Allow vertical scroll, capture horizontal swipes
      style={{ x, touchAction: "pan-y" }}
    >
      {children}
    </motion.div>
  );
};

export default SwipeWrapper;
