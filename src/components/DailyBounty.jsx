import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flame, Gift, Clock, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { claimDailyBounty, checkStreak } from "../backend/firebaseService";

const DailyBounty = () => {
  const { user } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const streak = user?.daily_streak || 0;
  const multiplier = Math.min(2.0, 1.0 + streak * 0.05).toFixed(2);

  useEffect(() => {
    if (user?.uid) {
      checkStreak(user.uid);
    }
  }, [user?.uid]);

  useEffect(() => {
    const updateStatus = () => {
      if (!user?.last_claimed_at) {
        setCanClaim(true);
        return;
      }

      const now = new Date();
      const last = user.last_claimed_at.toDate();
      const nextAvailable = new Date(last.getTime() + 24 * 60 * 60 * 1000);

      const diff = nextAvailable - now;

      if (diff <= 0) {
        if (!canClaim) {
          setCanClaim(true);
          // Trigger GSAP Flip Animation
          gsap.fromTo(
            buttonRef.current,
            { rotateX: 0 },
            { rotateX: 360, duration: 0.8, ease: "back.out(1.7)" }
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
  }, [user?.last_claimed_at, canClaim]);

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
    setLoading(true);
    try {
      await claimDailyBounty();
      triggerGoldBurst();
      // Logic for success would be handled by AuthContext listener updating 'user'
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative mb-8">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
      />

      <motion.div
        whileHover={{ y: -2 }}
        className="glassmorphism-dark p-6 rounded-3xl border border-white/5 relative overflow-hidden group shadow-2xl"
      >
        {/* Glow Background - Use motion for stable color interpolation */}
        <motion.div
          animate={{
            backgroundColor: canClaim
              ? "rgba(234, 179, 8, 0.2)"
              : "rgba(107, 114, 128, 0.1)",
          }}
          transition={{ duration: 1 }}
          className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full pointer-events-none"
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                canClaim
                  ? "bg-gradient-to-br from-yellow-400 to-orange-600 shadow-yellow-500/30"
                  : "bg-gray-800 shadow-none grayscale"
              }`}
            >
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black font-['Orbitron'] text-white italic tracking-tighter uppercase">
                Daily Bounty
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 rounded-full border border-orange-500/20">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-black text-orange-400 uppercase">
                    {streak} Day Streak
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {multiplier}x XP Bonus
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4" ref={buttonRef}>
            <AnimatePresence mode="wait">
              {canClaim ? (
                <motion.button
                  key="claim"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  onClick={handleClaim}
                  disabled={loading}
                  className="relative group overflow-hidden px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] transition-all shimmer-btn"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? "Processing..." : "Claim +50 XP"}
                    {!loading && (
                      <Sparkles className="w-4 h-4 text-yellow-600" />
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </motion.button>
              ) : (
                <motion.div
                  key="cooldown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-end opacity-60"
                >
                  <div className="flex items-center gap-2 text-gray-400 font-black uppercase text-[10px] tracking-widest mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    Bounty on Cooldown
                  </div>
                  <div className="flex items-center gap-2 text-white font-mono text-sm font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    {countdown}
                  </div>
                </motion.div>
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
