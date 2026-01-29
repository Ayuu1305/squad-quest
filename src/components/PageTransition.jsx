import { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

// Define the navigation order for swipe gestures
export const ROUTE_ORDER = [
  "/city-select",
  "/board",
  "/leaderboard",
  "/shop",
  "/profile",
];

/**
 * PageTransition - Handles swipe gesture navigation between pages
 *
 * Features:
 * - Swipe left/right to navigate between pages
 * - 30% threshold for triggering navigation
 * - Smooth animations with framer-motion
 * - No conflict with vertical scrolling
 */
const PageTransition = ({ children, direction = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.3, 1, 0.3]);

  // Find current page index in route order
  const getCurrentIndex = () => {
    const currentPath = location.pathname;
    const index = ROUTE_ORDER.findIndex((route) =>
      currentPath.startsWith(route),
    );
    return index !== -1 ? index : -1;
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const threshold = window.innerWidth * 0.3; // 30% of screen width
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Check if drag exceeds threshold or has sufficient velocity
    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      const currentIndex = getCurrentIndex();

      if (currentIndex === -1) return;

      // Swipe right = previous page (go back in array)
      if (offset > 0 && currentIndex > 0) {
        navigate(ROUTE_ORDER[currentIndex - 1]);
      }
      // Swipe left = next page (go forward in array)
      else if (offset < 0 && currentIndex < ROUTE_ORDER.length - 1) {
        navigate(ROUTE_ORDER[currentIndex + 1]);
      }
    }
  };

  // Animation variants based on direction
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : direction < 0 ? "-100%" : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : direction < 0 ? "100%" : 0,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{
        x: isDragging ? x : 0,
        opacity: isDragging ? opacity : 1,
        touchAction: "pan-y", // Allow vertical scrolling, only horizontal drag
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
