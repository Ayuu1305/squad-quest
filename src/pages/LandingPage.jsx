import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  Trophy,
  Users,
  Target,
  Zap,
  Coffee,
  Gamepad2,
  BookOpen,
  Dumbbell,
  ChevronRight,
  Flame,
  Crown,
  Star,
  Shield,
  Sword,
  Map,
  Gift,
  Ticket,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { lazy, Suspense } from "react";
// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

// ============================================
// 3D BACKGROUND COMPONENT
// ============================================
const Landing3DScene = lazy(
  () => import("./Landing3DScene"),
);



// ============================================
// UI SUB-COMPONENTS
// ============================================

function TextReveal({ text, className = "", delay = 0 }) {
  const letters = text.split("");
  return (
    <span className={`inline-flex flex-wrap justify-center ${className}`}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + index * 0.05,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          className="inline-block"
          style={{ transformStyle: "preserve-3d" }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </span>
  );
}

function ShimmerButton({ children, onClick, className = "" }) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative overflow-hidden px-10 py-5 rounded-2xl font-['Orbitron'] font-bold text-white bg-white/5 border border-white/10 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7] to-[#06b6d4] opacity-20 group-hover:opacity-40 transition-opacity" />
      <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest text-sm">
        {children}
      </span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ["-200%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)]" />
    </motion.button>
  );
}

function LiveMarquee() {
  const stats = [
    { icon: Flame, text: "1.2k Heroes Online", color: "text-orange-500" },
    {
      icon: Crown,
      text: "Gold Tier Unlocked: Ayush",
      color: "text-yellow-400",
    },
    { icon: Target, text: "Quest Complete: Gym", color: "text-cyan-400" },
    { icon: Trophy, text: "New Champion: Sarah", color: "text-purple-400" },
    { icon: Zap, text: "2.5k XP Earned Today", color: "text-yellow-400" },
    { icon: Shield, text: "Squad Formed: Night Owls", color: "text-green-400" },
    { icon: Star, text: "Daily Streak: 15 Days", color: "text-pink-400" },
    {
      icon: Sword,
      text: "Boss Defeated: Procrastination",
      color: "text-red-400",
    },
  ];

  return (
    <div className="w-full bg-black/40 backdrop-blur-sm border-y border-white/5 py-4 overflow-hidden z-20 relative">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
      >
        {[...stats, ...stats, ...stats].map((stat, index) => (
          <div key={index} className="flex items-center gap-3 mx-8">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-sm font-['Rajdhani'] font-medium text-white/70 tracking-wide uppercase">
              {stat.text}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================
// BENTO GRID CARD COMPONENT
// ============================================
function BentoCard({
  title,
  description,
  icon: Icon,
  className = "",
  children,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.215, 0.61, 0.355, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-[2rem] bg-[#15171E]/80 border border-white/5 p-8 group ${className} flex flex-col`}
    >
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-[#a855f7]/50 transition-all duration-300">
            <Icon
              className="w-7 h-7 text-white group-hover:text-[#a855f7] transition-colors"
              strokeWidth={1.5}
            />
          </div>

          <h3 className="text-2xl font-['Orbitron'] font-bold text-white mb-3 uppercase tracking-wide">
            {title}
          </h3>
          <p className="text-white/60 font-['Rajdhani'] text-base leading-relaxed mb-6">
            {description}
          </p>
        </div>

        <div className="mt-auto">{children}</div>
      </div>
    </motion.div>
  );
}

// ============================================
// INTERACTIVE COMPONENT CONTENT
// ============================================

// FIX 4: Updated Generic Quest Names
function AnimatedCheckmark() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.2 }}
          className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5"
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${i <= 2 ? "bg-green-500 text-black" : "bg-white/10"}`}
          >
            {i <= 2 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] font-bold"
              >
                ✓
              </motion.div>
            )}
          </div>
          <span
            className={`text-sm font-['Rajdhani'] ${i <= 2 ? "text-white" : "text-gray-500"} font-medium`}
          >
            {i === 1
              ? "Daily Objective Alpha"
              : i === 2
                ? "Side Quest: Focus"
                : "Weekly Challenge"}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function TierCard() {
  return (
    <motion.div
      whileHover={{ rotateY: 10, rotateX: -5 }}
      className="perspective-1000 transform-style-3d bg-gradient-to-br from-[#1a1a2e] to-black rounded-xl p-5 border border-yellow-500/30 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 blur-2xl rounded-full" />
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)]">
          <Crown className="w-6 h-6 text-black" />
        </div>
        <div>
          <p className="text-yellow-400 font-['Orbitron'] font-bold text-sm tracking-wider">
            GOLD TIER
          </p>
          <p className="text-white/60 text-xs font-['Rajdhani'] uppercase">
            Sector 4 • Rank #3
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-white/40 font-['Rajdhani'] uppercase">
          <span>Progress</span>
          <span>2.4k / 3k XP</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "85%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
          />
        </div>
      </div>
    </motion.div>
  );
}

function BadgeCollection() {
  const badges = [
    {
      icon: Flame,
      color: "from-orange-500 to-red-600",
      ring: "ring-orange-500/30",
    },
    {
      icon: Trophy,
      color: "from-yellow-400 to-amber-600",
      ring: "ring-yellow-500/30",
    },
    {
      icon: Target,
      color: "from-cyan-400 to-blue-600",
      ring: "ring-cyan-500/30",
    },
    {
      icon: Shield,
      color: "from-purple-500 to-fuchsia-600",
      ring: "ring-purple-500/30",
    },
  ];
  return (
    <div className="flex gap-3 mt-2">
      {badges.map((b, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ delay: i * 0.1, type: "spring" }}
          whileHover={{ y: -5, scale: 1.1 }}
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center shadow-lg ring-2 ${b.ring} ring-offset-2 ring-offset-[#15171E]`}
        >
          <b.icon className="w-6 h-6 text-white" />
        </motion.div>
      ))}
    </div>
  );
}

