import { motion } from "framer-motion";
import { MapPin, Globe, Coffee, Zap, Moon, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const WorldGuide = () => {
  const zones = [
    {
      id: "sbr",
      title: "Sindhu Bhavan Road (SBR)",
      tagline: "The Neon Strip",
      desc: "The pulsating heart of Ahmedabad's nightlife. High-end cafes, luxury boutiques, and the most exclusive quests await.",
      tags: ["Vibrant", "Premium", "Late-Night"],
      color: "purple",
      icon: Zap,
    },
    {
      id: "maninagar",
      title: "Maninagar District",
      tagline: "The Old Guard",
      desc: "A blend of traditional values and new-age hustle. Missions here often involve community service and food exploration.",
      tags: ["Community", "Foodie", "Bustling"],
      color: "orange",
      icon: Globe,
    },
    {
      id: "university",
      title: "University Area",
      tagline: "The Think Tank",
      desc: "Home to scholars and endless coffee debates. Perfect for intellectual quests and hackathons.",
      tags: ["Academic", "Chill", "Wifi-Heavy"],
      color: "blue",
      icon: BookOpen,
    },
    {
      id: "riverfront",
      title: "Riverfront Promenade",
      tagline: "The Serene Flow",
      desc: "Where the city breathes. Fitness challenges and introspection missions are common here.",
      tags: ["Scenic", "Fitness", "Outdoor"],
      color: "green",
      icon: Moon,
    },
  ];

  return (
    <div className="app-container min-h-screen bg-dark-bg pb-24">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 relative">
        <Link
          to="/board"
          className="absolute top-8 left-6 text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-black tracking-widest"
        >
          ← Back to Base
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <div className="inline-block p-3 bg-neon-purple/10 rounded-2xl border border-neon-purple/30 mb-4">
            <Globe className="w-8 h-8 text-neon-purple shadow-[0_0_15px_#a855f7]" />
          </div>
          <h1 className="text-4xl font-['Orbitron'] font-black text-white italic tracking-tighter uppercase mb-2">
            World Guide
          </h1>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] font-black">
            Classified Zone Intel
          </p>
        </motion.div>
      </div>

      {/* Zones Grid */}
      <div className="px-4 space-y-6">
        {zones.map((zone, i) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-[#15171E] rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-${zone.color}-500/50 transition-colors`}
          >
            {/* Background Gradient */}
            <div
              className={`absolute top-0 right-0 w-48 h-48 bg-${zone.color}-500/5 rounded-full blur-3xl group-hover:bg-${zone.color}-500/10 transition-colors`}
            />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-2xl bg-${zone.color}-500/10 text-${zone.color}-400`}
                >
                  <zone.icon className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  {zone.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-black uppercase tracking-wider bg-black/40 px-2 py-1 rounded text-gray-400 border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h2 className="text-xl font-['Orbitron'] font-black text-white uppercase italic tracking-tighter mb-1">
                {zone.title}
              </h2>
              <div
                className={`text-[10px] font-black uppercase tracking-widest text-${zone.color}-500 mb-3`}
              >
                {zone.tagline}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-sans">
                {zone.desc}
              </p>
            </div>

            {/* Hover decorative line */}
            <div
              className={`absolute bottom-0 left-0 h-1 bg-${zone.color}-500 w-0 group-hover:w-full transition-all duration-500`}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WorldGuide;
