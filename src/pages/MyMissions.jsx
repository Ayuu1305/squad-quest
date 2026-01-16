import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronRight, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToAllQuests } from "../backend/firebaseService";
import QuestCard from "../components/QuestCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

const MyMissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [quests, setQuests] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribeQuests = null;

    // ✅ Listen joined quest IDs from: users/{uid}/joinedQuests
    const joinedRef = collection(db, "users", user.uid, "joinedQuests");

    const unsubscribeJoined = onSnapshot(
      joinedRef,
      (snapshot) => {
        const joinedIds = snapshot.docs.map((doc) => doc.id);

        // ✅ If already subscribed, stop previous subscription before resubscribing
        if (typeof unsubscribeQuests === "function") {
          unsubscribeQuests();
        }

        // ✅ Subscribe all quests, then filter client-side
        unsubscribeQuests = subscribeToAllQuests(
          (allQuests) => {
            const myQuests = allQuests.filter(
              (q) => joinedIds.includes(q.id) || q.hostId === user.uid
            );

            setQuests(myQuests);
            setLoading(false);
          },
          (error) => {
            console.error("MyMissions: Quests listener error:", error);
            setLoading(false);
          }
        );
      },
      (err) => {
        console.warn("MyMissions: JoinedQuests snapshot blocked:", err.code);
        setLoading(false);
      }
    );

    // ✅ Hubs listener
    const hubsRef = collection(db, "hubs");
    const unsubHubs = onSnapshot(
      hubsRef,
      (snapshot) => {
        const hubsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHubs(hubsData);
      },
      (error) => {
        console.error("MyMissions: Hubs listener error:", error);
      }
    );

    // ✅ Cleanup safely
    return () => {
      if (typeof unsubscribeQuests === "function") unsubscribeQuests();
      unsubscribeJoined();
      unsubHubs();
    };
  }, [user?.uid]);

  const now = new Date();

  const isPast = (q) => {
    // ✅ User specific completion check
    if (q.completedBy?.includes(user?.uid)) return true;

    // Fallback: Global completion (legacy) or Time-based expiry
    if (q?.status === "completed" && !q.completedBy) return true;

    const startTimeParsed = q?.startTime?.toDate
      ? q.startTime.toDate()
      : q?.startTime
      ? new Date(q.startTime)
      : null;

    if (!startTimeParsed || Number.isNaN(startTimeParsed.getTime()))
      return false;

    // ✅ treat as past if started > 2 hour ago (extended duration)
    return now - startTimeParsed > 2 * 60 * 60 * 1000;
  };

  const upcomingMissions = quests.filter((q) => !isPast(q));
  const pastMissions = quests.filter((q) => isPast(q));

  const displayQuests =
    activeTab === "upcoming" ? upcomingMissions : pastMissions;

  return (
    <div className="app-container min-h-screen pb-32 bg-dark-bg">
      {/* Header */}
      <header className="pt-12 pb-8 px-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 glassmorphism rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="text-right">
            <h1 className="text-2xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase">
              Operational Log
            </h1>
            <p className="text-[10px] text-neon-purple font-black uppercase tracking-[0.3em]">
              Hero: {user?.name || "Unknown"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "upcoming"
                ? "bg-neon-purple text-white shadow-lg"
                : "text-gray-500"
            }`}
          >
            Tactical (Active)
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "past" ? "bg-white/10 text-white" : "text-gray-500"
            }`}
          >
            Archives (Past)
          </button>
        </div>
      </header>

      {/* List */}
      <div className="px-6 space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 w-full bg-white/5 animate-pulse rounded-3xl"
            />
          ))
        ) : displayQuests.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {displayQuests.map((quest) => {
              const hub = hubs.find(
                (h) => h.id === quest.hubId || h.name === quest.hubName
              );

              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group"
                >
                  <Link
                    to={
                      quest.completedBy?.includes(user?.uid)
                        ? `/review/${quest.id}`
                        : `/lobby/${quest.id}`
                    }
                  >
                    <QuestCard quest={quest} hub={hub} isMyMission={true} />

                    {/* Status Badge */}
                    <div className="absolute top-4 right-12 z-20">
                      <span
                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${
                          quest.completedBy?.includes(user?.uid)
                            ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                            : quest.status === "active"
                            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                            : "bg-neon-purple/20 border-neon-purple/50 text-neon-purple"
                        }`}
                      >
                        {quest.completedBy?.includes(user?.uid)
                          ? "Cleared"
                          : quest.status === "active"
                          ? "Tactical"
                          : "Recruiting"}
                      </span>
                    </div>

                    {/* Indicator */}
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-neon-purple flex items-center justify-center shadow-lg group-hover:translate-x-1 transition-transform border border-white/20">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="text-center py-24 glassmorphism-dark rounded-[2.5rem] border-2 border-dashed border-white/5">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-700 opacity-30" />
            </div>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] px-12">
              No missions found in {activeTab} logs.
            </p>
            {activeTab === "upcoming" && (
              <button
                onClick={() => navigate("/board")}
                className="mt-6 text-neon-purple text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                Scan for active missions
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {!loading && displayQuests.length > 0 && (
        <div className="mt-12 px-6">
          <div className="bg-gradient-to-r from-neon-purple/20 to-transparent p-6 rounded-3xl border-l-4 border-neon-purple">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-neon-purple" />
              <div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  Record for{" "}
                  {activeTab === "upcoming"
                    ? "Current Deployment"
                    : "Hero History"}
                </div>
                <div className="text-xl font-['Orbitron'] font-black text-white italic">
                  {displayQuests.length}{" "}
                  {displayQuests.length === 1 ? "Mission" : "Missions"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMissions;
