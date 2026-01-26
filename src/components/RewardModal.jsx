import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Crown, Shield, Medal, Zap, Award } from "lucide-react";
import { useReward } from "../context/RewardContext";

const RewardModal = () => {
  const { currentReward, dismissReward, isShowing, setIsShowing } = useReward();

  useEffect(() => {
    if (currentReward && !isShowing) {
      setIsShowing(true);
      // Trigger confetti explosion with GOLD colors
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
        colors: ["#FFD700", "#FFA500", "#FFDF00", "#FFE5B4"], // Gold colors
      };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [currentReward, isShowing, setIsShowing]);

  if (!currentReward) return null;

  const { type, title, image, subtext, data } = currentReward;

  // Render content based on type
  const renderContent = () => {
    switch (type) {
      case "BADGE":
        return (
          <>
            {/* Floating Badge Icon with White Glow */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl mb-6 relative"
              style={{
                filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))",
              }}
            >
              {image}
            </motion.div>
            <h2 className="text-4xl font-['Orbitron'] font-black uppercase tracking-tighter mb-2 text-center bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(251,191,36,0.5)]">
              {title}
            </h2>
            <p className="text-xl text-gray-300 font-mono uppercase tracking-wide text-center drop-shadow-md">
              {subtext}
            </p>
          </>
        );

      case "LEVEL":
        return (
          <>
            {/* Floating Level Number with Silver-to-White Gradient */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse" />
              <div
                className="relative text-9xl font-['Orbitron'] font-black text-transparent bg-gradient-to-b from-slate-200 via-white to-slate-300 bg-clip-text"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(255, 255, 255, 0.6))",
                }}
              >
                {data?.level || "?"}
              </div>
            </motion.div>
            <h2 className="text-5xl font-['Orbitron'] font-black uppercase tracking-tighter mb-4 text-center bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)] animate-pulse">
              {title}
            </h2>
            <p className="text-xl text-gray-300 font-mono uppercase tracking-wide text-center drop-shadow-md">
              {subtext}
            </p>
          </>
        );

      case "RANK":
        return (
          <>
            {/* Floating Rank Icon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-6 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full animate-pulse" />
              <div
                className="relative w-32 h-32 flex items-center justify-center"
                style={{
                  filter: "drop-shadow(0 0 25px rgba(251, 191, 36, 0.8))",
                }}
              >
                {data?.rankName === "Gold" && (
                  <div className="relative">
                    <Crown
                      className="w-32 h-32 text-yellow-300 fill-yellow-500/30"
                      strokeWidth={1.5}
                    />
                    <Zap className="w-10 h-10 text-yellow-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 animate-spin-slow opacity-80" />
                  </div>
                )}
                {data?.rankName === "Silver" && (
                  <div className="relative">
                    <Shield
                      className="w-32 h-32 text-slate-200 fill-slate-400/30"
                      strokeWidth={1.5}
                    />
                    <Award className="w-10 h-10 text-cyan-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                )}
                {data?.rankName === "Bronze" && (
                  <div className="relative">
                    <Medal
                      className="w-32 h-32 text-orange-300 fill-orange-500/30"
                      strokeWidth={1.5}
                    />
                    <Zap className="w-10 h-10 text-yellow-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4" />
                  </div>
                )}
                {data?.rankName === "Recruit" && (
                  <div className="relative">
                    <Shield
                      className="w-32 h-32 text-gray-500 fill-gray-700"
                      strokeWidth={1}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-black text-2xl uppercase tracking-widest">
                      RKT
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            <h2 className="text-5xl font-['Orbitron'] font-black uppercase tracking-tighter mb-4 text-center bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]">
              {title}
            </h2>
            <p className="text-xl text-gray-300 font-mono uppercase tracking-wide text-center drop-shadow-md">
              {subtext}
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Prevent closing by clicking background
            }
          }}
        >
          <motion.div
            initial={{ scaleY: 0, scaleX: 0.1, opacity: 0 }}
            animate={{
              scaleY: 1,
              scaleX: 1,
              opacity: 1,
              transition: {
                scaleY: { duration: 0.3, ease: "circOut" },
                scaleX: { duration: 0.3, delay: 0.3, ease: "circOut" },
                opacity: { duration: 0.1 },
              },
            }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
            className="relative max-w-md w-full"
          >
            {/* Cyber Pulse Glow Shadow - Breathing Animation */}
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-fuchsia-500/30 blur-xl rounded-full -z-20"
            />

            {/* Rotating Tech Ring Background */}
            <div className="absolute inset-[-20%] -z-10 animate-[spin_10s_linear_infinite] opacity-20">
              <div className="w-full h-full border-2 border-dashed border-cyan-400/30 rounded-full" />
            </div>

            {/* Main Artifact Container - Octagonal Shape on Desktop, Rounded on Mobile */}
            <div className="relative rounded-3xl md:clip-octagonal p-[2px] bg-gradient-to-br from-fuchsia-500 via-purple-600 to-cyan-500 shadow-2xl w-[90vw] md:w-full md:max-w-md">
              {/* Rotating Border Gradient Layer */}
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,_#d946ef,_#a855f7,_#d946ef)] animate-[spin_4s_linear_infinite]" />

              {/* Inner Metallic Box */}
              <div className="relative bg-gray-900 rounded-3xl md:clip-octagonal p-1 flex flex-col items-center justify-center overflow-hidden">
                {/* INNER FRAME CONTAINER */}
                <div className="relative w-full h-full bg-black/80 rounded-[22px] md:clip-octagonal p-5 md:p-8 flex flex-col items-center overflow-hidden border border-white/10">
                  {/* 1. DIGITAL TEXTURE (SCANLINES) */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20 z-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(to bottom, transparent 50%, rgba(0, 255, 255, 0.1) 50%)",
                      backgroundSize: "100% 4px",
                    }}
                  />

                  {/* 4. LIGHTING EFFECTS (SHEEN ANIMATION) */}
                  <motion.div
                    animate={{ left: ["-100%", "200%"] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                    className="absolute top-0 -inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] pointer-events-none z-10"
                  />

                  {/* Cyber Scan Line Animation */}
                  <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] z-0"
                  />

                  {/* Central Hexagon "Portal" */}
                  <div className="relative z-10 mb-8 w-40 h-40 flex items-center justify-center">
                    {/* Hexagon Border */}
                    <div className="absolute inset-0 clip-hexagon bg-gradient-to-br from-cyan-400 to-purple-500 p-[2px]">
                      <div className="w-full h-full bg-gray-950 clip-hexagon" />
                    </div>

                    {/* Inner Hexagon Glow */}
                    <div className="absolute inset-2 clip-hexagon bg-gradient-to-b from-purple-900/80 to-transparent flex items-center justify-center border border-white/10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.5),_transparent)]" />
                    </div>

                    {/* Icon/Content */}
                    <div className="relative z-20 scale-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                      {type === "BADGE" && currentReward.image}
                      {type === "LEVEL" && (
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 font-['Orbitron']">
                          {data?.level}
                        </span>
                      )}
                      {type === "RANK" && (
                        <div className="scale-75 transform">
                          {data?.rankName === "Gold" && (
                            <Crown className="w-24 h-24 text-yellow-400 fill-yellow-400/20" />
                          )}
                          {data?.rankName === "Silver" && (
                            <Shield className="w-24 h-24 text-slate-300 fill-slate-300/20" />
                          )}
                          {data?.rankName === "Bronze" && (
                            <Medal className="w-24 h-24 text-orange-400 fill-orange-400/20" />
                          )}
                          {data?.rankName === "Recruit" && (
                            <Shield className="w-24 h-24 text-gray-400 fill-gray-400/20" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="relative z-10 text-center space-y-2 mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-4xl font-['Orbitron'] font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-white to-purple-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.6)] tracking-widest uppercase">
                      {title}
                    </h2>
                    <p className="text-base md:text-lg font-mono text-purple-200 tracking-wider uppercase drop-shadow-md">
                      {subtext}
                    </p>
                  </div>

                  {/* Action Button - Matches ShopPage Buy Now Button */}
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 20px rgba(217, 70, 239, 0.6)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={dismissReward}
                    className="relative w-full h-12 md:h-auto py-3 md:py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-['Orbitron'] tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold overflow-hidden shadow-lg shadow-fuchsia-500/50 transition-all rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                    <span className="relative z-10 flex items-center justify-center gap-2 text-sm md:text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                      CLAIM REWARD{" "}
                      <Zap className="w-4 h-4 ml-1 md:ml-2 inline-block" />
                    </span>
                  </motion.button>

                  {/* Corner Decorative Tech Bits */}
                  <div className="hidden md:block absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg" />
                  <div className="hidden md:block absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg" />
                  <div className="hidden md:block absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg" />
                  <div className="hidden md:block absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardModal;
