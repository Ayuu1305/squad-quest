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
