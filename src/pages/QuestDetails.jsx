import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Zap,
  Award,
  ChevronRight,
  ShieldCheck,
  Gem,
  ExternalLink,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToQuest,
  isUserQuestMember,
  getUserVerificationStatus,
} from "../backend/firebaseService";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import TacticalErrorModal from "../components/TacticalErrorModal";

const QuestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinQuest, isJoined } = useGame();
  const { user } = useAuth();

  const [quest, setQuest] = useState(null);
  const [hub, setHub] = useState(null);
  const [members, setMembers] = useState([]); // Added specific state for members
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  const [isMember, setIsMember] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    // Check membership and verification status source of truth
    const checkStatus = async () => {
      const member = await isUserQuestMember(id, user.uid);
      setIsMember(member);

      const verified = await getUserVerificationStatus(id, user.uid);
      setIsVerified(verified);
    };

    checkStatus();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;

    // 1. Subscribe to Quest Document
    let unsubHub = null;
    const unsubscribeQuest = subscribeToQuest(id, (updatedQuest) => {
      setQuest(updatedQuest);
      setLoading(false);

      // Fetch corresponding hub
      if (updatedQuest.hubId) {
        if (typeof unsubHub === "function") unsubHub();
        unsubHub = onSnapshot(
          doc(db, "hubs", updatedQuest.hubId),
          (docSnap) => {
            if (docSnap.exists()) {
              setHub({ id: docSnap.id, ...docSnap.data() });
            }
          },
          (error) => {
            console.warn("QuestDetails: Hub listener error:", error.code);
          }
        );
      } else if (updatedQuest.hubName) {
        if (typeof unsubHub === "function") unsubHub();
        const hubsRef = collection(db, "hubs");
        const q = query(hubsRef, where("name", "==", updatedQuest.hubName));
        unsubHub = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const h = snapshot.docs[0];
              setHub({ id: h.id, ...h.data() });
            }
          },
          (error) => {
            console.warn("QuestDetails: Hub query error:", error.code);
          }
        );
      }
    });

    // 2. Subscribe to Members Subcollection (New Data Model)
    const membersRef = collection(db, "quests", id, "members");
    const unsubscribeMembers = onSnapshot(
      membersRef,
      (snapshot) => {
        const squadData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMembers(squadData);
      },
      (error) => {
        console.warn("QuestDetails: Members listener error:", error.code);
      }
    );

    return () => {
      unsubscribeQuest();
      unsubscribeMembers();
      if (typeof unsubHub === "function") unsubHub();
    };
  }, [id]);

  const handleJoin = () => {
    // Gender Validation
    if (quest.genderPreference && quest.genderPreference !== "everyone") {
      if (user?.gender !== quest.genderPreference) {
        setErrorModal({
          isOpen: true,
          message:
            quest.genderPreference === "female"
              ? "This mission is reserved for Female Heroes. Check the board for open missions!"
              : "This mission is reserved for Male Heroes. Check the board for open missions!",
        });
        return;
      }
    }

    joinQuest(quest.id);
    navigate(`/lobby/${quest.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-dark-bg">
        <div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">
            Quest Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            This mission has been redacted or expired.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-neon-purple rounded-xl font-bold text-white shadow-lg shadow-neon-purple/20"
          >
            Return
          </button>
        </div>
      </div>
    );
  }

  const startTimeObj = quest.startTime?.toDate
    ? quest.startTime.toDate()
    : new Date(quest.startTime);
  const maxPlayers = quest.maxPlayers || 5;
  const isStarted = new Date() >= startTimeObj;

  return (
    <div className="bg-dark-bg min-h-screen pb-24">
      {/* Header Image/Background */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg to-transparent z-10" />
        <div className="absolute inset-0 bg-neon-purple/20 mix-blend-overlay z-0" />
        <img
          src={`https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop`}
          className="w-full h-full object-cover grayscale opacity-50"
          alt=""
        />

        {/* Top Controls */}
        <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-3 glassmorphism rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-1.5 glassmorphism rounded-full border border-neon-purple/50 text-xs font-black font-mono text-neon-purple uppercase">
            Quest Ready
          </div>
        </div>

        {/* Quest Title Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-neon-purple text-white text-[10px] font-black rounded uppercase">
              {quest.category || "Field"}
            </span>
            <span className="text-gray-400 text-xs font-mono">
              • {quest.difficulty || 1} Threat Level
            </span>
          </div>
          <h1 className="text-3xl font-black font-['Orbitron'] text-white italic tracking-tighter leading-tight">
            {quest.title}
          </h1>
        </div>
      </div>

      <div className="px-6 space-y-8 mt-6">
        {/* Mission Objective */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-neon-purple">
            <Zap className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-widest">
              Mission Objective
            </h2>
          </div>
          <div className="p-5 glassmorphism-dark rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <p className="text-gray-200 font-medium leading-relaxed italic">
              "
              {quest.objective ||
                quest.description ||
                "Standard Field Mission Coordination Required."}
              "
            </p>
          </div>
        </section>

        {/* Tactical Intel Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 glassmorphism-dark rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock className="w-4 h-4 text-neon-purple" />
              <span className="text-[10px] font-black uppercase">
                Meetup Timing
              </span>
            </div>
            <div className="text-lg font-black font-mono text-white">
              {startTimeObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold italic">
              Sector Launch Sync
            </div>
          </div>
          <div className="p-4 glassmorphism-dark rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase">
                Squad Status
              </span>
            </div>
            <div className="text-lg font-black font-mono text-white">
              {members.length}/{maxPlayers}{" "}
              <span className="text-xs text-gray-500 font-bold">HEROES</span>
            </div>
          </div>
        </div>

        {/* Level & Duration Intel */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 glassmorphism-dark rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-[10px] font-black uppercase">
                Threat Level
              </span>
            </div>
            <div className="text-sm font-black text-white">
              {"⭐".repeat(quest.difficulty || 1)}
            </div>
          </div>
          <div className="p-4 glassmorphism-dark rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] font-black uppercase">
                Est. Duration
              </span>
            </div>
            <div className="text-sm font-black text-white">
              {quest.duration || "60-90m"}
            </div>
          </div>
        </div>

        {/* Location Intel */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-neon-purple">
            <MapPin className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-widest">
              Hub Location
            </h2>
          </div>
          <div className="flex items-center gap-4 p-4 glassmorphism-dark rounded-2xl border border-white/5">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-6 h-6 text-neon-purple" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black text-white">
                {hub?.name || quest.hubName || "The Hub"}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-tighter">
                {hub?.address || "Localized Sector"}
              </div>
            </div>
            {hub?.coordinates?.latitude && hub?.coordinates?.longitude && (
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${hub.coordinates.latitude},${hub.coordinates.longitude}`,
                    "_blank"
                  )
                }
                className="p-2 bg-neon-purple/20 rounded-lg hover:bg-neon-purple/40 transition-colors"
                title="Open in Maps"
              >
                <ExternalLink className="w-4 h-4 text-neon-purple" />
              </button>
            )}
          </div>
        </section>

        {/* Loot Details */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-yellow-500">
            <Gem className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-widest">
              Expected Loot
            </h2>
          </div>
          <div className="p-5 glassmorphism-dark rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <Gem className="w-12 h-12" />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-black text-yellow-500 animate-pulse italic">
                  Verify to get excited reward
                </div>
                <div className="text-[10px] text-gray-400 uppercase font-black">
                  Unlocks upon successful verification
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-bg via-dark-bg/90 to-transparent z-50">
        <button
          disabled={!isMember && quest.status !== "open"}
          onClick={
            isMember
              ? isStarted && !isVerified
                ? () => navigate(`/verify/${quest.id}`)
                : () => navigate(`/lobby/${quest.id}`)
              : handleJoin
          }
          className={`w-full py-5 font-black italic tracking-[0.2em] text-lg uppercase flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.4)] group transition-all ${
            !isMember && quest.status !== "open"
              ? "bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed opacity-50 shadow-none"
              : "btn-primary"
          }`}
        >
          {!isMember
            ? quest.status === "open"
              ? "Join Squad"
              : "Mission Active"
            : isStarted && !isVerified
            ? "Verify Presence"
            : "Enter Lobby"}
          <ChevronRight
            className={`w-5 h-5 transition-transform ${
              isMember || quest.status === "open"
                ? "group-hover:translate-x-1"
                : ""
            }`}
          />
        </button>
      </div>

      <TacticalErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        message={errorModal.message}
      />
    </div>
  );
};

export default QuestDetails;
