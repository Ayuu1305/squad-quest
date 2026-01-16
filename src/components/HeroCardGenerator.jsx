import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import {
  Download,
  Share2,
  Zap,
  Star,
  ShieldCheck,
  Github,
  Twitter,
  Youtube,
  MessageSquare,
  Phone,
  Globe,
  ExternalLink,
  QrCode,
  Instagram,
} from "lucide-react";
import {
  getTier,
  getAttrTier,
  getHonorRank,
  getReliabilityColor,
  BADGE_TIERS,
} from "../utils/xp";
import HeroAvatar from "./HeroAvatar";

const HeroCardGenerator = ({ user, showActions = true }) => {
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // Derive attribute data
  const attributes = [
    { label: "Social", xp: user.socialXP || 200, icon: Zap },
    { label: "Vibe", xp: user.vibeXP || 650, icon: Star },
    { label: "Energy", xp: user.energyXP || 1400, icon: Zap },
    { label: "Intel", xp: user.intelXP || 100, icon: Zap },
  ].map((attr) => ({ ...attr, tier: getAttrTier(attr.xp) }));

  // Get Top 3 highest tiered attributes
  const topAttributes = [...attributes].sort((a, b) => b.xp - a.xp).slice(0, 3);

  const highestTier = getTier(user.level || 1);
  const honor = getHonorRank(user.reliabilityScore || 100);

  const HexSlot = ({ attr }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-[70px]">
        {/* Hexagonal Background */}
        <div
          className="absolute inset-0 bg-white/5"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            border: `1px solid ${attr.tier.hex}44`,
          }}
        />

        {/* Tier Specific Visuals */}
        <div
          className="absolute inset-[2px] flex items-center justify-center overflow-hidden"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background:
              attr.tier.name === "Bronze"
                ? "rgba(255,255,255,0.05)"
                : attr.tier.name === "Silver"
                ? "linear-gradient(135deg, #94a3b8, #f1f5f9, #64748b)"
                : attr.tier.name === "Gold"
                ? "linear-gradient(135deg, #fbbf24, #fff9c4, #b45309)"
                : "linear-gradient(135deg, #a855f7, #e879f9, #6b21a8)",
          }}
        >
          <attr.icon
            className={`w-6 h-6 ${
              attr.tier.name === "Bronze" ? attr.tier.color : "text-black/80"
            }`}
          />

          {/* Legendary Aura */}
          {attr.tier.name === "Legendary" && (
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white/30"
            />
          )}
        </div>
      </div>
      <div
        className={`text-[8px] font-black font-mono mt-2 uppercase ${attr.tier.color}`}
      >
        {attr.tier.name} {attr.label}
      </div>
    </div>
  );

  const downloadCard = async () => {
    if (cardRef.current === null) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `hero-card-${(user.name || "Hero")
        .replace(/\s+/g, "-")
        .toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const shareToWhatsApp = () => {
    const text = `Check out my ${highestTier.name} Hero Card in Ahmedabad! Join my Squad for the next Quest here: ${window.location.origin}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center">
      {/* ... (The Trading Card) ... */}
      <div className="relative group perspective">
        {/* ... card content ... */}
        <div
          ref={cardRef}
          className="relative w-[340px] h-[620px] glassmorphism-dark rounded-[2.5rem] p-8 overflow-hidden border border-white/20 z-10 bg-[#050505] shadow-2xl"
        >
          {/* ... internal card content ... */}
          {/* Rainbow Prism Strike from Image */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div
              className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] opacity-30 rotate-[35deg]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 45%, #a855f7 48%, #ec4899 50%, #8b5cf6 52%, transparent 55%)",
                filter: "blur(60px)",
              }}
            />
          </div>

          {/* Grainy Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

          {/* Operational Header */}
          <div className="relative z-20 flex justify-center mb-8">
            <div className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/30 rounded-full">
              <span className="text-[10px] font-black text-neon-purple uppercase tracking-[0.4em]">
                Operational Dossier
              </span>
            </div>
          </div>

          {/* Profile Section (Reimagined from Image) */}
          <div className="relative z-10 flex flex-col items-center mt-12 mb-8">
            <div className="relative mb-6">
              <HeroAvatar
                seed={user.avatarSeed || user.uid || "hero-default"}
                tierName={highestTier.name}
                size={120}
              />
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-['Orbitron'] font-black text-white mb-1 uppercase tracking-tighter">
                {user.name || "Hero"}
              </h2>
              <div className="text-neon-purple text-xs font-mono font-bold mb-4">
                @squadQuest/{(user.uid || "").slice(0, 8)}
              </div>
              <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                {highestTier.name} Tier - {highestTier.xpRequired || 5000} XP
                Required
              </div>
            </div>

            {/* Social Row from Image */}
            <div className="flex gap-3 mb-8">
              {[MessageSquare, Github, Twitter, Youtube, Phone].map(
                (Icon, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5 text-gray-400"
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                )
              )}
            </div>

            {/* Segmented Progress Bar from Image */}
            <div className="w-full max-w-[200px] mb-8">
              <div className="flex gap-1 mb-2 h-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${
                      i < 3 ? "bg-yellow-500/80" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase">
                <span>[25%]</span>
                <span>[50%]</span>
                <span>[100%]</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-black text-neon-purple italic tracking-[0.3em] animate-pulse mb-8 uppercase">
                Syncing Identity...
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                #OperationalStatus: Active
              </div>
            </div>
          </div>

          {/* Bottom Footer with QR from Image */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div className="text-left">
              <div className="text-[10px] text-neon-purple font-black">
                SQUAD QUEST
              </div>
              <div className="text-[8px] text-gray-600 font-mono">
                #hero/intel/{(user.uid || "").slice(0, 4)}
              </div>
            </div>
            <div className="w-10 h-10 border border-neon-purple/30 rounded-lg p-1 bg-white/5">
              <QrCode className="w-full h-full text-neon-purple opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-8 flex flex-col gap-4 w-full max-w-[340px]">
          {/* Main Action */}
          <button
            onClick={downloadCard}
            disabled={isExporting}
            className="relative w-full py-4 rounded-xl border border-neon-purple bg-neon-purple/10 text-white font-black italic uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:bg-neon-purple/20 transition-all active:scale-95 group overflow-hidden"
          >
            <div className="absolute inset-x-0 h-full w-[20%] bg-white/10 -skew-x-[25deg] -translate-x-[200%] group-hover:translate-x-[500%] transition-all duration-1000 pointer-events-none" />
            <Download className="w-5 h-5 text-neon-purple" />
            {isExporting ? "ENCRYPTING IMAGE..." : "GENERATE OPERATIONAL CARD"}
          </button>

          {/* Social Sharing Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all active:scale-95"
            >
              <div className="bg-[#25D366] p-1 rounded-md">
                <Phone className="w-3 h-3 text-white fill-current" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                WhatsApp
              </span>
            </button>

            <button
              onClick={downloadCard}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-[#833ab4]/10 via-[#fd1d1d]/10 to-[#fcb045]/10 border border-red-500/20 text-white hover:opacity-80 transition-all active:scale-95"
            >
              <div className="bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] p-1 rounded-md">
                <Instagram className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                Instagram
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroCardGenerator;
