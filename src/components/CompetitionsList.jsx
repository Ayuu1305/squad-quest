import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Trophy,
  ArrowRight,
  AlertTriangle,
  Flame,
  Crown,
  Swords,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

const CompetitionsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for tabs and data
  const [view, setView] = useState("active"); // 'active' | 'history'
  const [competitions, setCompetitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch BOTH Active and Ended Competitions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Active
        const qActive = query(
          collection(db, "competitions"),
          where("status", "==", "active"),
          orderBy("endDate", "asc")
        );
        const snapActive = await getDocs(qActive);
        setCompetitions(snapActive.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch History (Ended)
        const qHistory = query(
          collection(db, "competitions"),
          where("status", "==", "ended"),
          orderBy("endDate", "desc")
        );
        const snapHistory = await getDocs(qHistory);
        setHistory(snapHistory.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching wars:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoinClick = (war) => {
    if (!user) return toast.error("Login required.");
    const userCollege = user?.college?.trim();
    const isParticipant = userCollege && war.colleges.includes(userCollege);

    if (isParticipant) {
      navigate(`/competition/${war.id}`);
      return;
    }

    if (!userCollege) {
      toast((t) => (
        <div className="flex flex-col gap-2 p-2">
          <span className="font-bold text-white">⚠️ Identity Unknown!</span>
          <span className="text-xs text-gray-300">Add your college in profile to join the war.</span>
          <button onClick={() => { toast.dismiss(t.id); navigate("/profile"); }} className="bg-neon-purple text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neon-purple/80 transition-all">Go to Profile</button>
        </div>
      ), { icon: "🎓", duration: 5000, style: { background: "#1a1a2e", border: "1px solid rgba(168, 85, 247, 0.3)" } });
      return;
    }

    if (!war.colleges.includes(userCollege)) {
      toast.error(`🚫 Access Denied: "${userCollege}" is not participating.`, { duration: 4000, style: { background: "#1a1a2e", color: "#fff", border: "1px solid rgba(255, 0, 0, 0.3)" } });
      return;
    }
  };

  const getDuration = (endDate) => {
    if (!endDate) return "Unknown";
    const diff = endDate.toDate() - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} Days` : "Ending Soon";
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-4 md:px-6 pb-20 mt-4">
      
      {/* 🟢 TOGGLE TABS */}
      <div className="flex gap-6 border-b border-white/10 mb-6 max-w-2xl mx-auto">
        <button 
          onClick={() => setView("active")}
          className={`pb-3 text-sm font-bold tracking-wider transition-colors ${view === "active" ? "text-neon-purple border-b-2 border-neon-purple" : "text-gray-500 hover:text-gray-300"}`}
        >
          ACTIVE BATTLES
        </button>
        <button 
          onClick={() => setView("history")}
          className={`pb-3 text-sm font-bold tracking-wider transition-colors ${view === "history" ? "text-neon-purple border-b-2 border-neon-purple" : "text-gray-500 hover:text-gray-300"}`}
        >
          HALL OF FAME
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-8">
        
        {/* ⚔️ ACTIVE WARS VIEW */}
        {view === "active" && (
          <>
            {competitions.length === 0 ? (
              <div className="text-center p-8 bg-white/5 border border-white/10 rounded-2xl">
                 <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                 <p className="text-gray-400 font-bold">No Active Wars</p>
                 <p className="text-xs text-gray-500 mt-1">Check back later for new seasons.</p>
              </div>
            ) : (
              competitions.map((war) => {
                const userCollege = user?.college?.trim();
                const hasJoined = userCollege && war.colleges.includes(userCollege);

                return (
                  <div key={war.id} className="relative glassmorphism border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 via-transparent to-red-500/20 animate-pulse" />
                    <div className="relative z-10 p-8 space-y-6">
                      <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Live Battle</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-['Orbitron'] font-black text-white italic uppercase tracking-tighter leading-tight">{war.title}</h2>
                        <p className="text-gray-400 text-xs uppercase tracking-widest font-black">Season 1 • Inter-College XP Battle</p>
                      </div>

                      <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <Crown className="w-6 h-6 text-yellow-500" />
                          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">Prize Pool</span>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-black font-['Orbitron'] text-yellow-500 italic mb-2">₹5,000</div>
                          <p className="text-gray-500 text-[9px] uppercase tracking-widest">+ Exclusive Digital Badges</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-center"><span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Competing Colleges</span></div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {war.colleges.map((college) => (
                            <div key={college} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
                              <div className="text-[10px] font-black text-white uppercase">{college.split(" ")[0]}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Duration</div>
                          <div className="text-lg font-black font-['Orbitron'] text-white italic">{getDuration(war.endDate)}</div>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</div>
                          <div className="text-lg font-black font-['Orbitron'] text-green-500 italic flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Active</div>
                        </div>
                      </div>

                      <button onClick={() => handleJoinClick(war)} className={`w-full font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_10px_30px_rgba(168,85,247,0.4)] active:scale-95 transition-all overflow-hidden relative group ${hasJoined ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_5px_20px_rgba(34,197,94,0.3)]" : "bg-gradient-to-r from-neon-purple to-pink-500 shadow-[0_5px_20px_rgba(168,85,247,0.3)]"}`}>
                        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                        {hasJoined ? (
                          <>
                            <Swords className="w-4 h-4 relative z-10" />
                            <span className="uppercase tracking-widest text-xs md:text-sm italic font-['Orbitron'] relative z-10">Enter War Room</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 relative z-10" />
                            <span className="uppercase tracking-widest text-xs md:text-sm italic font-['Orbitron'] relative z-10">Join War</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* How It Works (Only show in Active view) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 space-y-4">
              <h3 className="text-center text-sm font-black text-white uppercase tracking-widest">How It Works</h3>
              <div className="grid gap-3">
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                   <div className="w-8 h-8 bg-neon-purple/20 border border-neon-purple rounded-full flex items-center justify-center flex-shrink-0"><span className="text-neon-purple font-black text-xs">1</span></div>
                   <div><div className="text-white font-bold text-xs mb-1">Complete Quests</div><div className="text-gray-500 text-[10px] leading-relaxed">Earn XP by completing any quest in Ahmedabad</div></div>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                   <div className="w-8 h-8 bg-neon-purple/20 border border-neon-purple rounded-full flex items-center justify-center flex-shrink-0"><span className="text-neon-purple font-black text-xs">2</span></div>
                   <div><div className="text-white font-bold text-xs mb-1">Contribute to College</div><div className="text-gray-500 text-[10px] leading-relaxed">Your XP automatically adds to your college's total score</div></div>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                   <div className="w-8 h-8 bg-neon-purple/20 border border-neon-purple rounded-full flex items-center justify-center flex-shrink-0"><span className="text-neon-purple font-black text-xs">3</span></div>
                   <div><div className="text-white font-bold text-xs mb-1">Win Prizes</div><div className="text-gray-500 text-[10px] leading-relaxed">College with most XP wins the prize pool at week's end</div></div>
                 </div>
              </div>
            </motion.div>
          </>
        )}

        {/* 🏛️ HALL OF FAME VIEW */}
        {view === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl">
                 <Swords className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                 <p className="text-gray-500 font-bold">No Wars Recorded Yet</p>
                 <p className="text-xs text-gray-600 mt-1">Past winners will appear here.</p>
              </div>
            ) : (
              history.map(war => (
                <div 
                  key={war.id} 
                  onClick={() => navigate(`/competition/${war.id}`)} // 👈 ADDED THIS CLICK HANDLER
                  className="cursor-pointer bg-gradient-to-r from-slate-900 to-slate-900 border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-yellow-500/50 transition-all hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Trophy Icon */}
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-600 p-3 rounded-xl shadow-lg shadow-orange-500/20 relative z-10">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>

                  <div className="relative z-10 flex-1">
                    <h3 className="text-white font-bold font-['Orbitron'] uppercase italic tracking-wide text-sm">{war.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Crown className="w-3 h-3 text-yellow-500" />
                      <p className="text-xs text-yellow-500 font-bold font-mono uppercase">
                        {war.winner || "Unknown Winner"}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Ended: {war.endedAt ? new Date(war.endedAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>

                  {/* Score Badge */}
                  <div className="relative z-10 text-right">
                    <div className="text-lg font-black text-white font-mono">{war.finalStandings?.[0]?.totalXP.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Winning Score</div>
                    <div className="text-[9px] text-neon-purple mt-1 flex items-center justify-end gap-1 group-hover:underline">
                        View Results <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default CompetitionsList;