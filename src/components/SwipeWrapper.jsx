import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SwipeWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Touch tracking refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const isScrolling = useRef(null);

  // For visual feedback during swipe
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // 1. Define your Tab Order
  const tabs = [
    "/board",
    "/journey",
    "/leaderboard",
    "/shop",
    "/my-missions",
    "/profile",
  ];

  // Check if element or ancestors have horizontal scroll
  const hasHorizontalScroll = (element) => {
    while (element && element !== document.body) {
      const style = window.getComputedStyle(element);
      const overflowX = style.overflowX;

      if (overflowX === "scroll" || overflowX === "auto") {
        if (element.scrollWidth > element.clientWidth) {
          return true;
        }
      }
      element = element.parentElement;
    }
    return false;
  };

  const handleTouchStart = (e) => {
    // Check if starting inside a horizontally scrollable container
    if (hasHorizontalScroll(e.target)) {
      isScrolling.current = "blocked";
      return;
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    isScrolling.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (isScrolling.current === "blocked") return;

    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // Determine if this is a horizontal or vertical scroll (first movement decides)
    if (isScrolling.current === null) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isScrolling.current = false; // Horizontal swipe
      } else if (Math.abs(deltaY) > 10) {
        isScrolling.current = true; // Vertical scroll
        setIsSwiping(false);
        setSwipeOffset(0);
        return;
      }
    }

    // If vertical scrolling, don't interfere
    if (isScrolling.current === true) return;

    // Apply visual feedback with resistance
    const resistance = 0.3; // Instagram-like resistance
    const visualOffset = deltaX * resistance;
    setSwipeOffset(visualOffset);
  };

  const handleTouchEnd = () => {
    if (isScrolling.current === "blocked" || isScrolling.current === true) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }

    const deltaX = touchEndX.current - touchStartX.current;
    const currentIndex = tabs.indexOf(location.pathname);

    // Reset visual feedback
    setIsSwiping(false);
    setSwipeOffset(0);

    if (currentIndex === -1) return;

    // 🔥 SWIPE THRESHOLD: 80px for reliable touch detection
    const threshold = 80;

    // SWIPE RIGHT (Go to previous page)
    if (deltaX > threshold) {
      if (currentIndex > 0) {
        navigate(tabs[currentIndex - 1]);
      }
    }
    // SWIPE LEFT (Go to next page)
    else if (deltaX < -threshold) {
      if (currentIndex < tabs.length - 1) {
        navigate(tabs[currentIndex + 1]);
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={{
        x: isSwiping ? swipeOffset : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {children}
    </motion.div>
  );
};

export default SwipeWrapper;
