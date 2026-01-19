import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Award, Share2, PartyPopper, Gem } from "lucide-react";
import VibeReview from "../components/VibeReview";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import AscensionNotification from "../components/AscensionNotification";
import { getTier, checkBadgeUnlock } from "../utils/xp";
import {
  awardXP,
  subscribeToQuest,
  submitVibeChecks,
} from "../backend/firebaseService";

const Review = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [quest, setQuest] = useState(null);
  const [squadToReview, setSquadToReview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("completion");
  const [squadReviews, setSquadReviews] = useState({});
  const [ascension, setAscension] = useState(null); // { name, tier }

  const lootData = location.state?.lootData || {
    xp: 150,
    vibe: "Good",
    hasPhoto: false,
  };

  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToQuest(id, async (updatedQuest) => {
      setQuest(updatedQuest);

      const members = updatedQuest.members || [];
      const others = members.filter((uid) => uid !== user.uid);
      const hasReviewed = updatedQuest.reviewedBy?.includes(user.uid);

      if (others.length > 0 && !hasReviewed) {
        const squadData = await Promise.all(
          others.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            return userDoc.exists()
              ? { id: uid, ...userDoc.data() }
              : { id: uid, name: `Hero_${uid.slice(0, 4)}` };
          }),
        );
        setSquadToReview(squadData);
        setStep("review");
      } else {
        // No one to review, go back to where we came from
        navigate(-1);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [id, user.uid]);

  if (loading) return null;
  if (!quest) return null;

  const handleReviewComplete = async (reviews) => {
    setSquadReviews(reviews);

    // ✅ Call secure backend API to submit vibe checks
    try {
      const result = await submitVibeChecks(id, reviews);
      console.log("✅ Vibe Check submitted:", result);
    } catch (error) {
      console.error("❌ Vibe Check failed:", error);
      // Continue anyway - the user can still navigate
    }

    // Mark quest as reviewed by this user
    try {
      const questRef = doc(db, "quests", id);
      await updateDoc(questRef, {
        reviewedBy: arrayUnion(user.uid),
      });
    } catch (error) {
      console.warn("Review marker suppressed by rules or error:", error);
    }

    // Direct navigation
    navigate("/board");
  };

  const handleFinalize = () => {
    navigate(-1);
  };

  return (
    <div className="app-container min-h-screen py-12 px-6 flex flex-col items-center bg-dark-bg">
      <AnimatePresence mode="wait">
        {step === "review" ? (
          <motion.div
            key="review-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-['Orbitron'] font-black text-white mb-2 italic tracking-tighter uppercase">
                Vibe Analysis
              </h1>
              <p className="text-gray-500 text-[10px] uppercase font-black font-mono tracking-[0.3em]">
                Protocol: Rate Hero Energy
              </p>
            </div>

            <VibeReview
              squad={squadToReview}
              onComplete={handleReviewComplete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="completion-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center"
          >
            <div className="mb-8">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
                <PartyPopper className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-4xl font-['Orbitron'] font-black text-white italic tracking-tighter mb-2">
                MISSION SYNCED
              </h1>
              <p className="text-gray-500 uppercase font-black font-mono tracking-widest text-[9px]">
                Quest Secure: {quest.title}
              </p>
            </div>

            <div className="glassmorphism-dark rounded-3xl p-8 border border-white/5 bg-gradient-to-br from-white/5 to-transparent mb-8 space-y-6">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">
                      XP GAINED
                    </div>
                    <div className="text-3xl font-black font-mono text-white">
                      {Number(lootData.xp) ||
                        (Number(quest.difficulty) || 1) * 100}
                      <span className="text-neon-purple text-xs ml-1 font-bold">
                        XP
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">
                      Squad Sync
                    </div>
                    <div className="text-3xl font-black font-mono text-green-400 italic">
                      1.2x
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-left">
                  <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-black mb-1 flex items-center gap-2">
                    <Gem className="w-3 h-3" /> UNLOCKED LOOT
                  </div>
                  <div className="text-xl font-black italic text-white">
                    {quest.loot || "Rare Hub Token"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">
                  Karma Accumulation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neon-purple/5 border border-neon-purple/20 p-4 rounded-xl flex flex-col items-center gap-1">
                    <Zap className="w-5 h-5 text-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
                    <span className="text-[9px] font-black text-white uppercase tracking-tighter text-center">
                      Reliability +1%
                    </span>
                  </div>
                  <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl flex flex-col items-center gap-1">
                    <Award className="w-5 h-5 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]" />
                    <span className="text-[9px] font-black text-white uppercase tracking-tighter text-center">
                      Vibe Master +12
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="w-full btn-primary py-5 text-lg font-black italic tracking-[0.2em] shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-3 group"
            >
              RETURN TO HUB
              <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ascension && (
          <AscensionNotification
            badgeName={ascension.name}
            tier={ascension.tier}
            onComplete={() => setAscension(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Review;