function SquadPulse() {
  return (
    <div className="flex items-center justify-center mt-6 h-12 relative">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-12 h-12 rounded-full bg-[#15171E] border-2 border-white/10 absolute flex items-center justify-center overflow-hidden"
          style={{ left: `calc(50% - ${(2 - i) * 20}px)`, zIndex: i }}
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.2 }}
        >
          <div
            className={`w-full h-full bg-gradient-to-br ${i === 0 ? "from-purple-500 to-blue-500" : i === 1 ? "from-blue-500 to-cyan-500" : "from-cyan-500 to-green-500"} opacity-80`}
          />
        </motion.div>
      ))}
      <div className="absolute right-12 top-0 bg-green-500 w-3 h-3 rounded-full border-2 border-[#15171E] animate-ping" />
    </div>
  );
}

// FIX 5: New Reward Examples Component for Bento
function RewardExamples() {
  const examples = [
    {
      text: "FREE COFFEE",
      color: "text-orange-400",
      border: "border-orange-400/30",
      bg: "bg-orange-400/10",
    },
    {
      text: "10% OFF GAMING",
      color: "text-purple-400",
      border: "border-purple-400/30",
      bg: "bg-purple-400/10",
    },
    {
      text: "GYM DAY PASS",
      color: "text-green-400",
      border: "border-green-400/30",
      bg: "bg-green-400/10",
    },
  ];
  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {examples.map((ex, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1, type: "spring" }}
          className={`px-3 py-1.5 rounded-lg border ${ex.border} ${ex.bg} ${ex.color} text-[10px] font-['Orbitron'] font-bold tracking-wider flex items-center gap-2`}
        >
          <Ticket className="w-3 h-3" />
          {ex.text}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// REWARD FLOATING ICON (Bottom Section)
// ============================================
function RewardIcon({ icon: Icon, label, colorHex }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 2,
      }}
      className="flex flex-col items-center gap-4 group"
    >
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center bg-[#15171E] border border-white/5 transition-all duration-500 group-hover:scale-110"
        style={{
          boxShadow: `0 0 0 1px ${colorHex}30, 0 0 40px ${colorHex}20`, // Subtle default glow
        }}
      >
        <div
          className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: `0 0 50px ${colorHex}60, inset 0 0 20px ${colorHex}40`, // Intense hover glow
          }}
        />
        <Icon
          size={40}
          style={{ color: colorHex }}
          className="relative z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        />
      </div>
      <span className="font-['Orbitron'] text-white/80 tracking-widest text-xs sm:text-sm uppercase group-hover:text-white transition-colors">
        {label}
      </span>
    </motion.div>
  );
}

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================
function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [show3D, setShow3D] = useState(false);

