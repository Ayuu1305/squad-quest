import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronRight, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import QuestCard from "../components/QuestCard";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

const MyMissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [quests, setQuests] = useState([]);
  const [archivedQuests, setArchivedQuests] = useState([]); // ✅ Archived completed quests
  const [hubs, setHubs] = useState({}); // ✅ Map: { [hubId]: hubData }
  const [loading, setLoading] = useState(true);

  // ✅ Direct Query: Fetch quests where user is in members array
  useEffect(() => {
    if (!user?.uid) return;

    // Query main collection directly - most robust method
    const q = query(
      collection(db, "quests"),
      where("members", "array-contains", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const myQuests = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Sort by startTime descending (Newest first)
            const timeA = a.startTime?.toDate
              ? a.startTime.toDate()
              : new Date(a.startTime);
            const timeB = b.startTime?.toDate
              ? b.startTime.toDate()
              : new Date(b.startTime);
            return timeB - timeA;
          });
        console.log("📋 [MyMissions] Fetched quests:", myQuests.length);
        setQuests(myQuests);
        setLoading(false);
      },
      (error) => {
        if (error?.code === "permission-denied") return;
        console.warn("MyMissions: Query error:", error?.code);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // ✅ Fetch archived completed quests from archived_quests collection
  useEffect(() => {
    if (!user?.uid) return;

    // Query archived_quests collection for completed missions only
    const archivedQuery = query(
      collection(db, "archived_quests"),
      where("members", "array-contains", user.uid),
      where("status", "==", "completed"), // ✅ Filter out archived 'open' quests
    );

    const unsubscribe = onSnapshot(
      archivedQuery,
      (snapshot) => {
        // ✅ VERIFICATION: Log raw document count
        const allDocs = snapshot.docs;
        console.log("\n📊 [MyMissions] ARCHIVED QUESTS VERIFICATION:");
        console.log(`   Total documents in archived_quests: ${allDocs.length}`);

        // Count by status
        const statusCounts = {};
        allDocs.forEach((doc) => {
          const status = doc.data().status || "undefined";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log("   Status breakdown:", statusCounts);

        const archived = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(
          `   Documents matching query (completed only): ${archived.length}`,
        );
        console.log("   ✅ This is what will be shown in Past Missions\n");

        setArchivedQuests(archived);
      },
      (error) => {
        // ✅ Graceful error handling - don't crash if index missing or permission denied
        if (
          error?.code === "permission-denied" ||
          error?.code === "failed-precondition"
        ) {
          console.warn(
            "MyMissions: Archived quests query error (non-critical):",
            error?.code,
          );
          setArchivedQuests([]); // Return empty array, show only recent history
          return;
        }
        console.warn("MyMissions: Archived query error:", error?.code);
        setArchivedQuests([]);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // ✅ Fetch hubs per-quest (avoids collection-wide subscription and permission issues)
  useEffect(() => {
    if (quests.length === 0) return;

    const fetchHubs = async () => {
      const hubIds = [...new Set(quests.map((q) => q.hubId).filter(Boolean))];
      const hubMap = {};

      await Promise.all(
        hubIds.map(async (hubId) => {
          try {
            const hubSnap = await getDoc(doc(db, "hubs", hubId));
            if (hubSnap.exists()) {
              hubMap[hubId] = { id: hubSnap.id, ...hubSnap.data() };
            }
          } catch (err) {
            console.warn("Hub fetch failed:", hubId, err?.code);
          }
        }),
      );

      setHubs(hubMap);
    };

    fetchHubs();
  }, [quests]);

  const now = new Date();

  const isPast = (q) => {
    // ✅ User-specific completion check
    if (q.completedBy?.includes(user?.uid)) return true;

    // ✅ Quest explicitly marked as completed
    if (q?.status === "completed") return true;

    // ✅ Quest was cancelled or deleted
    if (q?.status === "cancelled" || q?.status === "deleted") return true;

    // Everything else is "upcoming" (active)
    return false;
  };

  const upcomingMissions = quests.filter((q) => !isPast(q));

  // ✅ Merge Past Missions: Recent (from quests) + Deep History (from archived_quests)
  const pastMissions = [
    ...quests.filter((q) => isPast(q)),
    ...archivedQuests,
  ].sort((a, b) => {
    // Sort by updatedAt descending (most recent first)
    const timeA = a.updatedAt?.toDate
      ? a.updatedAt.toDate()
      : new Date(a.updatedAt || 0);
    const timeB = b.updatedAt?.toDate
      ? b.updatedAt.toDate()
      : new Date(b.updatedAt || 0);
    return timeB - timeA;
  });

  // Debug: Log filter results
  console.log(
    "📋 [MyMissions] Upcoming:",
    upcomingMissions.length,
    "Past:",
    pastMissions.length,
  );
  console.log("📋 [MyMissions] Active Tab:", activeTab);

  const displayQuests =
    activeTab === "upcoming" ? upcomingMissions : pastMissions;

  // ✅ Internal Swipe Handler
  const tabs = ["upcoming", "past"];

  // Touch tracking for internal swipe navigation
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const threshold = 50;
    const currIndex = tabs.indexOf(activeTab);

    if (deltaX > threshold && currIndex > 0) {
      setActiveTab(tabs[currIndex - 1]);
    } else if (deltaX < -threshold && currIndex < tabs.length - 1) {
      setActiveTab(tabs[currIndex + 1]);
    }
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  return (
    <div
      className="app-container min-h-screen pb-32 bg-dark-bg"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
        <div
          data-swipeable="missions-tabs"
          className="flex bg-white/5 rounded-2xl p-1"
        >
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "upcoming"
                ? "bg-neon-purple text-white shadow-lg"
                : "text-gray-500"
            }`}
          >
            Active Missions
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "past" ? "bg-white/10 text-white" : "text-gray-500"
            }`}
          >
            Past Missions
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
              // ✅ Direct map lookup (hubs is now { [hubId]: hubData })
              const hub = hubs[quest.hubId];

              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group"
                >
                  <Link to={`/lobby/${quest.id}`}>
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
