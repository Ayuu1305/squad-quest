import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Lock, // ✅ Added missing import
  MapPin,
  Clock,
  Users,
  Zap,
  Award,
  ChevronRight,
  ShieldCheck,
  Gem,
  ExternalLink,
  Edit3,
  Trash2,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToQuest,
  isUserQuestMember,
  getUserVerificationStatus,
  deleteQuestAPI,
  editQuestAPI,
} from "../backend/services/quest.service";
import {
  requestJoinApproval, // 🚨 NEW: Request approval from host
  getUserRequestStatus, // 🚨 NEW: Check user's request status
} from "../backend/services/joinRequest.service";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { canJoinWomenOnlyQuest } from "../utils/trustScore"; // 🚨 NEW: For safety gates
import TacticalErrorModal from "../components/TacticalErrorModal";
import DeleteQuestModal from "../components/DeleteQuestModal";
import EditQuestModal from "../components/EditQuestModal";
import PendingRequests from "../components/PendingRequests"; // 🚨 NEW: Host approval UI
import toast from "react-hot-toast";

// 🍎 SAFARI COMPATIBILITY: Safe date parser for iOS
const safeDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput.toDate) return dateInput.toDate();
  if (typeof dateInput === "string") {
    return new Date(dateInput.replace(/-/g, "/"));
  }
  return new Date(dateInput);
};

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

  // ✅ NEW: Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ NEW: Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🚨 NEW: Join request state
  const [requestStatus, setRequestStatus] = useState(null); // "pending" | "approved" | "denied" | null

  const [isMember, setIsMember] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // ✅ Check if user is quest host
  const isHost = quest?.hostId === user?.uid;

  useEffect(() => {
    if (!user || !id) return;

    // Check if user is a member of this quest
    isUserQuestMember(id, user.uid).then((member) => {
      setIsMember(member);
    });
  }, [id, user?.uid]);

  // Check if user is verified for this quest
  useEffect(() => {
    if (!user?.uid || !id) return;
    getUserVerificationStatus(id, user.uid).then((verified) => {
      setIsVerified(verified);
    });
  }, [user?.uid, id]);

  // ✅ NEW: Sync 'isMember' with Real-Time Quest Data
  useEffect(() => {
    // Safety check: ensure quest and members array exist
    if (quest?.members && user?.uid) {
      // Check if our ID is in the live members array
      const isActuallyMember = quest.members.includes(user.uid);

      // If Firestore says we are a member, but State says we aren't... FIX IT.
      if (isActuallyMember && !isMember) {
        console.log("🔄 Syncing Membership Status from DB...");
        setIsMember(true);
      }
    }
  }, [quest, user?.uid, isMember]);

  // 🚨 NEW: Smart Real-time Listener (Fixed)
  const lastStatusRef = useRef(null); // 👈 1. Track history

  // 🚨 NEW: Check user's join request status on load
  useEffect(() => {
    if (!user?.uid || !id || isMember) return;

    // 2. Query ONLY my request for this quest
    const requestsRef = collection(db, "joinRequests");
    const q = query(
      requestsRef,
      where("questId", "==", id),
      where("userId", "==", user.uid),
    );

    console.log("👂 Listening for approval...");

    // 3. Open the "Socket"
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // If request doesn't exist yet, do nothing
      if (snapshot.empty) return;

      const reqData = snapshot.docs[0].data();
      const newStatus = reqData.status;
      setRequestStatus(newStatus);

      // ✅ THE FIX: Only celebrate if we transitioned from PENDING -> APPROVED
      // This prevents the "Double Toast" and "Ghost Member" bug on reload.
      if (newStatus === "approved" && lastStatusRef.current === "pending") {
        console.log("🎉 Just Approved! Auto-joining...");
        setIsMember(true);
        toast.success("Request Accepted! Welcome.");
        unsubscribe();
      }

      // Update history for next time
      lastStatusRef.current = newStatus;
    });

    return () => unsubscribe();
  }, [user?.uid, id, isMember]);

  // Sub to quest data in real-time
  useEffect(() => {
    if (!id) return;

    // 1. Subscribe to Quest Document
    // 1. Subscribe to Quest Document
    let unsubHub = null;
    const unsubscribeQuest = subscribeToQuest(id, (updatedQuest) => {
      // 🛡️ CRASH GUARD: If the quest was just deleted...
      if (!updatedQuest) {
        console.log("⚠️ Quest deleted. Redirecting to board...");
        setLoading(false);
        navigate("/board"); // Redirect safely instead of crashing
        return;
      }

      // ✅ Quest exists, proceed as normal
      setQuest(updatedQuest);
      setLoading(false);

      // Fetch corresponding hub (Safe now because we checked updatedQuest exists)
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
          },
        );
      } else if (updatedQuest.hubName) {
        // ... (your existing hubName logic is fine) ...
        if (typeof unsubHub === "function") unsubHub();
        const hubsRef = collection(db, "hubs");
        const q = query(hubsRef, where("name", "==", updatedQuest.hubName));
        unsubHub = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const h = snapshot.docs[0];
            setHub({ id: h.id, ...h.data() });
          }
        });
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
      },
    );

    return () => {
      unsubscribeQuest();
      unsubscribeMembers();
      if (typeof unsubHub === "function") unsubHub();
    };
  }, [id]);

  const handleJoin = async () => {
    // 🚨 WOMEN-ONLY QUEST SAFETY GATES (Phase-2)
    if (quest.genderPreference && quest.genderPreference === "female") {
      // Check if user is female first
      if (user?.gender !== "Female") {
        setErrorModal({
          isOpen: true,
          message:
            "This mission is reserved for Female Heroes. Check the board for open missions!",
        });
        return;
      }

      // Check behavioral gates (verified badge, 3+ quests, etc.)
      const gateResult = canJoinWomenOnlyQuest(user);

      if (!gateResult.allowed) {
        if (gateResult.requireApproval) {
          // 🚨 NEW: Send join request to host
          try {
            await requestJoinApproval(quest.id, quest, user);
            setRequestStatus("pending");
            toast.success(
              "🔔 Request sent to host! You'll be notified when accepted.",
              {
                duration: 5000,
              },
            );
          } catch (error) {
            console.error("Failed to send join request:", error);
            toast.error("Failed to send request. Try again.");
          }
          return;
        } else {
          // Blocked entirely (shouldn't happen often)
          setErrorModal({
            isOpen: true,
            message: gateResult.reason,
          });
          return;
        }
      }

      // Gates passed - can join!
      toast.success(gateResult.reason, { duration: 2000 });
    }

    // Gender Validation for male-only quests
    if (quest.genderPreference && quest.genderPreference === "male") {
      if (user?.gender !== "Male") {
        setErrorModal({
          isOpen: true,
          message:
            "This mission is reserved for Male Heroes. Check the board for open missions!",
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

  const startTimeObj = safeDate(quest.startTime);
  const maxPlayers = quest.maxPlayers || 5;
  const isStarted = new Date() >= startTimeObj;

  return (
    <div className="bg-dark-bg min-h-screen pb-24">
      <div className="container mx-auto max-w-7xl">
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

            {/* ✅ NEW: Host-only action buttons */}
            {isHost && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-3 glassmorphism rounded-xl text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-400/30"
                  title="Edit Quest"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteModal(true);
                  }}
                  className="p-3 glassmorphism rounded-xl text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/30"
                  title="Delete Quest"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}

            {!isHost && (
              <div className="px-4 py-1.5 glassmorphism rounded-full border border-neon-purple/50 text-xs font-black font-mono text-neon-purple uppercase">
                Quest Ready
              </div>
            )}
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
          {/* Quest Details */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
              <h2 className="text-xs font-black uppercase tracking-widest">
                Quest Details
              </h2>
            </div>
            <div className="p-5 glassmorphism-dark rounded-2xl space-y-3 border border-white/10">
              <p className="text-gray-200 text-sm leading-relaxed">
                {quest.description || "No description provided."}
              </p>
            </div>
          </section>

          {/* 🚨 NEW: Pending Join Requests (Host Only) */}
          {isHost && <PendingRequests questId={quest.id} hostId={user?.uid} />}

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

          {/* ✅ NEW: Mission Code (Host Only) */}
          {isHost && quest.isPrivate && quest.roomCode && (
            <section>
              <div className="flex items-center gap-2 mb-3 text-red-400">
                <ShieldCheck className="w-4 h-4 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-widest">
                  Secure Mission Code
                </h2>
              </div>
              <div className="p-5 glassmorphism-dark rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mb-1">
                      Encrypted Access Key
                    </p>
                    <div className="text-3xl font-black font-mono text-white tracking-[0.2em] group-hover:text-red-400 transition-colors">
                      {quest.roomCode}
                    </div>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                    <Lock className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[9px] text-red-400/80 font-mono uppercase tracking-tight">
                    Share this code with your squad operatives
                  </span>
                </div>
              </div>
            </section>
          )}

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
                      "_blank",
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
                  <div className="text-sm font-black text-yellow-500 flex items-center gap-2">
                    <Lock className="w-4 h-4 animate-pulse" />
                    Mystery Hub Reward
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-black">
                    Complete verification to unlock your surprise!
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-bg via-dark-bg/90 to-transparent z-50">
          <button
            disabled={
              !isMember &&
              (quest.status !== "open" || requestStatus === "pending")
            }
            onClick={
              isMember
                ? isStarted && !isVerified
                  ? () => navigate(`/verify/${quest.id}`)
                  : () => navigate(`/lobby/${quest.id}`)
                : handleJoin
            }
            className={`w-full py-5 font-black italic tracking-[0.2em] text-lg uppercase flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.4)] group transition-all ${
              !isMember &&
              (quest.status !== "open" || requestStatus === "pending")
                ? "bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed opacity-50 shadow-none"
                : "btn-primary"
            }`}
          >
            {!isMember
              ? requestStatus === "pending"
                ? "⏳ Waiting for Approval"
                : requestStatus === "denied"
                  ? "Request Again"
                  : quest.status === "open"
                    ? "Join Squad"
                    : "Mission Active"
              : isStarted && !isVerified
                ? "Verify Presence"
                : "Enter Lobby"}
            <ChevronRight
              className={`w-5 h-5 transition-transform ${
                isMember ||
                (quest.status === "open" && requestStatus !== "pending")
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

        {/* ✅ Delete Quest Modal - Optimistic UI */}
        <DeleteQuestModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            // ✅ OPTIMISTIC: Close modal and navigate IMMEDIATELY
            setShowDeleteModal(false);
            toast.success("Quest deleted successfully!", {
              icon: "🗑️",
              duration: 3000,
            });
            navigate("/board");

            // ✅ API call runs in background
            try {
              await deleteQuestAPI(id);
              // Success - user already navigated
            } catch (error) {
              // Show error feedback even though user navigated
              console.error("Delete quest failed:", error);
              toast.error("Delete failed. The quest may still exist.");
            }
          }}
          questTitle={quest?.title || "Unknown Quest"}
          isDeleting={isDeleting}
        />

        {/* ✅ Edit Quest Modal - Optimistic UI */}
        <EditQuestModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={async (updates) => {
            // ✅ Store original for rollback
            const originalQuest = { ...quest };

            // ✅ OPTIMISTIC: Apply updates to local state IMMEDIATELY
            setQuest((prev) => ({ ...prev, ...updates }));
            setShowEditModal(false);
            toast.success("Quest updated successfully!", {
              icon: "✏️",
              duration: 3000,
            });

            // ✅ API call runs in background
            try {
              await editQuestAPI(id, updates);
              // Success - state already updated
            } catch (error) {
              // ✅ ROLLBACK on failure
              console.error("Edit quest failed:", error);
              setQuest(originalQuest);
              toast.error("Failed to save changes. Reverted.");
              setShowEditModal(true); // Re-open modal
            }
          }}
          quest={quest}
          isSaving={isSaving}
          userCity={user?.city}
        />
      </div>
    </div>
  );
};

export default QuestDetails;
