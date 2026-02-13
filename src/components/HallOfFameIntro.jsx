import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../backend/firebaseConfig";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import HeroAvatar from "./HeroAvatar";
import Confetti from "react-confetti";

import { useAuth } from "../context/AuthContext";
import { safeLocalStorage } from "../utils/safeStorage";

const HallOfFameIntro = ({ onComplete }) => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0: Loading, 1: Intro Text, 2: Reveal, 3: Completed
  const { user } = useAuth();

  useEffect(() => {
    const fetchWinners = async () => {
      if (!user || !user.uid) return;

      try {
        const hofRef = collection(db, "hall_of_fame");
        const q = query(hofRef, orderBy("processedAt", "desc"), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setWinners(snapshot.docs[0].data().winners || []);
          setLoading(false);
          setTimeout(() => setStep(1), 500);
        } else {
          onComplete();
        }
      } catch (err) {
        console.warn("HoF Fetch failed (likely permission/AppCheck):", err);
        // Fail gracefully -> skip intro
        onComplete();
      }
    };

    fetchWinners();
  }, [onComplete, user]);

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => setStep(2), 3000); // Show "A New Legend Rises" for 3s
    } else if (step === 3) {
      // Component is closing, call onComplete to update parent
      onComplete();
    }
  }, [step, onComplete]);

  const handleComplete = async () => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      // Save to Firestore
      await setDoc(
        doc(db, "users", user.uid),
        { hasSeenHallOfFameIntro: true },
        { merge: true },
      );

      // Save to localStorage
      safeLocalStorage.setItem(
        "hof_intro_seen",
        JSON.stringify({ uid: user.uid, timestamp: Date.now() }),
      );

      console.log("✅ Hall of Fame intro completed");
      setStep(3); // Trigger onComplete via useEffect
    } catch (error) {
      console.error("Failed to save HoF completion:", error);
      setStep(3); // Continue anyway
    }
  };

  if (loading) return null;

  return (
    <AnimatePresence>
      {step < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {step === 2 && <Confetti numberOfPieces={200} recycle={false} />}

          {/* STEP 1: TYPOGRAPHY INTRO */}
          {step === 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-6xl md:text-8xl font-['Orbitron'] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 italic tracking-tighter uppercase mb-4 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                HISTORY
              </h1>
              <h1 className="text-4xl md:text-6xl font-['Orbitron'] font-black text-white italic tracking-widest uppercase mb-8">
                HAS BEEN WRITTEN
              </h1>
              <div className="h-1 w-32 bg-neon-purple mx-auto rounded-full animate-pulse" />
            </motion.div>
          )}

          {/* STEP 2: THE REVEAL */}
          {step === 2 && (
            <div className="relative w-full max-w-4xl px-4 text-center">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-12"
              >
                <div className="inline-block px-6 py-2 bg-white/5 rounded-full border border-white/10 mb-6 backdrop-blur-md">
                  <span className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">
                    The Ahmedabad Legends
                  </span>
                </div>
              </motion.div>

              <div className="flex flex-col md:flex-row items-end justify-center gap-8 md:gap-12 pb-12">
                {/* RANK 2 */}
                {winners[1] && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2, type: "spring" }}
                    className="flex flex-col items-center order-2 md:order-1"
                  >
                    <div className="relative mb-4">
                      <HeroAvatar
                        seed={winners[1].avatar}
                        tierName="Gold"
                        size={100}
                        aura="blue"
                      />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-black">
                        #2
                      </div>
                    </div>
                    <h3 className="text-white font-black uppercase tracking-wider text-sm">
                      {winners[1].name}
                    </h3>
                    <p className="text-blue-400 text-xs font-mono">
                      {winners[1].xp} XP
                    </p>
                  </motion.div>
                )}

                {/* RANK 1 */}
                {winners[0] && (
                  <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1.2 }}
                    transition={{ delay: 1.8, type: "spring", bounce: 0.5 }}
                    className="flex flex-col items-center order-1 md:order-2 z-10 -mt-12 md:mt-0"
                  >
                    <div className="relative mb-6">
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                        👑
                      </div>
                      <HeroAvatar
                        seed={winners[0].avatar}
                        tierName="Legendary"
                        size={120}
                        aura="mythic"
                      />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-600 text-white text-sm font-black px-4 py-1.5 rounded-full border-2 border-black shadow-lg shadow-orange-500/50">
                        #1 LEGEND
                      </div>
                    </div>
                    <h3 className="text-2xl font-['Orbitron'] font-black uppercase italic text-yellow-400 drop-shadow-md">
                      {winners[0].name}
                    </h3>
                    <p className="text-gray-400 text-xs font-mono tracking-[0.2em]">
                      WEEKLY CHAMPION
                    </p>
                  </motion.div>
                )}

                {/* RANK 3 */}
                {winners[2] && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5, type: "spring" }}
                    className="flex flex-col items-center order-3"
                  >
                    <div className="relative mb-4">
                      <HeroAvatar
                        seed={winners[2].avatar}
                        tierName="Silver"
                        size={100}
                        aura="silver"
                      />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-500 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-black">
                        #3
                      </div>
                    </div>
                    <h3 className="text-white font-black uppercase tracking-wider text-sm">
                      {winners[2].name}
                    </h3>
                    <p className="text-gray-400 text-xs font-mono">
                      {winners[2].xp} XP
                    </p>
                  </motion.div>
                )}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                onClick={handleComplete}
                className="mt-12 px-8 py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-full hover:bg-gray-200 transition-colors"
              >
                Enter The Arena
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HallOfFameIntro;
