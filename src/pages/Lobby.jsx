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
  syncServerTime,
  updateQuestStatus,
} from "../backend/firebaseService";

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

  // Subscribe to real-time quest updates
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToQuest(id, (updatedQuest) => {
      setLiveQuest((prev) => ({ ...prev, ...updatedQuest }));
    });
    return unsubscribe;
  }, [id]);

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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column */}
        <div className="w-1/2 flex flex-col border-r border-white/10 overflow-hidden min-h-0">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20">
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

          <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
            {/* Mission Code */}
            {liveQuest.isPrivate && liveQuest.roomCode && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> Top Secret Clearance
                  </h3>

                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <p className="text-[9px] text-gray-500 mb-1 uppercase font-mono">
                        Mission Access Code
                      </p>
                      <div
                        onClick={() =>
                          navigator.clipboard.writeText(liveQuest.roomCode)
                        }
                        className="text-3xl font-mono font-black text-white tracking-[0.2em] cursor-pointer hover:text-red-400 transition-colors"
                      >
                        {liveQuest.roomCode}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const text = `🕵️ Squad Quest Mission Briefing:\n\nMission: ${liveQuest.title}\nAccess Code: *${liveQuest.roomCode}*\n\nJoin me in the Shadows.`;
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(text)}`,
                          "_blank",
                        );
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl transition-colors shadow-lg"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ NEW: Secret Code for Private Quests */}
            {liveQuest.isPrivate && liveQuest.secretCode && (
              <div className="bg-gradient-to-br from-purple-500/20 to-transparent rounded-2xl p-4 border-2 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] mt-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <p className="text-[9px] text-purple-300 mb-1 uppercase font-mono">
                      🔐 Secret Code (Private Quest)
                    </p>
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(liveQuest.secretCode);
                        toast.success("Secret code copied!", { icon: "🔐" });
                      }}
                      className="text-3xl font-mono font-black text-purple-200 tracking-[0.2em] cursor-pointer hover:text-purple-400 transition-colors"
                    >
                      {liveQuest.secretCode}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(liveQuest.secretCode);
                      toast.success("Secret code copied!", { icon: "🔐" });
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl transition-colors shadow-lg"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[9px] text-purple-300 mt-2 font-mono">
                  Share this code with members to join
                </p>
              </div>
            )}

            {/* Countdown */}
            <div className="space-y-4 mt-auto">
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-neon-purple/20 p-2 rounded-lg">
                    <Clock
                      className={`w-5 h-5 ${
                        isLocked
                          ? "text-neon-purple animate-pulse"
                          : "text-green-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                      Launch Sync
                    </div>
                    <div
                      className={`text-xl font-black font-mono tracking-widest ${
                        isLocked ? "text-white" : "text-green-500"
                      }`}
                    >
                      {timeLeft}
                    </div>
                  </div>
                </div>

                {isCompleted && (
                  <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-[10px] font-black text-green-500 uppercase">
                    ✅ Completed
                  </div>
                )}
              </div>

              {/* ✅ UPDATED BUTTON LOGIC */}
              <button
                disabled={isLocked || isCompleted}
                onClick={() => {
                  if (isCompleted) {
                    navigate(`/board/${liveQuest.id}`);
                  } else {
                    navigate(`/verify/${liveQuest.id}`);
                  }
                }}
                className={`w-full py-5 rounded-2xl font-black italic tracking-[0.2em] text-lg uppercase flex items-center justify-center gap-3 transition-all duration-500 ${
                  isLocked || isCompleted
                    ? "bg-gray-800 text-gray-600 border border-white/5 cursor-not-allowed opacity-50"
                    : "btn-primary shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-100 hover:scale-105 active:scale-95"
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Mission Already Completed
                  </>
                ) : isLocked ? (
                  <>
                    <ShieldAlert className="w-5 h-5" />
                    Verify Squad to get reward
                  </>
                ) : (
                  <>
                    Commence Scan
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* ✅ NEW BUTTON if completed */}
              {isCompleted && (
                <button
                  onClick={() => navigate(`/board/${liveQuest.id}`)}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                >
                  Go To Board <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="w-1/2 border-l border-white/10 h-full min-h-0 overflow-hidden">
          <ChatInterface
            quest={liveQuest}
            user={user}
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
