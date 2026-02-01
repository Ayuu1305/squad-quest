import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MapPin,
  ChevronRight,
  Zap,
  Lock,
  Globe,
  Wifi,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { updateHeroProfile } from "../backend/services/auth.service";

const Landing = () => {
  const navigate = useNavigate();
  const { city, selectCity } = useGame();
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredCity, setHoveredCity] = useState(null);

  const cities = [
    {
      name: "Ahmedabad",
      status: "Active Sector",
      heroes: "1.2k",
      emoji: "🏙️",
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/50",
    },
    {
      name: "Mumbai",
      status: "Signal Lost",
      heroes: "0",
      emoji: "🌊",
      color: "text-red-400",
      bg: "bg-red-500/5",
      border: "border-red-500/30",
    },
    {
      name: "Bangalore",
      status: "Locked",
      heroes: "0",
      emoji: "💻",
      color: "text-red-400",
      bg: "bg-red-500/5",
      border: "border-red-500/30",
    },
  ];

  const handleCitySelect = async (cityName) => {
    if (cityName === "Ahmedabad") {
      try {
        setIsAnimating(true);
        if (user) {
          await updateHeroProfile(user.uid, { city: cityName });
        }
        selectCity(cityName);

        // Add a slight delay for the "Warp Speed" effect
        setTimeout(() => {
          navigate("/board");
        }, 1500);
      } catch (error) {
        console.error("Failed to update realm:", error);
        setIsAnimating(false);
      }
    }
  };

  // Container Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  return (
    <div className="relative min-h-screen bg-[#0f0f23] text-white flex items-center justify-center overflow-hidden font-['Rajdhani']">
      {/* ==============================
          BACKGROUND FX (Cyberpunk Grid)
         ============================== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Grid Floor */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
          style={{
            transform:
              "perspective(1000px) rotateX(60deg) translateY(-100px) scale(1.5)",
          }}
        />
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      {/* ==============================
          MAIN CONTENT HUD
         ============================== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 p-6 items-center"
      >
        {/* LEFT COLUMN: Welcome & Info */}
        <div className="space-y-8">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-mono mb-4">
              <Terminal size={12} />
              <span>GET_READY</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black font-['Orbitron'] leading-none">
              CHOOSE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                YOUR CITY
              </span>
            </h1>
            <p className="text-xl text-gray-400 mt-4 max-w-md font-light">
              Connect to a local server to begin your journey. Earn real XP for
              completing tasks in your city.
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={itemVariants}
            className="flex gap-8 border-t border-white/10 pt-6"
          >
            <div>
              <div className="text-2xl font-bold font-['Orbitron']">3</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                Sectors
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-['Orbitron'] text-green-400">
                1
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                Online
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-['Orbitron'] text-cyan-400">
                50k+
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                Heroes
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: The City Selector Grid */}
        <div className="relative">
          {/* Decorative Border */}
          <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500/20 to-purple-500/20 rounded-3xl blur-sm" />

          <div className="relative bg-[#15171E]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-mono text-gray-400 flex items-center gap-2">
                <Globe size={14} className="animate-spin-slow" />
                AVAILABLE_NETWORKS
              </h2>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
              </div>
            </div>

            <div className="space-y-4">
              {cities.map((cityOption) => {
                const isLocked = cityOption.status !== "Active Sector";
                const isHovered = hoveredCity === cityOption.name;

                return (
                  <motion.button
                    key={cityOption.name}
                    variants={itemVariants}
                    onHoverStart={() => setHoveredCity(cityOption.name)}
                    onHoverEnd={() => setHoveredCity(null)}
                    onClick={() =>
                      !isLocked && handleCitySelect(cityOption.name)
                    }
                    disabled={isLocked || isAnimating}
                    className={`group w-full relative overflow-hidden rounded-xl border p-4 transition-all duration-300 text-left
                      ${
                        isLocked
                          ? "bg-white/5 border-white/5 opacity-60 cursor-not-allowed"
                          : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-500/50"
                      }
                      ${city === cityOption.name ? "ring-2 ring-purple-500 bg-purple-500/10" : ""}
                    `}
                  >
                    {/* Hover Gradient Effect */}
                    {!isLocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-[#0f0f23] border border-white/10 ${!isLocked && "group-hover:scale-110 transition-transform"}`}
                        >
                          {cityOption.emoji}
                        </div>
                        <div>
                          <h3
                            className={`text-lg font-bold font-['Orbitron'] ${isLocked ? "text-gray-500" : "text-white group-hover:text-cyan-400"}`}
                          >
                            {cityOption.name}
                          </h3>
                          <div
                            className={`text-xs font-mono flex items-center gap-1.5 ${cityOption.color}`}
                          >
                            {isLocked ? (
                              <>
                                <Lock size={10} />
                                {cityOption.status}
                              </>
                            ) : (
                              <>
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                {cityOption.status}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side Info */}
                      <div className="text-right">
                        {isLocked ? (
                          <ShieldAlert className="text-gray-600" />
                        ) : (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-xs text-gray-400 font-mono mb-1">
                              <Wifi size={10} />
                              {cityOption.heroes}
                            </div>
                            <ChevronRight
                              className={`text-gray-500 ${isHovered ? "text-cyan-400 translate-x-1" : ""} transition-all`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Warp Speed Overlay (Triggers on Select) */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 50], opacity: [1, 0] }}
                transition={{ duration: 1.5, ease: "easeIn" }}
                className="w-2 h-2 bg-white rounded-full mx-auto mb-8 shadow-[0_0_50px_#fff]"
              />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-cyan-400 font-mono tracking-[0.5em] animate-pulse"
              >
                INITIALIZING NEURAL LINK...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
