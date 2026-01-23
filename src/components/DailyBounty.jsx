import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flame, Gift, Clock, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { claimDailyBounty, checkStreak } from "../backend/firebaseService";
import toast from "react-hot-toast";

const DailyBounty = () => {
  const { user } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualNextClaim, setManualNextClaim] = useState(null); // Track manual cooldown
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // ✅ Progressive Multiplier Calculation
  const streak = user?.daily_streak || 0;
  const baseXP = 50;
  const multiplier = 1 + streak * 0.05; // 5% per day
  let potentialXP = Math.min(Math.floor(baseXP * multiplier), 150); // Cap at 150 XP

  // 🚀 Check for Neuro-Boost (2x Multiplier)
  const hasBoost = user?.inventory?.neuro_boost > 0 || user?.neuro_boost > 0;
  if (hasBoost) {
    potentialXP *= 2;
  }

  const displayMultiplier = multiplier.toFixed(2);

  useEffect(() => {
    const syncStreak = async () => {
      if (!user?.uid) return;

      const result = await checkStreak(user.uid);

      // Show toast based on streak sync result
      if (result.status === "protected") {
        console.log("🛡️ Streak Freeze saved you!");
        toast("Streak Freeze activated! Your streak is safe. 🧊", {
          icon: "🛡️",
          style: {
            background: "#1a1a2e",
            color: "#60a5fa",
            border: "1px solid rgba(96, 165, 250, 0.3)",
          },
        });
      } else if (result.status === "reset") {
        toast.error("Streak reset. 😢", {
          duration: 2000,
        });
      }
    };

    syncStreak();
  }, [user?.uid]);

  useEffect(() => {
    const updateStatus = () => {
      // Use manual next claim time if set (from 403 error), otherwise use Firebase data
      let nextAvailable;

      if (manualNextClaim) {
        // Use manual time set after 403 error
        nextAvailable = manualNextClaim;
      } else if (user?.last_claimed_at) {
        // Use Firebase timestamp
        const last = user.last_claimed_at.toDate();
        nextAvailable = new Date(last.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // No claim history - allow claim
        setCanClaim(true);
        return;
      }

      const now = new Date();
      const diff = nextAvailable - now;

      if (diff <= 0) {
        if (!canClaim) {
          setCanClaim(true);
          setManualNextClaim(null); // Clear manual time
          // Trigger GSAP Flip Animation
          gsap.fromTo(
            buttonRef.current,
            { rotateX: 0 },
            { rotateX: 360, duration: 0.8, ease: "back.out(1.7)" },
          );
        }
        setCountdown("00:00:00");
      } else {
        setCanClaim(false);
        const h = Math.floor(diff / (1000 * 60 * 60))
          .toString()
          .padStart(2, "0");
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          .toString()
          .padStart(2, "0");
        const s = Math.floor((diff % (1000 * 60)) / 1000)
          .toString()
          .padStart(2, "0");
        setCountdown(`${h}:${m}:${s}`);
      }
    };

    updateStatus();
    const timer = setInterval(updateStatus, 1000);
    return () => clearInterval(timer);
  }, [user?.last_claimed_at, manualNextClaim, canClaim]);

  const triggerGoldBurst = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const particles = [];
    const count = 40;

    canvas.width = containerRef.current.offsetWidth;
    canvas.height = containerRef.current.offsetHeight;

    class Particle {
      constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.size = Math.random() * 3 + 2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.alpha -= 0.02;
      }
      draw() {
        ctx.fillStyle = `rgba(234, 179, 8, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        if (p.alpha <= 0) particles.splice(i, 1);
        else {
          p.update();
          p.draw();
        }
      });
      if (particles.length > 0) requestAnimationFrame(animate);
    };
    animate();
  };

  const handleClaim = async () => {
    if (!canClaim || loading || !user?.uid) return;

    // ✅ OPTIMISTIC UI: Update state IMMEDIATELY
    setLoading(true);
    setCanClaim(false);

    // Trigger visual feedback INSTANTLY
    triggerGoldBurst();
    toast.success(`🎉 Daily Bounty Claimed! +${potentialXP} XP`, {
      duration: 3000,
      style: {
        background: "#1a1a2e",
        color: "#fff",
        border: "1px solid rgba(234,179,8,0.3)",
      },
    });

    // Set manual countdown immediately (optimistic)
    const nextClaim = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setManualNextClaim(nextClaim);

    try {
      // ✅ API call runs in background
      const response = await claimDailyBounty();

      // 🧊 Check if Streak Freeze was activated
      if (response?.streakFrozen) {
        toast("Streak Freeze used! Your streak is safe. 🧊", {
          icon: "🛡️",
          duration: 5000,
          style: {
            background: "#1a1a2e",
            color: "#60a5fa", // Blue
            border: "1px solid rgba(96, 165, 250, 0.3)",
          },
        });
      }
      // Success - state already updated optimistically
    } catch (e) {
      // ✅ ROLLBACK on failure
      const errorMsg = e?.message?.toLowerCase() || "";

      // ✅ Specific 403 Cooldown Check
      if (e.status === 403 && errorMsg.includes("cooldown")) {
        toast("⏳ Bounty on cooldown. Come back tomorrow!", {
          icon: "⏳",
          style: {
            background: "#1a1a2e",
            color: "#fbbf24", // Yellow/Info
            border: "1px solid rgba(251, 191, 36, 0.3)",
          },
        });
        return;
      }

      if (
        errorMsg.includes("cooldown") ||
        errorMsg.includes("already claimed")
      ) {
        // Already claimed - keep the locked state
        toast("⏳ Daily Reward already claimed. Come back tomorrow!", {
          duration: 4000,
          icon: "⚠️",
          style: {
            background: "#1a1a2e",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.3)",
          },
        });
      } else {
        // ✅ REVERT optimistic update on error
        setCanClaim(true);
        setManualNextClaim(null);

        if (
          errorMsg.includes("failed to fetch") ||
          errorMsg.includes("network")
        ) {
          toast.error("🔌 Connection failed. Please try again.", {
            duration: 4000,
            style: {
              background: "#1a1a2e",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.3)",
            },
          });
        } else {
          console.error("Daily Bounty claim error:", e);
          toast.error("Failed to claim bounty. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative mb-6 group">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
      />

      {/* Holographic Border Effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0 rounded-3xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-700" />

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative bg-black/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-500 min-h-[160px] flex flex-col justify-center"
      >
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_70%)]" />
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_11px)]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Icon with Flame Glow - Larger on Mobile */}
            <div className="relative">
              <div
                className={`absolute inset-0 ${canClaim ? "bg-orange-500" : "bg-gray-500"} blur-xl opacity-40 animate-pulse-slow rounded-full`}
              />
              <motion.div
                animate={canClaim ? { y: [0, -5, 0] } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`w-20 h-20 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 border-t border-white/20 ${
                  canClaim
                    ? "bg-gradient-to-br from-yellow-500 to-orange-600"
                    : "bg-gray-800 border-white/5 grayscale"
                }`}
              >
                <Gift className="w-10 h-10 md:w-8 md:h-8 text-white drop-shadow-md" />
              </motion.div>
              {/* Fire Effect behind icon if streak > 0 */}
              {streak > 0 && (
                <Flame className="absolute -top-3 -right-3 w-8 h-8 md:w-6 md:h-6 text-orange-500 fill-orange-500 animate-bounce drop-shadow-lg z-20" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-2xl md:text-xl font-black font-['Orbitron'] text-white italic tracking-tighter uppercase mb-2 md:mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Daily Bounty
              </h3>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                    Streak Bonus
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg md:text-base text-yellow-500 font-mono font-bold">
                      {displayMultiplier}x
                    </span>
                    {hasBoost && (
                      <span className="text-[10px] bg-purple-600/30 text-purple-300 border border-purple-500/50 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">
                        2x ACTIVE 🚀
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-px h-8 md:h-6 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-xs md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                    Current
                  </span>
                  <span className="text-lg md:text-sm font-black text-white font-mono">
                    {streak} Days
                  </span>
                </div>

                {/* 🚀 NEURO-BOOST INDICATOR */}
                {(user?.inventory?.neuro_boost || 0) > 0 && (
                  <>
                    <div className="w-px h-8 md:h-6 bg-white/10" />
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg px-2 py-1">
                      <span className="text-xl">🚀</span>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-purple-300 uppercase tracking-wider leading-none">
                          Active
                        </span>
                        <span className="text-xs font-black text-pink-400 font-mono">
                          2x Boost
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-end w-full md:w-auto"
            ref={buttonRef}
          >
            <AnimatePresence mode="wait">
              {canClaim ? (
                <motion.button
                  key="claim"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaim}
                  disabled={loading}
                  className="relative group overflow-hidden w-full md:w-auto px-8 py-4 md:py-4 h-14 md:h-auto bg-gradient-to-r from-white via-gray-100 to-gray-300 text-black font-black uppercase tracking-widest text-sm md:text-xs rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.6)] transition-all flex items-center justify-center md:justify-start gap-3"
                >
                  {/* Heartbeat Animation Wrapper */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    className="bg-yellow-500 rounded-full p-1"
                  >
                    {loading ? (
                      <div className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-3 h-3 bg-black rounded-full" />
                    )}
                  </motion.div>

                  <span>
                    {loading ? "Decrypting..." : `CLAIM ${potentialXP} XP`}
                  </span>

                  {/* Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </motion.button>
              ) : (
                <div className="flex flex-col items-center md:items-end w-full md:w-auto opacity-90">
                  <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 animate-pulse">
                    <Clock className="w-3 h-3" />
                    System Locked
                  </div>
                  <div className="bg-black/50 border border-red-500/20 rounded-lg px-4 py-2 w-full md:w-auto text-center">
                    <div className="font-mono text-xl font-black text-red-500 tracking-[0.2em] drop-shadow-sm">
                      {countdown}
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CheckCircle = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default DailyBounty;
