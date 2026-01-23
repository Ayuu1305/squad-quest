import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Swords,
  User,
  Trophy,
  ClipboardList,
  Target,
  ShoppingBag,
} from "lucide-react";

const Navbar = () => {
  const navItems = [
    { id: "quests", label: "Quests", icon: Swords, path: "/board" },
    { id: "journey", label: "Journey", icon: Target, path: "/journey" },
    { id: "leaderboard", label: "Heroes", icon: Trophy, path: "/leaderboard" },
    { id: "shop", label: "Shop", icon: ShoppingBag, path: "/shop" },
    {
      id: "logs",
      label: "Missions",
      icon: ClipboardList,
      path: "/my-missions",
    },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    // Grid layout for 6 items: equal spacing, full width
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[98%] max-w-[var(--max-width-app)] mx-auto bg-black/80 backdrop-blur-xl border border-white/10 px-2 py-4 pb-safe-bottom grid grid-cols-6 gap-0 items-center z-50 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_10px_rgba(168,85,247,0.1)] min-h-[80px] overflow-hidden">
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
