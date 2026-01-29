import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { X, Check, Frame, Crown, Sparkles } from "lucide-react";
import { getBorderConfig, BORDER_DEFINITIONS } from "../utils/borderStyles";
import { getTier } from "../utils/xp";
import { db } from "../backend/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import HeroAvatar from "./HeroAvatar";
import AvatarFrame from "./AvatarFrame";
import { getLevelProgress } from "../utils/leveling";
import { COSMETIC_METADATA } from "../utils/cosmetics";

const BorderSelectorModal = ({
  isOpen,
  onClose,
  user,
  equipFrame,
  equippedFrame,
  inventory,
}) => {
  const [selectedBorder, setSelectedBorder] = useState(null);
  const [allBorders, setAllBorders] = useState([]);
  const [isSaving, setIsSaving] = useState(false);



  // 1. COMPILE UNIFIED LIST (Rank Borders + Cosmetic Frames)
  useEffect(() => {
    if (!user) return;

    // Calculate current tier
    const { level: calcLevel } = getLevelProgress(
      user.lifetimeXP || user.xp || 0,
    );
    const currentTierName = getTier(calcLevel).name;

    const unified = [];

    // A. Add Rank Borders
    Object.keys(BORDER_DEFINITIONS).forEach((key) => {
      const def = BORDER_DEFINITIONS[key];
      let isOwned = false;

      // Own if matches tier, active border, or in inventory
      if (key === currentTierName) isOwned = true;
      if (key === user.activeBorder) isOwned = true;
      if (user.inventory?.borders?.includes(key)) isOwned = true;

      if (isOwned) {
        unified.push({
          id: key,
          type: "rank",
          label: def.name,
          isPremium: false,
        });
      }
    });

    // B. Add Cosmetic Frames
    const cosmeticFrames = inventory?.frames || [];
    
    // Explicitly Log the processing of frames
    console.log("🔍 [BorderModal] Processing Frames:", cosmeticFrames);

   

    cosmeticFrames.forEach((frameId) => {
      const metadata = COSMETIC_METADATA[frameId] || {
        label: frameId.replace(/_/g, " "),
        icon: "🎨",
      };

      unified.push({
        id: frameId,
        type: "cosmetic",
        label: metadata.label,
        icon: metadata.icon,
        isPremium: true,
      });
    });
    
    console.log("✅ [BorderModal] Final Unified List:", unified);
    setAllBorders(unified);
  }, [user, inventory]);

  // 2. SET INITIAL SELECTION
  useEffect(() => {
    if (isOpen && user) {
      if (equippedFrame) {
        setSelectedBorder(equippedFrame);
      } else {
        const { level: calcLevel } = getLevelProgress(
          user.lifetimeXP || user.xp || 0,
        );
        const currentTierName = getTier(calcLevel).name;
        setSelectedBorder(user.activeBorder || currentTierName);
      }
    }
  }, [isOpen, equippedFrame, user]);

  const handleEquip = async () => {
    if (!user?.uid || !selectedBorder) return;
    setIsSaving(true);
    const toastId = toast.loading("Equipping...");

    try {
      const selectedItem = allBorders.find((b) => b.id === selectedBorder);

      if (!selectedItem) {
        throw new Error("Selected border not found");
      }

      const userRef = doc(db, "users", user.uid);

      if (selectedItem.type === "cosmetic") {
        await equipFrame(selectedBorder);
      } else if (selectedItem.type === "rank") {
        await equipFrame(null);
        await updateDoc(userRef, {
          activeBorder: selectedBorder,
        });
      }

      toast.success(`${selectedItem.label} Equipped!`, { id: toastId });
      onClose();
    } catch (err) {
      console.error("Error equipping:", err);
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
        className="relative bg-[#15171E] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
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
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
            {allBorders.map((option) => {
              const isSelected = selectedBorder === option.id;
              const tierName = getTier(user.level || 1).name;

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
                  {/* Premium Badge */}
                  {option.isPremium && (
                    <div className="absolute top-1 left-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-1 z-20">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* PREVIEW CONTAINER */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    {option.type === "rank" ? (
                      <>
                        <motion.div
                          className={`absolute inset-[-4px] rounded-full ${getBorderConfig(option.id, tierName).style}`}
                          style={{
                            boxShadow: getBorderConfig(option.id, tierName).shadow,
                            filter: getBorderConfig(option.id, tierName).filter,
                          }}
                          animate={getBorderConfig(option.id, tierName).animate}
                          transition={getBorderConfig(option.id, tierName).transition}
                        />
                        <div className="relative w-full h-full rounded-full overflow-hidden z-10 bg-[#15171E]">
                          <HeroAvatar
                            user={user}
                            tierName="Recruit"
                            size={64}
                            className="w-full h-full"
                            hideBorder={true}
                          />
                        </div>
                      </>
                    ) : (
                      <AvatarFrame frameId={option.id} size="md">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#15171E]">
                          <HeroAvatar
                            user={user}
                            tierName="Recruit"
                            size={56}
                            className="w-full h-full"
                            hideBorder={true}
                          />
                        </div>
                      </AvatarFrame>
                    )}
                  </div>

                  <div className="text-center mt-2">
                    <div
                      className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-white" : "text-gray-400"}`}
                    >
                      {option.label}
                    </div>
                    <div className="text-[8px] text-gray-600 uppercase mt-0.5">
                      {option.type === "rank" ? "Rank" : "Premium"}
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-3 flex-shrink-0 bg-[#15171E]">
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
            {isSaving ? "Saving..." : "Equip Selected"}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default BorderSelectorModal;