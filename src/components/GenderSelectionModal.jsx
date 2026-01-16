import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Users, ShieldAlert } from "lucide-react";
import { updateHeroProfile } from "../backend/firebaseService";
import { useAuth } from "../context/AuthContext";

const GenderSelectionModal = () => {
  const { user } = useAuth();
  const [selectedGender, setSelectedGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenderSelect = async () => {
    if (!selectedGender) return;
    setLoading(true);
    setError(null);

    try {
      await updateHeroProfile(user.uid, {
        gender: selectedGender,
      });
      // The auth context listener should automatically update the user state, closing this modal
    } catch (err) {
      console.error("Failed to update gender:", err);
      setError("Failed to save selection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-bg border-2 border-neon-purple/50 rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
      >
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple blur-[80px] opacity-20" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-purple/50">
            <User className="w-8 h-8 text-neon-purple" />
          </div>
          <h2 className="text-2xl font-black font-['Orbitron'] text-white italic tracking-wider mb-2">
            IDENTITY PROTOCOL
          </h2>
          <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">
            One-time verification required
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => setSelectedGender("male")}
            className={`w-full py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-between group ${
              selectedGender === "male"
                ? "bg-neon-purple/20 border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                : "bg-black/40 border-white/10 hover:border-white/30"
            }`}
          >
            <span className="font-black italic text-white uppercase tracking-wider">
              Male
            </span>
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                selectedGender === "male"
                  ? "border-neon-purple bg-neon-purple"
                  : "border-gray-600"
              }`}
            />
          </button>

          <button
            onClick={() => setSelectedGender("female")}
            className={`w-full py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-between group ${
              selectedGender === "female"
                ? "bg-neon-purple/20 border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                : "bg-black/40 border-white/10 hover:border-white/30"
            }`}
          >
            <span className="font-black italic text-white uppercase tracking-wider">
              Female
            </span>
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                selectedGender === "female"
                  ? "border-neon-purple bg-neon-purple"
                  : "border-gray-600"
              }`}
            />
          </button>

          <button
            onClick={() => setSelectedGender("other")}
            className={`w-full py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-between group ${
              selectedGender === "other"
                ? "bg-neon-purple/20 border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                : "bg-black/40 border-white/10 hover:border-white/30"
            }`}
          >
            <span className="font-black italic text-white uppercase tracking-wider">
              Other / Prefer Not to Say
            </span>
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                selectedGender === "other"
                  ? "border-neon-purple bg-neon-purple"
                  : "border-gray-600"
              }`}
            />
          </button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-[10px] text-yellow-500/80 uppercase font-mono leading-relaxed">
            Changing your biological designation later requires Admin Override.
            Choose carefully.
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-xs text-center font-bold mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGenderSelect}
          disabled={!selectedGender || loading}
          className={`w-full py-4 rounded-xl font-['Orbitron'] font-black italic tracking-widest uppercase transition-all ${
            !selectedGender || loading
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-neon-purple text-white hover:bg-neon-purple/80 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          }`}
        >
          {loading ? "Aligning..." : "Confirm Identity"}
        </button>
      </motion.div>
    </div>
  );
};

export default GenderSelectionModal;
