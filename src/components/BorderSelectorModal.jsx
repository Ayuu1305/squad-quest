import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { X, Check, Frame } from "lucide-react";
import { getBorderConfig, BORDER_DEFINITIONS } from "../utils/borderStyles";
import { getTier } from "../utils/xp";
import { db } from "../backend/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
// Import your actual Avatar component
import HeroAvatar from "./HeroAvatar";

import { getLevelProgress } from "../utils/leveling";

const BorderSelectorModal = ({ isOpen, onClose, user }) => {
  const [selectedBorder, setSelectedBorder] = useState(null);
  const [availableBorders, setAvailableBorders] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // 1. COMPILE LIST (Run when user data loads)
  useEffect(() => {
    if (!user) return;

    // Fix: Calculate level dynamically from XP
    const { level: calcLevel } = getLevelProgress(
      user.lifetimeXP || user.xp || 0,
    );
    const currentTierName = getTier(calcLevel).name;

    const available = [];

    Object.keys(BORDER_DEFINITIONS).forEach((key) => {
      const def = BORDER_DEFINITIONS[key];
      let isOwned = false;

      // Logic: Own if matches calculated tier, active border, or in inventory
      if (key === currentTierName) isOwned = true;
      if (key === user.activeBorder) isOwned = true;
      // Check Inventory (All paths)
      if (user.inventory?.frames?.includes(key)) isOwned = true;
      if (user.inventory?.borders?.includes(key)) isOwned = true;
      if (user.inventory?.items?.includes(key)) isOwned = true;

      if (isOwned) {
        available.push({ id: key, label: def.name });
      }
    });
    setAvailableBorders(available);
  }, [user]);

  // 2. SET INITIAL SELECTION (Fix: Run ONLY when 'isOpen' turns true)
  useEffect(() => {
    if (isOpen && user) {
      // Fix: Calculate level dynamically from XP here too
      const { level: calcLevel } = getLevelProgress(
        user.lifetimeXP || user.xp || 0,
      );
      const currentTierName = getTier(calcLevel).name;

      // Default to activeBorder, or fallback to their Tier Name
      setSelectedBorder(user.activeBorder || currentTierName);
    }
  }, [isOpen]); // Removed 'user' dependency to prevent auto-resetting while clicking

  const handleEquip = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    const toastId = toast.loading("Equipping Border...");

    try {
      const userRef = doc(db, "users", user.uid);

      // FIX: Always save the specific ID (e.g., "Silver", "Gold", "golden_glitch").
      // We DO NOT convert to null anymore. This forces the Leaderboard to
      // respect the user's choice immediately, bypassing any XP calculation lag.
      const valueToSave = selectedBorder;

      await updateDoc(userRef, {
        activeBorder: valueToSave,
      });

      toast.success("Border Equipped!", { id: toastId });
      onClose();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to equip", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#15171E] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-['Orbitron'] font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Frame className="w-5 h-5 text-neon-purple" />
            Border Collection
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
          {availableBorders.map((option) => {
            const isSelected = selectedBorder === option.id;
            const tierName = getTier(user.level || 1).name;
            const config = getBorderConfig(option.id, tierName);

            return (
              <button
                key={option.id}
                onClick={() => setSelectedBorder(option.id)}
                className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                  isSelected
                    ? "border-neon-purple bg-neon-purple/5"
                    : "border-white/5 bg-white/5 hover:bg-white/10"
                }`}
              >
                {/* PREVIEW CONTAINER */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {/* Layer 1: Animated Border (Background) */}
                  <motion.div
                    className={`absolute inset-[-4px] rounded-full ${config.style}`}
                    style={{ boxShadow: config.shadow, filter: config.filter }}
                    animate={config.animate}
                    transition={config.transition}
                  />

                  {/* Layer 2: Static HeroAvatar (Foreground) */}
                  {/* We force a standard size and clip overflow to ensure the Avatar stays inside */}
                  <div className="relative w-full h-full rounded-full overflow-hidden z-10 bg-[#15171E]">
                    {/* We pass 'Recruit' as tierName so the Avatar renders minimally 
                         without its own large rank borders interfering */}
                    <HeroAvatar
                      user={user}
                      tierName="Recruit"
                      size={64}
                      className="w-full h-full"
                      hideBorder={true}
                    />
                  </div>
                </div>

                <div className="text-center mt-2">
                  <div
                    className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-white" : "text-gray-400"}`}
                  >
                    {option.label}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-neon-purple rounded-full p-0.5 z-20">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:text-white uppercase text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleEquip}
            disabled={isSaving}
            className="flex-1 py-3 bg-neon-purple hover:bg-neon-purple/80 rounded-xl font-black text-white uppercase text-xs flex items-center justify-center gap-2"
          >
            {isSaving ? "Saving..." : "Equip Border"}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default BorderSelectorModal;
