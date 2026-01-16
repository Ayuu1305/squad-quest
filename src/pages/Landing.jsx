import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  MapPin,
  ChevronRight,
  Zap,
  Trophy,
  Users,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { updateHeroProfile } from "../backend/firebaseService";

const Landing = () => {
  const navigate = useNavigate();
  const { selectCity } = useGame();
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const cities = [
    { name: "Ahmedabad", status: "Active Sector", heroes: "1.2k" },
    { name: "Mumbai", status: "Coming Soon", heroes: "0" },
    { name: "Delhi", status: "Coming Soon", heroes: "0" },
  ];

  const [comingSoonCity, setComingSoonCity] = useState(null);

  const handleCitySelect = async (cityName) => {
    if (cityName === "Ahmedabad") {
      try {
        setIsAnimating(true);
        setSelectedCity(cityName);
        if (user) {
          await updateHeroProfile(user.uid, { city: cityName });
        }
        selectCity(cityName);
        navigate("/board");
      } catch (error) {
        console.error("Failed to update realm:", error);
        setIsAnimating(false);
        setSelectedCity(null);
      }
    } else {
      setComingSoonCity(cityName);
      setTimeout(() => setComingSoonCity(null), 3000);
    }
  };

  return (
    <div className="app-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-neon-purple rounded-full"
            initial={{
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: -20,
            }}
            animate={{
              opacity: [0, 1, 0],
              y: window.innerHeight + 20,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glassmorphism-dark rounded-2xl p-8 text-center">
          {/* Logo */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <Sparkles className="w-20 h-20 mx-auto text-neon-purple" />
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl font-['Orbitron'] font-bold mb-2 neon-text">
            SQUAD QUEST
          </h1>
          <p className="text-gray-400 mb-8">Where Online Meets Offline</p>

          {/* City Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-neon-purple" />
              <h2 className="text-xl font-semibold">Select Your Realm</h2>
            </div>

            <div className="space-y-3">
              {cities.map((city) => (
                <motion.button
                  key={city.name}
                  onClick={() => handleCitySelect(city.name)}
                  className={`w-full p-4 rounded-xl transition-all duration-300 relative overflow-hidden group border ${
                    selectedCity === city.name
                      ? "bg-neon-purple/20 border-neon-purple text-white neon-glow"
                      : city.status === "Coming Soon"
                      ? "bg-black/40 border-white/5 text-gray-600 grayscale cursor-not-allowed opacity-60"
                      : "glassmorphism border-white/10 hover:border-neon-purple/50 text-gray-300"
                  }`}
                  whileHover={
                    city.status !== "Coming Soon" ? { scale: 1.02 } : {}
                  }
                  whileTap={
                    city.status !== "Coming Soon" ? { scale: 0.98 } : {}
                  }
                  disabled={isAnimating}
                >
                  <div className="flex items-center justify-between relative z-10 text-left">
                    <div>
                      <span className="text-lg font-black font-['Orbitron'] uppercase italic tracking-tighter block">
                        {city.name}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${
                          city.status === "Active Sector"
                            ? "text-neon-purple"
                            : "text-gray-600"
                        }`}
                      >
                        {city.status}
                      </span>
                    </div>
                    {city.status === "Active Sector" ? (
                      <ChevronRight className="w-5 h-5 text-neon-purple group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-700" />
                    )}
                  </div>
                  {city.status === "Active Sector" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Coming Soon Alert */}
          <AnimatePresence>
            {comingSoonCity && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-6 p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-2xl flex items-center gap-3 text-left"
              >
                <div className="bg-neon-purple/20 p-2 rounded-lg">
                  <Lock className="w-5 h-5 text-neon-purple" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-neon-purple tracking-widest">
                    Sector Encrypted
                  </div>
                  <div className="text-xs text-gray-300 font-medium">
                    {comingSoonCity} will open in the upcoming days. Ahmedabad
                    is currently the only active Sector.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tagline */}
          <p className="text-sm text-gray-500 mt-6">
            Real adventures. Real people. Real XP.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
