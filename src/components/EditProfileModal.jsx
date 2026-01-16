import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Edit3,
  MapPin,
  Shield,
  Star,
  Save,
  Zap,
  RefreshCw,
} from "lucide-react";
import { updateHeroProfile } from "../backend/firebaseService";
import HeroAvatar from "./HeroAvatar";
import { getTier } from "../utils/xp";

const EditProfileModal = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    heroClass: user.heroClass || "Novice",
    bio: user.bio || "Searching for epic quests...",
    city: user.city || "Ahmedabad",
    gender: user.gender || "",
    avatarSeed: user.avatarSeed || user.name || user.uid,
  });
  const [loading, setLoading] = useState(false);

  const heroClasses = [
    "Novice",
    "Guardian",
    "Rogue",
    "Mage",
    "Tactician",
    "Bard",
  ];
  const cities = ["Ahmedabad", "Mumbai", "Delhi", "Bangalore"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHeroProfile(user.uid, formData);
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-md glassmorphism border border-white/10 rounded-[2.5rem] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white/5 px-8 py-6 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-xl font-['Orbitron'] font-black text-white uppercase italic">
              Edit Hero
            </h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
              Update your identity
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 mb-2">
            <HeroAvatar
              seed={formData.avatarSeed}
              tierName={getTier(user.level || 1).name}
              size={120}
            />
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  avatarSeed: Math.random().toString(36).substring(7),
                })
              }
              className="px-4 py-2 glassmorphism rounded-xl border border-neon-purple/30 text-neon-purple text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neon-purple/10 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Randomize Look
            </button>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-1">
              Hero Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-purple" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white font-bold focus:border-neon-purple outline-none transition-all"
                placeholder="Enter Hero Name"
              />
            </div>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-1">
              Hero Bio / Motto
            </label>
            <div className="relative">
              <Edit3 className="absolute left-4 top-4 w-4 h-4 text-neon-purple" />
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white font-bold focus:border-neon-purple outline-none transition-all h-24 resize-none"
                placeholder="Declare your purpose..."
              />
            </div>
          </div>

          {/* Class, Gender, & Location Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-1">
                Hero Class
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neon-purple" />
                <select
                  value={formData.heroClass}
                  onChange={(e) =>
                    setFormData({ ...formData, heroClass: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-2 py-4 text-xs font-bold appearance-none focus:border-neon-purple outline-none"
                >
                  {heroClasses.map((c) => (
                    <option key={c} value={c} className="bg-dark-bg">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-1">
                Gender
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neon-purple" />
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-2 py-4 text-xs font-bold appearance-none focus:border-neon-purple outline-none"
                >
                  <option value="" disabled className="bg-dark-bg">
                    Select
                  </option>
                  <option value="male" className="bg-dark-bg">
                    Male
                  </option>
                  <option value="female" className="bg-dark-bg">
                    Female
                  </option>
                  <option value="other" className="bg-dark-bg">
                    Other
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-1">
                Realm
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neon-purple" />
                <select
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-2 py-4 text-xs font-bold appearance-none focus:border-neon-purple outline-none"
                >
                  {cities.map((c) => (
                    <option key={c} value={c} className="bg-dark-bg">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neon-purple text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(168,85,247,0.3)] active:scale-95 transition-all overflow-hidden relative group disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span className="uppercase tracking-widest text-sm italic font-['Orbitron']">
                  Update Identity
                </span>
              </>
            )}
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditProfileModal;
