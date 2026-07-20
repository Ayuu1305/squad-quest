import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { isSwipeBlocked } from "../utils/swipeBlocker";

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_SWIPE_DISTANCE = 120;   // px — minimum horizontal travel required
const MAX_ANGLE_DEG = 30;         // °  — how horizontal the gesture must be
const MIN_VELOCITY = 0.3;         // px/ms — must swipe with some speed/intention
const DIRECTION_LOCK_PX = 12;     // px — movement before we decide H or V axis
const RESISTANCE = 0.35;          // visual drag resistance factor

// ─── Helper: is touch origin inside a horizontally scrollable container? ─────
const isInsideHScroll = (element) => {
  let el = element;
  while (el && el !== document.body) {
    if (
      el.hasAttribute("data-no-swipe") ||
      el.hasAttribute("data-swipeable") ||
      el.hasAttribute("data-swipe-ignore")
    ) {
      return true;
    }
    const style = window.getComputedStyle(el);
    const ox = style.overflowX;
    if ((ox === "scroll" || ox === "auto") && el.scrollWidth > el.clientWidth) {
      return true;
    }
    if (
      el.classList.contains("overflow-x-auto") ||
      el.classList.contains("overflow-x-scroll")
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SwipeWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    "/board",
    "/journey",
    "/leaderboard",
    "/shop",
    "/my-missions",
    "/profile",
  ];

  // Gesture state (refs = no re-renders during gesture tracking)
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const startTime = useRef(0);
  const directionLocked = useRef(null); // null | "horizontal" | "vertical" | "blocked"
  const gestureValid = useRef(false);   // true only after genuine horizontal swipe confirmed

  // Visual feedback
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // ── touchstart ──────────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    // ① Global blocker (modals call blockSwipe() on mount)
    if (isSwipeBlocked()) {
      directionLocked.current = "blocked";
      return;
    }

    // ② DOM-level check (data-swipe-ignore attribute, horizontal-scroll containers)
    if (isInsideHScroll(e.target)) {
      directionLocked.current = "blocked";
      return;
    }

    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    lastX.current = touch.clientX;
    startTime.current = Date.now();
    directionLocked.current = null;
    gestureValid.current = false;
  };

  // ── touchmove ───────────────────────────────────────────────────────────────
  const handleTouchMove = (e) => {
    if (
      directionLocked.current === "blocked" ||
      directionLocked.current === "vertical"
    ) {
      return;
    }

    const touch = e.touches[0];
    lastX.current = touch.clientX;

    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Wait until there's enough movement to determine direction
    if (directionLocked.current === null) {
      if (absDx < DIRECTION_LOCK_PX && absDy < DIRECTION_LOCK_PX) return;

      // Compute angle from horizontal: 0° = pure horizontal, 90° = pure vertical
      const angle = Math.atan2(absDy, absDx) * (180 / Math.PI);

      if (angle > MAX_ANGLE_DEG) {
        // Gesture is too vertical — let normal scroll happen, ignore for navigation
        directionLocked.current = "vertical";
        setIsSwiping(false);
        setSwipeOffset(0);
        return;
      }
      directionLocked.current = "horizontal";
    }

    // Confirmed horizontal swipe — show visual drag feedback
    gestureValid.current = true;
    setIsSwiping(true);
    setSwipeOffset(dx * RESISTANCE);
  };

  // ── touchend ────────────────────────────────────────────────────────────────
  const handleTouchEnd = () => {
    // Always reset visual state first
    setIsSwiping(false);
    setSwipeOffset(0);

    // Only proceed if we locked onto a genuine horizontal gesture
    if (directionLocked.current !== "horizontal" || !gestureValid.current) {
      directionLocked.current = null;
      gestureValid.current = false;
      return;
    }

    directionLocked.current = null;
    gestureValid.current = false;

    const dx = lastX.current - startX.current;
    const absDx = Math.abs(dx);
    const elapsed = Math.max(1, Date.now() - startTime.current); // avoid /0
    const velocity = absDx / elapsed; // px/ms

    // Both distance AND velocity must be met — prevents slow accidental drags
    if (absDx < MIN_SWIPE_DISTANCE || velocity < MIN_VELOCITY) return;

    const currentIndex = tabs.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (dx > 0 && currentIndex > 0) {
      // Swipe RIGHT → previous tab
      navigate(tabs[currentIndex - 1]);
    } else if (dx < 0 && currentIndex < tabs.length - 1) {
      // Swipe LEFT → next tab
      navigate(tabs[currentIndex + 1]);
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={{ x: isSwiping ? swipeOffset : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {children}
    </motion.div>
  );
};

export default SwipeWrapper;
