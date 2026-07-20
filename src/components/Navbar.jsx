import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef } from "react";
import {
  Swords,
  User,
  Trophy,
  ClipboardList,
  Target,
  ShoppingBag,
} from "lucide-react";

// ─── Constants (mirror SwipeWrapper thresholds) ───────────────────────────────
const MIN_SWIPE_DISTANCE = 60;  // px — shorter threshold works well on a small navbar
const MAX_ANGLE_DEG = 35;       // ° — how horizontal the gesture must be
const MIN_VELOCITY = 0.2;       // px/ms
const DIRECTION_LOCK_PX = 8;    // px — movement before direction is decided

const tabs = [
  "/board",
  "/journey",
  "/leaderboard",
  "/shop",
  "/my-missions",
  "/profile",
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "quests",    label: "Quests",   icon: Swords,       path: "/board"       },
    { id: "journey",   label: "Journey",  icon: Target,       path: "/journey"     },
    { id: "leaderboard", label: "Heroes", icon: Trophy,       path: "/leaderboard" },
    { id: "shop",      label: "Shop",     icon: ShoppingBag,  path: "/shop"        },
    { id: "logs",      label: "Missions", icon: ClipboardList, path: "/my-missions" },
    { id: "profile",   label: "Profile",  icon: User,         path: "/profile"     },
  ];

  // ── Swipe tracking refs (no re-renders during gesture) ──────────────────────
  const startX    = useRef(0);
  const startY    = useRef(0);
  const lastX     = useRef(0);
  const startTime = useRef(0);
  const locked    = useRef(null); // null | "horizontal" | "vertical" | "blocked"

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    startX.current    = t.clientX;
    startY.current    = t.clientY;
    lastX.current     = t.clientX;
    startTime.current = Date.now();
    locked.current    = null;
  };

  const handleTouchMove = (e) => {
    if (locked.current === "vertical" || locked.current === "blocked") return;

    const t    = e.touches[0];
    lastX.current = t.clientX;

    const dx    = t.clientX - startX.current;
    const dy    = t.clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (locked.current === null) {
      if (absDx < DIRECTION_LOCK_PX && absDy < DIRECTION_LOCK_PX) return;
      const angle = Math.atan2(absDy, absDx) * (180 / Math.PI);
      if (angle > MAX_ANGLE_DEG) {
        locked.current = "vertical";
        return;
      }
      locked.current = "horizontal";
    }

    // Suppress vertical scroll while a horizontal swipe is in progress
    if (locked.current === "horizontal") {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (locked.current !== "horizontal") {
      locked.current = null;
      return;
    }
    locked.current = null;

    const dx      = lastX.current - startX.current;
    const absDx   = Math.abs(dx);
    const elapsed = Math.max(1, Date.now() - startTime.current);
    const velocity = absDx / elapsed;

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
    <nav
      // ── Layout ────────────────────────────────────────────────────────────
      // 'fixed' with an explicit 'bottom' + 'will-change: transform' prevents
      // the browser from repositioning this element during inertial scroll /
      // address-bar hide/show cycles (the "jumping navbar" bug on mobile).
      data-swipe-ignore="true"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[98%] max-w-[var(--max-width-app)] mx-auto bg-black/80 backdrop-blur-xl border border-white/10 px-2 py-4 pb-safe-bottom grid grid-cols-6 gap-0 items-center z-50 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_10px_rgba(168,85,247,0.1)] min-h-[80px] overflow-hidden"
      style={{
        // GPU compositing layer — stabilises the navbar against browser-chrome
        // resize reflows (the "navbar bounces when swiping" bug on mobile).
        // Do NOT add a transform here — Tailwind's -translate-x-1/2 handles
        // the horizontal centering and must not be overridden.
        willChange: "transform",
        touchAction: "pan-y",
      }}
      // ── Swipe handlers ───────────────────────────────────────────────────
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-1 transition-all duration-300 w-full px-0 ${
              isActive ? "text-neon-purple" : "text-gray-500"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className={`absolute -inset-x-3 -inset-y-4 bg-gradient-to-b from-neon-purple/20 to-transparent z-0 border-t border-neon-purple/30 ${
                    item.id === "quests"
                      ? "rounded-l-[2rem] rounded-r-none pl-4"
                      : item.id === "profile"
                        ? "rounded-r-[2rem] rounded-l-none pr-4"
                        : "rounded-lg"
                  }`}
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <div className="relative z-10">
                <item.icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isActive ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""
                  }`}
                />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-neon-purple rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none relative z-10 text-center w-full truncate px-0.5">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;
