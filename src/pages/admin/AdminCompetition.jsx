import { useState, useEffect } from "react"; // 👈 FIXED: Added useEffect
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore"; // 👈 FIXED: Combined all firestore imports
import { db } from "../../backend/firebaseConfig";
import toast from "react-hot-toast";
import { Trophy, Calendar, Users, Hash, Swords } from "lucide-react";

// 🛑 SUB-COMPONENT: Manages Active Wars (End/Freeze Logic)
// 🛑 SUB-COMPONENT: Manages Active Wars (End/Freeze Logic)
const ActiveWarsManager = () => {
  const [activeWars, setActiveWars] = useState([]);

  // Fetch active wars on load
  useEffect(() => {
    const fetchWars = async () => {
      try {
        const q = query(
          collection(db, "competitions"),
          where("status", "==", "active"),
        );
        const snap = await getDocs(q);
        setActiveWars(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching active wars:", error);
      }
    };
    fetchWars();
  }, []);

  const handleEndWar = async (war) => {
    if (
      !window.confirm(
        `Are you sure you want to END "${war.title}"? This will freeze scores.`,
      )
    )
      return;

    const toastId = toast.loading("Snapshotting scores & heroes...");

    try {
      // 1. Calculate Final Scores AND Capture Top 3 Heroes for each college
      const finalResults = await Promise.all(
        war.colleges.map(async (college) => {
          const q = query(
            collection(db, "users"),
            where("college", "==", college),
          );
          const snap = await getDocs(q);

          // A. Calculate Total XP
          const totalXP = snap.docs.reduce(
            (sum, doc) => sum + (doc.data().thisWeekXP || 0),
            0,
          );

          // B. Get Top 3 Heroes for the Podium (Frozen Data)
          const allStudents = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const topHeroes = allStudents
            .sort((a, b) => (b.thisWeekXP || 0) - (a.thisWeekXP || 0))
            .slice(0, 3); // Keep top 3 for the podium

          return {
            college,
            totalXP,
            studentCount: snap.size,
            topHeroes: topHeroes, // Saving the heroes forever!
          };
        }),
      );

      // 2. Sort to find the winner (Highest XP first)
      finalResults.sort((a, b) => b.totalXP - a.totalXP);

      // 3. Update the Competition Document (Freeze it!)
      await updateDoc(doc(db, "competitions", war.id), {
        status: "ended",
        finalStandings: finalResults, // Saving scores + heroes
        winner: finalResults[0].college,
        endedAt: new Date(),
      });

      toast.success("War Ended & Scores Frozen! 🧊", { id: toastId });

      // Remove from list immediately
      setActiveWars((prev) => prev.filter((w) => w.id !== war.id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to end war", { id: toastId });
    }
  };

  if (activeWars.length === 0) return null;

  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Swords className="w-5 h-5 text-red-500" /> Active Battlefronts
      </h2>
      <div className="space-y-4">
        {activeWars.map((war) => (
          <div
            key={war.id}
            className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-white text-sm">{war.title}</h3>
              <p className="text-xs text-gray-500 font-mono">
                Ends:{" "}
                {war.endDate
                  ? new Date(war.endDate.seconds * 1000).toLocaleDateString(
                      "en-IN",
                      { timeZone: "Asia/Kolkata" },
                    )
                  : "N/A"}
              </p>
            </div>
            <button
              onClick={() => handleEndWar(war)}
              className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/50 flex items-center gap-2"
            >
              🛑 END WAR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 🛑 MAIN PAGE COMPONENT
const AdminCompetition = () => {
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    colleges: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);

  const handleCreateWar = async (e) => {
    e.preventDefault();

    if (
      !formData.slug ||
      !formData.title ||
      !formData.colleges ||
      !formData.endDate
    ) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const endTimestamp = Timestamp.fromDate(new Date(formData.endDate));
      const collegesArray = formData.colleges.split(",").map((c) => c.trim());

      await setDoc(doc(db, "competitions", formData.slug), {
        title: formData.title,
        colleges: collegesArray,
        endDate: endTimestamp,
        status: "active",
        createdAt: Timestamp.now(),
      });

      toast.success(`🎉 Competition "${formData.title}" created successfully!`);

      // Reset form
      setFormData({
        slug: "",
        title: "",
        colleges: "",
        endDate: "",
      });

      // Reload page to refresh the "Active Wars" list (simple fix)
      window.location.reload();
    } catch (error) {
      console.error("Error creating competition:", error);
      toast.error("Failed to create competition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-32 pt-20">
      {/* Header */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-8 h-8 text-neon-purple" />
          <h1 className="text-2xl font-black font-['Orbitron'] text-white uppercase italic">
            War Control Center
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Create and manage college competitions
        </p>
      </div>

      {/* Form */}
      <div className="px-4 max-w-2xl mx-auto">
        <form onSubmit={handleCreateWar} className="space-y-4">
          {/* Slug (ID) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Hash className="w-3 h-3" />
              Competition Slug (ID)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="ahmedabad-wars-s1"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon-purple transition-colors"
            />
            <p className="text-[10px] text-gray-600">
              Lowercase, hyphens only. This will be the URL identifier.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Trophy className="w-3 h-3" />
              Competition Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ahmedabad War Season 1"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>

          {/* Colleges */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Users className="w-3 h-3" />
              Participating Colleges
            </label>
            <input
              type="text"
              value={formData.colleges}
              onChange={(e) =>
                setFormData({ ...formData, colleges: e.target.value })
              }
              placeholder="Nirma University, HL College, Ahmedabad University"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-purple transition-colors"
            />
            <p className="text-[10px] text-gray-600">
              Comma-separated list. Exact spelling matters.
            </p>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-neon-purple to-pink-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_10px_30px_rgba(168,85,247,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                Launch Competition
              </>
            )}
          </button>
        </form>

        {/* 👇 THE MANAGER IS HERE */}
        <ActiveWarsManager />

        {/* Info Box */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="text-yellow-500 mt-0.5">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-xs text-yellow-500/90 leading-relaxed">
              <strong className="font-bold">Pro Tip:</strong> Once created, the
              competition will be live immediately. Users will see the countdown
              timer based on the end date you set. The slug you choose will be
              the URL path.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCompetition;
