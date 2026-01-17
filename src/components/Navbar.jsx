import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Swords,
  User,
  Trophy,
  ClipboardList,
  Target,
} from "lucide-react";

const Navbar = () => {
  const navItems = [
    { id: "quests", label: "Quests", icon: Swords, path: "/board" },
    { id: "journey", label: "Journey", icon: Target, path: "/journey" },
    { id: "leaderboard", label: "Heroes", icon: Trophy, path: "/leaderboard" },
    {
      id: "logs",
      label: "Missions",
      icon: ClipboardList,
      path: "/my-missions",
    },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[var(--max-width-app)] mx-auto bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-4 flex justify-between items-center z-50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 transition-all duration-300 min-w-[64px] ${
              isActive ? "text-neon-purple" : "text-gray-500"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute -inset-x-3 -inset-y-2 bg-white/10 rounded-2xl z-0"
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
                  className={`w-5 h-5 ${
                    isActive ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""
                  }`}
                />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-neon-purple rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none relative z-10">
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
