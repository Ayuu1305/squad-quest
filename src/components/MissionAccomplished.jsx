import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { isShowdownActive } from "../utils/showdownUtils";
import {
  Trophy,
  ArrowUp,
  Star,
  CheckCircle2,
  ChevronRight,
  Zap,
  Gift, // ✅ NEW: For loot display
} from "lucide-react";

const MissionAccomplished = ({
  missionName = "Operation Nightfall",
  xpGained = 150,
  reliabilityGain = 2,
  unlockedBadge = null,
  leveledUp = false,
  newLevel = 5,
  onClose,
  wasShowdown = null,
  hub = null, // ✅ NEW: Hub data for loot reveal
}) => {
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const trophyRef = useRef(null);
  const sunburstRef = useRef(null);
  const [displayedXP, setDisplayedXP] = useState(0);
  const [showRankAura, setShowRankAura] = useState(false);
  const activeShowdown =
    wasShowdown !== null ? wasShowdown : isShowdownActive();

  const baseXP = activeShowdown ? Math.round(xpGained / 2) : xpGained;
  const bonusXP = activeShowdown ? xpGained - baseXP : 0;

  // GSAP: Big Bang Entrance & Sunburst
  useGSAP(
    () => {
      // 1. Digital Confetti Burst
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const particles = [];
        const particleCount = 100;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        class Particle {
          constructor() {
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            this.speed = Math.random() * 15 + 5;
            this.angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.size = Math.random() * 4 + 2;
            this.color = ["#eab308", "#a855f7", "#3b82f6", "#ffffff"][
              Math.floor(Math.random() * 4)
            ];
            this.alpha = 1;
            this.gravity = 0.2;
          }
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.alpha -= 0.01;
          }
          draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.fill();
          }
        }

        for (let i = 0; i < particleCount; i++) particles.push(new Particle());

        function animateParticles() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach((p, i) => {
            if (p.alpha <= 0) particles.splice(i, 1);
            else {
              p.update();
              p.draw();
            }
          });
          if (particles.length > 0) requestAnimationFrame(animateParticles);
        }
        animateParticles();
      }

      // 2. Trophy Bounce
      gsap.fromTo(
        trophyRef.current,
        { scale: 0, rotationY: 180 },
        {
          scale: 1,
          rotationY: 0,
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
          onComplete: () => {
            // Continuous floating
            gsap.to(trophyRef.current, {
              y: -10,
              duration: 2,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
            });
          },
        },
      );

      // 3. Sunburst Rotation
      gsap.to(sunburstRef.current, {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
      });

      // 4. XP Counter Animation (Count up to TOTAL xpGained)
      const obj = { val: 0 };
      gsap.to(obj, {
        val: xpGained,
        duration: 2,
        delay: 1,
        onUpdate: () => setDisplayedXP(Math.ceil(obj.val)),
        ease: "power2.out",
      });

      // 5. Level Up Sequence
      if (leveledUp) {
        setTimeout(() => setShowRankAura(true), 3000);
      }
    },
    { scope: overlayRef },
  );

  const handleContinue = () => {
    gsap.to(overlayRef.current, {
      scale: 0.8,
      opacity: 0,
      filter: "blur(20px)",
      duration: 0.5,
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  // Rewards list construction
  const rewards = [];

  if (activeShowdown) {
    // Showdown Specific Breakdown
    rewards.push(
      {
        label: "Base Mission XP",
        val: `+${baseXP}`,
        icon: <Star className="text-yellow-400" />,
        color: "text-white",
        delay: 1.2,
      },
      {
        label: "SUNDAY SHOWDOWN",
        val: "MULTIPLIER x2",
        icon: <Zap className="text-red-500 fill-current animate-pulse" />,
        color: "text-red-500 font-black italic tracking-widest",
        highlight: true,
        delay: 1.6,
      },
    );
  } else {
    // Standard Display
    rewards.push({
      label: "XP Gained",
      val: `+${displayedXP}`,
      icon: <Star className="text-yellow-400" />,
      color: "text-white",
      delay: 1.2,
    });
  }

  rewards.push(
    {
      label: "Reliability",
      val: `+${reliabilityGain} Points`,
      icon: <ArrowUp className="text-green-400" />,
      color: "text-green-400",
      delay: activeShowdown ? 2.0 : 1.4,
    },
    {
      label: "🎁 REWARD UNLOCKED",
      val: hub?.loot?.value || "Hub Discount",
      description: hub?.loot?.description,
      terms: hub?.loot?.terms,
      icon: <Gift className="text-yellow-400 fill-current" />,
      color: "text-yellow-400",
      delay: activeShowdown ? 2.2 : 1.6,
      isLoot: true, // ✅ Special flag for different rendering
    },
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden h-screen bg-black/90"
    >
      {/* Background Blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-filter backdrop-blur-3xl" />

      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Level Up Flash overlay */}
      <AnimatePresence>
        {showRankAura && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-white z-[110] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-lg">
        {/* Trophy Section - Compact */}
        <div className="relative mb-6 flex justify-center scale-90">
          {/* Sunburst background */}
          <div
            ref={sunburstRef}
            className="absolute w-[300px] h-[300px] bg-gradient-radial from-yellow-500/30 to-transparent rounded-full opacity-60 pointer-events-none"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(234,179,8,0.3) 0deg 10deg, transparent 10deg 20deg)",
            }}
          />

          <div ref={trophyRef} className="relative">
            <div
              className={`p-6 rounded-full shadow-[0_0_60px_rgba(234,179,8,0.4)] border-4 ${
                activeShowdown
                  ? "bg-gradient-to-br from-red-500 to-red-700 border-red-500/50"
                  : "bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-200/50"
              }`}
            >
              {activeShowdown && (
                <div className="absolute -top-4 -right-4 bg-white text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg transform rotate-12 border border-red-500 z-10">
                  2x XP EVENT
                </div>
              )}
              <Trophy className="w-16 h-16 text-white drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* Text & Rewards */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h1 className="text-3xl font-black font-['Orbitron'] text-white italic tracking-tighter mb-1">
              MISSION ACCOMPLISHED
            </h1>
            <p className="text-neon-purple font-mono uppercase tracking-widest text-xs">
              {missionName} • Squad Success
            </p>

            {activeShowdown && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1.5, opacity: 1, y: -20 }}
                transition={{
                  delay: 2.5,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
                className="mt-4 inline-block relative z-50"
              >
                <div className="text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse">
                  +{displayedXP} XP
                </div>
              </motion.div>
            )}
          </motion.div>

          <div className="space-y-3">
            {rewards.map((reward, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reward.delay }}
                className={`glassmorphism-dark p-4 rounded-2xl flex flex-col border ${
                  reward.highlight
                    ? "border-red-500/50 bg-red-500/10"
                    : reward.isLoot
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        reward.isLoot ? "bg-yellow-500/20" : "bg-white/5"
                      }`}
                    >
                      {reward.icon}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase ${
                        reward.highlight ? "text-red-400" : "text-gray-400"
                      }`}
                    >
                      {reward.label}
                    </span>
                  </div>
                  <span
                    className={`text-lg font-black font-mono ${reward.color}`}
                  >
                    {reward.val}
                  </span>
                </div>

                {/* ✅ NEW: Show loot description */}
                {reward.isLoot && reward.description && (
                  <div className="mt-2 pt-2 border-t border-yellow-500/20">
                    <p className="text-xs text-gray-300">
                      {reward.description}
                    </p>
                    {reward.terms && (
                      <p className="text-[9px] text-gray-500 mt-1">
                        *{reward.terms}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {unlockedBadge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center gap-4 animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                  <Star className="text-white fill-white" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black text-purple-300 uppercase">
                    New Badge Unlocked
                  </div>
                  <div className="text-sm font-black text-white">
                    {unlockedBadge}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Level Up Banner */}
          <AnimatePresence>
            {showRankAura && (
              <motion.div
                initial={{ opacity: 0, scale: 2, filter: "blur(20px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                className="mt-8 py-4 bg-gradient-to-r from-neon-purple via-blue-500 to-neon-purple text-white shadow-[0_0_40px_rgba(168,85,247,0.5)]"
              >
                <div className="text-2xl font-black italic tracking-tighter">
                  RANK UP: LEVEL {newLevel}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.4em]">
                  New Aura Unlocked
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.0 }}
            onClick={handleContinue}
            className="group relative px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-neon-purple hover:text-white transition-all shadow-2xl flex items-center gap-2 mx-auto"
          >
            Mission Continue
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </div>

      <style>{`
        .bg-gradient-radial {
          background: radial-gradient(
            circle,
            var(--tw-gradient-from) 0%,
            var(--tw-gradient-to) 70%
          );
        }
      `}</style>
    </div>
  );
};

export default MissionAccomplished;
