import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Coffee, Camera, Trophy, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { completeOnboarding } from "../backend/services/user.service";

const OnboardingModal = () => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  const slides = [
    {
      id: 1,
      icon: (
        <div className="flex items-center gap-4 justify-center">
          <MapPin className="w-12 h-12 text-neon-purple" />
          <Coffee className="w-12 h-12 text-neon-purple" />
        </div>
      ),
      headline: "Save Money at Local Places",
      body: "Choose a coffee shop, gaming cafe, or sports club. Visit with friends and get instant discounts (Free Coffee, 10% OFF).",
      buttonText: "Next: How?",
    },
    {
      id: 2,
      icon: <Camera className="w-12 h-12 text-neon-purple" />,
      headline: "Quick Check-In",
      body: "Take 2 minutes to prove you're there: Share your location + Upload a photo = Discount unlocked!",
      buttonText: "Next: Rewards",
    },
    {
      id: 3,
      icon: <Trophy className="w-12 h-12 text-neon-purple" />,
      headline: "Earn Points & Rankings",
      body: "Every visit earns you XP points. Compete with friends on the leaderboard. Top players get exclusive perks and badges!",
      buttonText: `Welcome, ${user?.displayName || "Hero"}!`,
    },
  ];

  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Final slide - Complete onboarding
      setLoading(true);
      try {
        await completeOnboarding(user.uid);
        // The modal will automatically close when AuthContext updates
      } catch (error) {
        console.error("Failed to complete onboarding:", error);
        setLoading(false);
      }
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-bg border-2 border-neon-purple/50 rounded-3xl p-8 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
      >
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple blur-[80px] opacity-20" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neon-purple blur-[80px] opacity-20" />

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-neon-purple"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Slide Content */}
        <div className="relative h-[400px]">
          <AnimatePresence initial={false} custom={1} mode="wait">
            <motion.div
              key={currentSlide}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              {/* Icon */}
              <div className="w-24 h-24 bg-neon-purple/20 rounded-full flex items-center justify-center mb-6 border border-neon-purple/50">
                {slides[currentSlide].icon}
              </div>

              {/* Headline */}
              <h2 className="text-3xl font-black font-['Orbitron'] text-white italic tracking-wider mb-4 px-4">
                {slides[currentSlide].headline}
              </h2>

              {/* Body */}
              <p className="text-gray-300 text-base leading-relaxed px-6 max-w-md">
                {slides[currentSlide].body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Button */}
        <button
          onClick={handleNext}
          disabled={loading}
          className={`w-full py-4 rounded-xl font-['Orbitron'] font-black italic tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
            loading
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-neon-purple text-white hover:bg-neon-purple/80 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
          }`}
        >
          {loading ? (
            "Loading..."
          ) : (
            <>
              {slides[currentSlide].buttonText}
              {currentSlide < slides.length - 1 && (
                <ChevronRight className="w-5 h-5" />
              )}
            </>
          )}
        </button>

        {/* Slide Counter */}
        <div className="text-center mt-4 text-gray-500 text-xs font-mono uppercase tracking-widest">
          {currentSlide + 1} / {slides.length}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