useEffect(() => {
  const id = setTimeout(() => setShow3D(true), 1200);
  return () => clearTimeout(id);
}, []);


  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      lenis.destroy();
      clearTimeout(timer);
    };
  }, []);

  const handleStart = () => {
    if (user) {
      navigate("/city-select");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white selection:bg-[#a855f7] selection:text-white overflow-x-hidden">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0f0f23] flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-[#a855f7] border-t-transparent shadow-[0_0_30px_#a855f7]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <main>
          {/* HERO SECTION */}
          <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Suspense fallback={null}>
                {show3D && <Landing3DScene />}
              </Suspense>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f23]/60 to-[#0f0f23] z-10 pointer-events-none" />

            {/* FIX 1: Added pt-24 for mobile top spacing, removed negative margin */}
            <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pt-24 md:pt-0">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8 inline-block"
              >
                <div className="flex items-center gap-3 px-5 py-2 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10 backdrop-blur-md text-[#a855f7] text-xs font-['Orbitron'] tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  LIVE QUESTS IN YOUR CITY
                </div>
              </motion.div>

              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-['Orbitron'] mb-6 leading-none tracking-tighter drop-shadow-2xl">
                <TextReveal
                  text="CONQUER"
                  delay={0.3}
                  className="block text-white"
                />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] via-[#d8b4fe] to-[#06b6d4]">
                  EARN TOGETHER.
                </span>
              </h1>

              <p className="text-gray-300 text-lg md:text-2xl max-w-2xl mx-auto mb-12 font-light font-['Rajdhani'] leading-relaxed">
                Create or join real-world group quests at cafés, gaming zones,
                and sports venues. Meet friends or verified strangers, complete
                the mission together, and unlock real rewards.
              </p>

              <div className="flex justify-center gap-4">
                <ShimmerButton onClick={handleStart}>
                  Find Quests Near You <ChevronRight className="w-4 h-4" />
                </ShimmerButton>
              </div>

              {/* Stats Footer */}
              <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-md mx-auto text-[11px] sm:text-xs font-['Rajdhani'] text-gray-400 uppercase tracking-widest opacity-80">
                <span>Group Meetups</span>
                <span className="opacity-40">•</span>
                <span>Cafés & Gaming</span>
                <span className="opacity-40">•</span>
                <span>XP → Rewards</span>
              </div>
            </div>
          </section>

          <LiveMarquee />

          {/* FEATURES SECTION (Bento Grid) */}
          <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-['Orbitron'] font-bold text-white mb-4 uppercase">
                Level Up Your <span className="text-[#a855f7]">Life</span>
              </h2>
              <p className="text-gray-400 font-['Rajdhani'] text-lg">
                We turn real-world meetups into verified quests with rewards,
                XP, and reputation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Daily Quests (Generic Text Updated) */}
              <BentoCard
                title="Daily Quests & Streaks"
                description="Forget to-do lists. We give you Missions. Complete tasks to earn XP and Coins. Maintain streaks to activate multipliers."
                icon={Target}
                className="lg:col-span-2"
                delay={0}
              >
                <AnimatedCheckmark />
              </BentoCard>

              {/* Card 2: Leaderboard */}
              <BentoCard
                title="City Dominance"
                description="Compete in your city's sector. Only the top 3 heroes earn the Golden Glitch border."
                icon={Trophy}
                className="lg:col-span-2"
                delay={0.1}
              >
                <TierCard />
              </BentoCard>

              {/* Card 3: Identity */}
              <BentoCard
                title="Digital Identity"
                description="Your ID Card is your trophy case. Display your rarest badges and reliability score."
                icon={Shield}
                delay={0.2}
              >
                <BadgeCollection />
              </BentoCard>

              {/* Card 4: Squads */}
              <BentoCard
                title="Squad Systems"
                description="Form parties with friends. Share quests, verify progress, and dominate leaderboards together."
                icon={Users}
                delay={0.3}
              >
                <SquadPulse />
              </BentoCard>

              {/* FIX 5: New Rewards Container in Bento */}
              <BentoCard
                title="Real-World Loot"
                description="Convert your sweat into sustenance. Complete quests to unlock exclusive real-life perks and discounts."
                icon={Gift}
                className="lg:col-span-4 md:col-span-2 bg-gradient-to-br from-[#a855f7]/20 to-purple-900/10"
                delay={0.4}
              >
                <RewardExamples />
              </BentoCard>
            </div>
          </section>

          {/* REWARDS SECTION (Bottom) */}
          <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0f0f23] to-[#0a0a1a] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#a855f7]/10 rounded-full blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-[128px]" />

            <div className="relative max-w-7xl mx-auto text-center">
              <div className="inline-block px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-['Orbitron'] tracking-widest mb-6">
                REAL-WORLD LOOT
              </div>
              <h2 className="text-4xl md:text-6xl font-['Orbitron'] font-black text-white mb-8">
                YOUR XP{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  PAYS OFF
                </span>
              </h2>
              <p className="text-gray-400 font-['Rajdhani'] text-xl max-w-2xl mx-auto mb-20">
                Exchange Quest Points for vouchers at your favorite local spots.
                Your productivity now has real value.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 justify-items-center">
                <RewardIcon icon={Coffee} label="Cafés" colorHex="#ea580c" />
                <RewardIcon icon={Gamepad2} label="Gaming" colorHex="#a855f7" />
                <RewardIcon icon={BookOpen} label="Books" colorHex="#06b6d4" />
                <RewardIcon icon={Dumbbell} label="Sports" colorHex="#10b981" />
              </div>

              <div className="mt-20">
                {/* FIX 3: Button now calls handleStart */}
                <button
                  onClick={handleStart}
                  className="px-10 py-4 rounded-full font-['Orbitron'] font-bold bg-white text-[#0f0f23] hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  Explore Rewards
                </button>
              </div>
            </div>
          </section>

          <Footer />
        </main>
      )}
    </div>
  );
}

