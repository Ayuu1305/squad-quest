import React, { useRef, useState, useEffect, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  MeshDistortMaterial,
  Float,
  Stars,
} from "@react-three/drei";
import {
  Trophy,
  Target,
  Map,
  Zap,
  ChevronRight,
  Users,
  Shield,
  Crown,
  Flame,
  Gift,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";

// --- 3D COMPONENTS ---

const CyberCore = () => {
  const meshRef = useRef(null);
  const { viewport } = useThree();

  // Responsive Scale: Smaller on mobile (viewport.width < 5)
  const scale = viewport.width < 5 ? 1.8 : 2.6;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.4;
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={meshRef} scale={scale}>
        <icosahedronGeometry args={[1, 64]} />
        <MeshDistortMaterial
          color="#a855f7"
          emissive="#4c1d95"
          emissiveIntensity={0.6}
          attach="material"
          distort={0.5}
          speed={3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
};

const Scene = () => {
  return (
    <Canvas className="absolute inset-0 z-0" camera={{ position: [0, 0, 6] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#a855f7" />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#06b6d4" />
      <spotLight position={[0, 10, 0]} intensity={1} color="#ffffff" />
      <Suspense fallback={null}>
        <CyberCore />
        <Stars
          radius={300}
          depth={50}
          count={5000}
          factor={4}
          saturation={1}
          fade
          speed={1.5}
        />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
};

// --- UI COMPONENTS ---

const FeatureCard = ({ icon: Icon, title, desc, delay, color = "purple" }) => {
  const colorStyles = {
    purple: {
      bg: "bg-purple-500/10",
      text: "text-[#a855f7]",
      glow: "bg-purple-500/20",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      glow: "bg-cyan-500/20",
    },
    yellow: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      glow: "bg-yellow-500/20",
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      glow: "bg-green-500/20",
    },
    pink: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      glow: "bg-pink-500/20",
    },
  };

  const style = colorStyles[color] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="relative p-6 sm:p-8 rounded-3xl bg-[#15171E] border border-white/10 backdrop-blur-sm overflow-hidden group hover:border-white/20 transition-colors"
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${style.glow} rounded-full blur-3xl -mr-16 -mt-16 transition-all opacity-0 group-hover:opacity-100`}
      />

      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${style.bg} flex items-center justify-center mb-4 sm:mb-6 ${style.text} group-hover:scale-110 transition-transform duration-300 border border-white/5`}
      >
        <Icon size={24} className="sm:w-7 sm:h-7" strokeWidth={1.5} />
      </div>

      <h3 className="text-xl sm:text-2xl font-black font-['Orbitron'] mb-2 sm:mb-3 text-white uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed font-light text-sm sm:text-base">
        {desc}
      </p>
    </motion.div>
  );
};

const LandingPage = () => {
  const { user } = useAuth();
  const { city } = useGame();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const handleGetStarted = () => {
    if (user) {
      if (city) {
        navigate("/board");
      } else {
        navigate("/city-select");
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white font-sans overflow-x-hidden selection:bg-[#a855f7] selection:text-white">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#a855f7] to-cyan-500 origin-left z-50 shadow-[0_0_10px_#a855f7]"
        style={{ scaleX }}
      />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-10 sm:py-0">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0 opacity-80">
          <Scene />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f23]/40 to-[#0f0f23] z-0 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto">
          <motion.h1
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black font-['Orbitron'] tracking-tighter leading-[0.9] mb-6 sm:mb-8 drop-shadow-2xl"
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            CONQUER <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] via-[#d8b4fe] to-[#06b6d4] animate-pulse-slow">
              YOUR REALITY
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-xl md:text-2xl text-gray-300 max-w-xl sm:max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed font-light tracking-wide px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            The world is an open-world RPG. We just built the HUD.
            <br className="hidden sm:block" />
            <span className="text-[#a855f7] font-bold block sm:inline mt-2 sm:mt-0">
              Quest. Compete. Ascend.
            </span>
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto group relative px-8 py-4 sm:px-10 sm:py-5 bg-white text-[#0f0f23] font-black uppercase text-base sm:text-lg tracking-widest rounded-2xl overflow-hidden hover:scale-105 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7] to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center justify-center gap-3">
                <span>{user ? "Enter The Realm" : "Start Journey"}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {!user && (
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-5 rounded-2xl border border-white/10 hover:bg-white/5 font-bold uppercase text-base sm:text-lg tracking-widest transition-colors backdrop-blur-sm text-gray-300 hover:text-white text-center"
              >
                Login
              </Link>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator (Hidden on small mobile to save space) */}
        <motion.div
          className="hidden sm:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-50"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-px h-16 bg-gradient-to-b from-[#a855f7] to-transparent" />
        </motion.div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="relative py-16 sm:py-32 px-4 sm:px-6 container mx-auto z-10">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-['Orbitron'] font-black uppercase mb-4 sm:mb-6 leading-tight">
            Level Up Your <span className="text-[#a855f7]">Legacy</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-lg font-light px-2">
            Every action counts. Turn your daily grind into XP, dominate your
            city's leaderboard, and build a profile that commands respect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <FeatureCard
              icon={Target}
              title="Daily Quests & Streaks"
              desc="Forget boring to-do lists. Complete Missions to earn XP. Maintain your daily streak to activate multipliers and unlock elite status and getting exclusive rewards."
              delay={0.1}
              color="cyan"
            />
          </div>
          <FeatureCard
            icon={Trophy}
            title="City Dominance"
            desc="You aren't just leveling up alone. Compete against real people in your city (Ahmedabad, Mumbai, etc). Will you claim the Golden Crown?"
            delay={0.2}
            color="yellow"
          />
          <FeatureCard
            icon={Map}
            title="Hero's Journey"
            desc="Visualize your progress on an interactive map. Every level up unlocks new chapters in your personal saga."
            delay={0.3}
            color="green"
          />
          <div className="lg:col-span-2">
            <FeatureCard
              icon={Shield}
              title="Digital Identity"
              desc="Your ID Card is your trophy case. Customize your Avatar with rare animated borders, display your earned badges, and prove your reliability score to the squad."
              delay={0.4}
              color="purple"
            />
          </div>
          {/* Feature 5: Rewards (Full Width) */}
          <div className="md:col-span-2 lg:col-span-3">
            <FeatureCard
              icon={Gift}
              title="Real-World Rewards"
              desc="Your grind pays off IRL. Exchange Quest Points for exclusive vouchers at your favorite Cafés, Gaming Lounges, Sports Turfs, and Educational Hubs."
              delay={0.5}
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* --- PREVIEW SECTION (Mobile Optimized) --- */}
      <section className="py-16 sm:py-32 relative overflow-hidden bg-[#0f0f23]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] to-transparent opacity-80 pointer-events-none" />

        {/* Changed layout to stack on mobile (flex-col) and row on desktop (lg:flex-row) */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-left w-full">
            <div className="inline-flex items-center gap-2 text-[#a855f7] font-mono text-xs sm:text-sm mb-4 border border-[#a855f7]/30 px-3 py-1 rounded-full bg-[#a855f7]/10">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              <span>LIVE SYSTEM</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-['Orbitron'] font-black uppercase mb-6 leading-tight">
              Prove Your <br />{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Worth
              </span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-8 leading-relaxed">
              Join a network of ambitious heroes. Track your stats, compare your
              power levels, and see exactly where you stand in the hierarchy.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#15171E] border border-white/10 hover:border-[#a855f7]/50 transition-colors">
                <div className="text-2xl sm:text-3xl font-black text-white mb-1">
                  1.2k+
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                  Active Heroes
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-[#15171E] border border-white/10 hover:border-cyan-500/50 transition-colors">
                <div className="text-2xl sm:text-3xl font-black text-white mb-1">
                  Lv. 99
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                  Max Ascension
                </div>
              </div>
            </div>
          </div>

          {/* Visual Mockup */}
          <div className="flex-1 w-full max-w-lg relative mt-8 lg:mt-0">
            <div className="absolute inset-0 bg-[#a855f7]/20 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />

            <motion.div
              className="relative bg-[#15171E] border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl overflow-hidden"
              initial={{ rotateY: 0, rotateX: 0 }}
              whileInView={{ rotateY: 10, rotateX: 5 }}
              transition={{ type: "spring", stiffness: 50 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#a855f7] to-cyan-500 p-1">
                    <div className="w-full h-full bg-[#15171E] rounded-full" />
                  </div>
                  <div>
                    <div className="h-3 sm:h-4 w-24 sm:w-32 bg-white/20 rounded-full mb-2" />
                    <div className="h-2 sm:h-3 w-16 sm:w-20 bg-white/10 rounded-full" />
                  </div>
                </div>
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-black uppercase flex items-center gap-2">
                  <Crown className="w-3 h-3 fill-current" />
                  Gold Tier
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="h-2 sm:h-3 w-20 sm:w-24 bg-white/10 rounded-full" />
                  <div className="h-2 w-8 sm:w-12 bg-green-500/50 rounded-full" />
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="h-2 sm:h-3 w-32 sm:w-40 bg-white/10 rounded-full" />
                  <div className="h-2 w-8 sm:w-12 bg-purple-500/50 rounded-full" />
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20">
                  <div className="flex items-center gap-3">
                    <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-[#a855f7]" />
                    <div className="h-2 sm:h-3 w-16 sm:w-24 bg-[#a855f7]/40 rounded-full" />
                  </div>
                  <div className="h-2 sm:h-3 w-6 sm:w-8 bg-[#a855f7]/40 rounded-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-20 sm:py-32 text-center relative z-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-['Orbitron'] font-black uppercase mb-6 sm:mb-8 leading-tight">
            Ready to <span className="text-[#a855f7]">Ascend?</span>
          </h2>
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-white text-[#0f0f23] font-black text-lg sm:text-xl uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-[0_0_50px_rgba(168,85,247,0.3)]"
          >
            Join the Squad
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-white/5 text-center text-gray-600 text-[10px] sm:text-xs relative z-10 bg-[#050505]">
        <p className="tracking-[0.2em] uppercase">
          &copy; 2026 SQUAD QUEST. All Systems Operational.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
