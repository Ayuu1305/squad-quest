import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Clock,
  ShieldAlert,
  ChevronRight,
  Share2,
  CheckCircle2,
} from "lucide-react";
import ChatInterface from "../components/ChatInterface";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToQuest,
  updateQuestStatus,
} from "../backend/services/quest.service";
import { syncServerTime } from "../backend/services/user.service";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import toast from "react-hot-toast";

const Lobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leaveQuest } = useGame();
  const { user } = useAuth();

  const [liveQuest, setLiveQuest] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [serverOffset, setServerOffset] = useState(0);

  // ✅ NEW: Verification status
  const [isCompleted, setIsCompleted] = useState(false);

  // Subscribe to real-time quest updates + Auto-Eject on deletion
  useEffect(() => {
    if (!id) return;

    let hasLoaded = false; // ✅ Guard against false triggers during initial load

    const unsubscribe = subscribeToQuest(id, (updatedQuest) => {
      // ✅ DELETION DETECTION: Check if quest no longer exists
      if (!updatedQuest || updatedQuest === null) {
        // Only trigger auto-eject if we've already loaded the quest once
        if (hasLoaded) {
          console.warn(
            "🚫 [Lobby] Quest deleted by host - Auto-ejecting members",
          );

          // Show toast notification
          toast.error("🚫 This Quest has been disbanded by the Host.", {
            duration: 4000,
            position: "top-center",
            style: {
              background: "#1a0f2e",
              color: "#fff",
              border: "1px solid #ef4444",
            },
          });

          // Redirect to quest board
          navigate("/board");
        }
        return; // Stop processing if quest doesn't exist
      }

      // Quest exists - mark as loaded and update state
      hasLoaded = true;
      setLiveQuest((prev) => ({ ...prev, ...updatedQuest }));
    });

    return unsubscribe;
  }, [id, navigate]); // ✅ ZERO-LOOP: Primitives only

  // Sync server time
  useEffect(() => {
    const getOffset = async () => {
      try {
        const offset = await syncServerTime();
        setServerOffset(offset);
      } catch (e) {
        console.error("Time Sync Failed", e);
      }
    };
    getOffset();
  }, []);

  // ✅ NEW: Check if user already verified
  useEffect(() => {
    const checkVerification = async () => {
      if (!id || !user?.uid) return;

      try {
        const verifyRef = doc(db, "quests", id, "verifications", user.uid);
        const snap = await getDoc(verifyRef);

        setIsCompleted(snap.exists());
      } catch (err) {
        console.warn("Verification check failed:", err?.code || err?.message);
      }
    };

    checkVerification();
  }, [id, user?.uid]);

  useEffect(() => {
    if (!liveQuest) return;

    const calculateTime = () => {
      const now = new Date(Date.now() + serverOffset);
      const startTimeObj = liveQuest.startTime?.toDate
        ? liveQuest.startTime.toDate()
        : new Date(liveQuest.startTime);

      const diff = startTimeObj - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsLocked(false);

        if (liveQuest.status === "open") {
          updateQuestStatus(liveQuest.id, "active").catch(() => {});
        }
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60))
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, "0");

      setTimeLeft(`${h}:${m}:${s}`);
      setIsLocked(true);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [liveQuest?.id, liveQuest?.startTime, liveQuest?.status, serverOffset]);

  if (!liveQuest) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-dark-bg overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Column - Top on Mobile */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-white/10 overflow-hidden shrink-0 h-auto md:h-full max-h-[35vh] md:max-h-full">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 glassmorphism rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="font-['Orbitron'] font-black text-white text-base leading-tight truncate max-w-[150px] italic tracking-tighter uppercase">
                  {liveQuest.title}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                    Secure Channel
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-neon-purple/10 border border-neon-purple/50 rounded-lg px-2.5 py-1 flex items-center gap-2">
              <Zap className="w-3 h-3 text-neon-purple" />
              <span className="font-black font-mono text-[10px] text-neon-purple">
                +{(Number(liveQuest.difficulty) || 1) * 100} XP
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar">
            {/* Mission Code - Hidden on very small screens to save space if needed, but kept for now */}
            {liveQuest.isPrivate && liveQuest.roomCode && (
              <div className="mb-4 p-3 bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase font-mono">
                      Mission Code
                    </p>
                    <div className="text-xl font-mono font-black text-white tracking-widest">
                      {liveQuest.roomCode}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Countdown & Button Area */}
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-neon-purple/20 p-2 rounded-lg">
                    <Clock
                      className={`w-4 h-4 ${
                        isLocked
                          ? "text-neon-purple animate-pulse"
                          : "text-green-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                      Launch Sync
                    </div>
                    <div
                      className={`text-lg font-black font-mono tracking-widest ${
                        isLocked ? "text-white" : "text-green-500"
                      }`}
                    >
                      {timeLeft}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button or Mission Cleared Badge */}
              {liveQuest.status === "completed" ||
              liveQuest.completedBy?.includes(user?.uid) ? (
                <div className="w-full py-6 rounded-xl font-black italic tracking-[0.2em] text-sm uppercase flex items-center justify-center gap-3 glassmorphism border border-green-500/30 bg-green-500/10 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">Mission Cleared</span>
                </div>
              ) : (
                <button
                  disabled={isLocked || isCompleted}
                  onClick={() => {
                    if (isCompleted) {
                      navigate(`/board/${liveQuest.id}`);
                    } else {
                      navigate(`/verify/${liveQuest.id}`);
                    }
                  }}
                  className={`w-full py-4 rounded-xl font-black italic tracking-[0.2em] text-sm uppercase flex items-center justify-center gap-3 transition-all duration-500 ${
                    isLocked || isCompleted
                      ? "bg-gray-800 text-gray-600 border border-white/5 cursor-not-allowed opacity-50"
                      : "btn-primary shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-100 hover:scale-105 active:scale-95"
                  }`}
                >
                  {isCompleted ? (
                    "Mission Completed"
                  ) : isLocked ? (
                    "Verify Squad (Locked)"
                  ) : (
                    <>
                      Commence Scan
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Chat - Takes remaining space */}
        <div className="w-full md:w-1/2 border-l-0 md:border-l border-white/10 h-full min-h-0 flex-1 overflow-hidden relative">
          <ChatInterface
            quest={liveQuest}
            user={user}
            isReadOnly={
              liveQuest.status === "completed" ||
              liveQuest.completedBy?.includes(user?.uid)
            }
            onLeave={async () => {
              try {
                await leaveQuest(liveQuest.id);
                navigate("/board");
              } catch (error) {
                console.error("Leave quest failed:", error);
                alert(`Failed to leave quest: ${error.message}`);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Lobby;