// ============================================
// FIX 2: NEW ATTRACTIVE FOOTER COMPONENT
// ============================================
function Footer() {
  return (
    <footer className="py-16 border-t border-white/10 bg-[#050505] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#a855f7]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#06b6d4] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <Sword className="w-5 h-5 text-white" />
            </div>
            <span className="font-['Orbitron'] font-bold tracking-widest text-xl text-white">
              SQUAD QUEST
            </span>
          </div>
          <p className="text-gray-400 font-['Rajdhani'] mb-6 max-w-sm leading-relaxed">
            The ultimate gamified productivity platform. Turn your life into an
            RPG, compete with friends, and earn real-world rewards.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#a855f7]/20 hover:text-white transition-all group"
            >
              <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#a855f7]/20 hover:text-white transition-all group"
            >
              <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#a855f7]/20 hover:text-white transition-all group"
            >
              <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div>
          <h4 className="font-['Orbitron'] font-bold text-white mb-6 uppercase tracking-wider">
            Quick Links
          </h4>
          <ul className="space-y-3 font-['Rajdhani'] text-gray-400">
            <li>
              <a
                href="#"
                className="hover:text-[#a855f7] transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 text-[#a855f7]" />
                Features
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-[#a855f7] transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 text-[#a855f7]" />
                Rewards
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-[#a855f7] transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 text-[#a855f7]" />
                Leaderboard
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-[#a855f7] transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 text-[#a855f7]" />
                About Us
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter Column (Visual Only) */}
        <div>
          <h4 className="font-['Orbitron'] font-bold text-white mb-6 uppercase tracking-wider">
            Join The Squad
          </h4>
          <p className="text-gray-400 font-['Rajdhani'] mb-4 text-sm">
            Subscribe for updates, new quests, and exclusive reward drops.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Enter email address"
              className="bg-white/5 border border-white/10 rounded-l-xl px-4 py-3 text-sm font-['Rajdhani'] text-white focus:outline-none focus:border-[#a855f7]/50 w-full"
            />
            <button className="bg-[#a855f7] hover:bg-[#9333ea] transition-colors rounded-r-xl px-4 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-16 pt-8 border-t border-white/5 text-center relative z-10">
        <p className="text-white/30 font-['Rajdhani'] text-xs uppercase tracking-[0.2em]">
          © 2026 SQUAD QUEST. All Systems Operational. Terminals Active.
        </p>
      </div>
    </footer>
  );
}

export default LandingPage;
