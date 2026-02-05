import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MissionAccomplished from "../components/MissionAccomplished";
import VerificationEngine from "../components/VerificationEngine";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToQuest,
  finalizeQuest,
  saveQuestVerification,
} from "../backend/services/quest.service";
import { syncHubLocation } from "../backend/services/user.service";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { isShowdownActive } from "../utils/showdownUtils";
import VibeReview from "../components/VibeReview";

const Verification = () => {
  const { id } = useParams(); // questId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quest, setQuest] = useState(null);
  const [hub, setHub] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isVerifying, setIsVerifying] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showSoloMessage, setShowSoloMessage] = useState(false);
  const [squadMembers, setSquadMembers] = useState([]);
  const [reviewSquad, setReviewSquad] = useState([]);
  const [lootData, setLootData] = useState(null);

  // ✅ stop double submit spam
  const didCompleteRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    let unsubHub = null;

    const unsubQuest = subscribeToQuest(id, (updatedQuest) => {
      setQuest(updatedQuest);

      if (unsubHub) {
        unsubHub();
        unsubHub = null;
      }

      if (updatedQuest?.hubId) {
        unsubHub = onSnapshot(
          doc(db, "hubs", updatedQuest.hubId),
          (snap) => {
            setHub(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            setLoading(false);
          },
          (err) => {
            console.error("Hub fetch error:", err);
            setLoading(false);
          },
        );
        return;
      }

      if (updatedQuest?.hubName) {
        const hubsRef = collection(db, "hubs");
        const q = query(hubsRef, where("name", "==", updatedQuest.hubName));
        unsubHub = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const h = snapshot.docs[0];
              setHub({ id: h.id, ...h.data() });
            } else {
              setHub(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Hub query error:", err);
            setLoading(false);
          },
        );
        return;
      }

      setHub(null);
      setLoading(false);
    });

    return () => {
      if (unsubHub) unsubHub();
      unsubQuest();
    };
  }, [id]);

  // Subscribe to Members Subcollection
  useEffect(() => {
    if (!id) return;
    const membersRef = collection(db, "quests", id, "members");
    const unsubMembers = onSnapshot(membersRef, (snapshot) => {
      const members = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("[DEBUG] Members subcollection updated:", members);
      setSquadMembers(members);
    });
    return () => unsubMembers();
  }, [id]);

  // Fetch Full Profile Data for Review (Filtering Self)
  useEffect(() => {
    // If we have more than just the current user
    if (squadMembers.length > 1 && user?.uid) {
      const fetchSquadData = async () => {
        const others = squadMembers.filter((m) => m.id !== user.uid);
        console.log("[DEBUG] Others detected for review:", others);

        try {
          const promises = others.map((m) => getDoc(doc(db, "users", m.id)));
          const snaps = await Promise.all(promises);
          const squadData = snaps
            .map((snap) => {
              if (!snap.exists()) return null;
              const data = snap.data();
              return {
                id: snap.id,
                name: data.name || "Unknown Agent",
                avatar:
                  data.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${snap.id}`,
                level: data.level || 1,
              };
            })
            .filter(Boolean);

          console.log("[DEBUG] Review Squad Data Fetched:", squadData);
          setReviewSquad(squadData);
        } catch (err) {
          console.error("Squad profiling error:", err);
        }
      };
      fetchSquadData();
    } else if (squadMembers.length === 1) {
      console.log("[DEBUG] Solo mission detected via subcollection.");
      setReviewSquad([]);
    }
  }, [squadMembers, user?.uid]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Session expired. Please login again.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn-primary px-6 py-3"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!quest || !hub) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Quest or Hub Link Broken</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary px-6 py-3"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const handleVerificationComplete = async (photoData) => {
    if (didCompleteRef.current) return; // ✅ block duplicates
    didCompleteRef.current = true;

    const hasPhoto = !!photoData;

    // timing logic
    const startTime = quest.startTime?.toDate
      ? quest.startTime.toDate()
      : new Date(quest.startTime);

    const now = new Date();
    const timeDiffMins = Math.abs(now - startTime) / (1000 * 60);
    const isOnTime = timeDiffMins <= 5;

    let earnedXP = 100;
    if (isOnTime) earnedXP += 25;

    const isLeader = quest?.partyLeader === user?.uid;
    const memberCount = squadMembers.length; // ✅ Use real-time subcollection count

    if (hasPhoto) {
      earnedXP += 20;
      if (isLeader) earnedXP += Math.max(0, memberCount - 1) * 10;
    } else {
      earnedXP = 0;
    }

    const showdown = isShowdownActive();
    const finalUIXP = showdown ? earnedXP * 2 : earnedXP;
    console.log("AUTH UID:", user?.uid);

    try {
      // ✅ 1) Save verification + mark quest completedBy
      await saveQuestVerification(id, user.uid, {
        locationVerified: true,
        codeVerified: true,
        photoURL: hasPhoto ? photoData : "",
      });

      // ✅ 2) call backend finalize (optional but recommended)
      try {
        await finalizeQuest(id, {
          locationVerified: true,
          codeVerified: true,
          photoURL: hasPhoto ? photoData : "",
        });
      } catch (e) {
        console.warn("finalizeQuest API failed (can ignore in dev):", e);
      }

      // ✅ 3) UI celebration
      setLootData({
        xp: finalUIXP,
        vibe: quest.vibeCheck || "Neutral",
        hasPhoto,
        wasShowdown: showdown,
      });

      setIsVerifying(false);
      setShowCelebration(true);
    } catch (error) {
      didCompleteRef.current = false; // allow retry
      console.error("Verification complete failed:", error);
      alert(error.message || "Verification failed. Please try again.");
    }
  };

  const finishQuest = () => {
    // ✅ always go to board
    navigate("/board");
  };

  const handleMissionClose = () => {
    console.log(
      "[DEBUG] Mission Close Triggered. Review Squad Size:",
      reviewSquad.length,
    );
    if (reviewSquad.length > 0) {
      setShowCelebration(false);
      setShowReview(true);
    } else {
      console.log("[DEBUG] Solo Mission. Showing message.");
      setShowCelebration(false);
      setShowSoloMessage(true);
    }
  };

  const handleReviewComplete = async (data) => {
    // Handle both old format (array) and new format (object)
    const reviews = data?.reviews || data;
    const genderMismatchReports = data?.genderMismatchReports || [];

    console.log("Vibe Checks Submitted:", reviews);
    console.log("Gender Mismatch Reports:", genderMismatchReports);

    // ✅ Send to backend API
    try {
      const { submitVibeChecks } =
        await import("../backend/services/quest.service");
      const result = await submitVibeChecks(id, reviews, genderMismatchReports);
      console.log("✅ Vibe Check API success:", result);
    } catch (error) {
      console.error("❌ Vibe Check API failed:", error);
      // Continue anyway - don't block the user
    }

    finishQuest();
  };

  return (
    <div className="app-container min-h-screen pt-12 p-4 flex flex-col items-center bg-dark-bg">
      {isVerifying ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-['Orbitron'] font-black text-white mb-2 italic tracking-tighter uppercase">
              The Hub Lock
            </h1>
            <p className="text-neon-purple font-black font-mono text-[10px] tracking-[0.2em] uppercase mb-1">
              Sector Sync: {hub.name}
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-neon-purple to-transparent w-full opacity-50" />
          </div>

          <VerificationEngine
            hub={hub}
            quest={quest}
            onVerificationComplete={handleVerificationComplete}
          />
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {showCelebration && (
            <MissionAccomplished
              key="celebration"
              missionName={quest.title}
              xpGained={lootData?.xp || 0}
              reliabilityGain={1}
              wasShowdown={lootData?.wasShowdown}
              onClose={handleMissionClose}
            />
          )}

          {showReview && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            >
              <div className="w-full max-w-sm">
                <VibeReview
                  squad={reviewSquad}
                  onComplete={handleReviewComplete}
                />
              </div>
            </motion.div>
          )}

          {showSoloMessage && (
            <motion.div
              key="solo-msg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            >
              <div className="w-full max-w-sm text-center border border-neon-purple/30 p-8 rounded-2xl bg-black/50 backdrop-blur-xl">
                <h2 className="text-2xl font-black font-['Orbitron'] text-white mb-4 italic uppercase tracking-tighter">
                  Lone Wolf
                </h2>
                <div className="w-16 h-16 rounded-full bg-neon-purple/20 flex items-center justify-center mx-auto mb-6 border-2 border-neon-purple animate-pulse">
                  <span className="text-2xl">🐺</span>
                </div>
                <p className="text-gray-400 text-sm mb-8 font-mono">
                  Solo mission confirmed. No squad members available for
                  tactical review.
                </p>
                <button
                  onClick={finishQuest}
                  className="w-full py-4 bg-neon-purple text-white font-black uppercase tracking-widest rounded-xl hover:bg-neon-purple/80 transition-all shadow-lg shadow-neon-purple/20"
                >
                  Return to Base
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Verification;
