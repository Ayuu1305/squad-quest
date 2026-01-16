import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, Flame, Gift } from "lucide-react";

const DailyMissions = () => {
  const [streak, setStreak] = useState(0);
  const [missions, setMissions] = useState([
    {
      id: 1,
      label: "Join a Squad Quest",
      completed: false,
      xp: 50,
    },
    {
      id: 2,
      label: "high-five a Stranger",
      completed: false,
      xp: 30,
    },
    {
      id: 3,
      label: "Visit a new Zone",
      completed: false,
      xp: 40,
    },
  ]);

  useEffect(() => {
    // Load streak from local storage
    const savedStreak = localStorage.getItem("sq_daily_streak");
    if (savedStreak) setStreak(parseInt(savedStreak));

    // Check if missions were completed today (basic mock check)
    // In a real app, this would reset daily
  }, []);

  const toggleMission = (id) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const allCompleted = missions.every((m) => m.completed);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
          Daily Bounty
        </h3>
        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg">
          <Flame
            className={`w-3.5 h-3.5 text-orange-500 ${
              allCompleted ? "animate-bounce" : ""
            }`}
          />
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">
            {streak} Day Streak
          </span>
        </div>
      </div>

      <div className="bg-[#15171E] border border-white/5 rounded-2xl p-4 relative overflow-hidden">
        {allCompleted && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
        )}

        <div className="space-y-3 relative z-10">
          {missions.map((mission) => (
            <motion.div
              key={mission.id}
              initial={false}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                mission.completed
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
              onClick={() => toggleMission(mission.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                    mission.completed
                      ? "bg-green-500 text-black"
                      : "bg-white/10 text-transparent group-hover:bg-white/20"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                    mission.completed
                      ? "text-green-400 line-through decoration-green-500/50"
                      : "text-gray-300"
                  }`}
                >
                  {mission.label}
                </span>
              </div>
              <span
                className={`text-[9px] font-black font-mono px-2 py-1 rounded bg-black/20 ${
                  mission.completed ? "text-green-500" : "text-gray-500"
                }`}
              >
                +{mission.xp} XP
              </span>
            </motion.div>
          ))}
        </div>

        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-orange-400"
          >
            <Gift className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Bonus Unlocked!
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DailyMissions;
