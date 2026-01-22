import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Dices, X, RotateCcw } from "lucide-react";
import HeroAvatar from "../HeroAvatar";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { getAuth } from "firebase/auth";

// --- 🎨 MULTI-STYLE CONFIG (Official DiceBear Schemas) ---
const STYLES = {
  adventurer: {
    label: "Adventurer ⚔️",
    traits: {
      skinColor: ["f2d3b1", "ecad80", "d08b5b", "ae5d29", "614335", "9e5622"],
      hair: [
        "short01",
        "short02",
        "short03",
        "short04",
        "short05",
        "short06",
        "short07",
        "short08",
        "short09",
        "short10",
        "long01",
        "long02",
        "long03",
        "long04",
        "long05",
        "long06",
        "long07",
        "long08",
        "long09",
        "long10",
      ],
      eyes: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
      mouth: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
    },
  },
  notionists: {
    label: "Notionist ✏️",
    traits: {
      hair: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
      eyes: ["variant01", "variant02", "variant03", "variant04", "variant05"],
      brows: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
      glasses: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
      body: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
    },
  },
  micah: {
    label: "Micah 🌟",
    traits: {
      hair: [
        "fonze",
        "mrT",
        "dougFunny",
        "mrClean",
        "dannyPhantom",
        "full",
        "turban",
        "pixie",
      ],
      eyes: ["eyes", "round", "eyesShadow", "smiling", "smilingShadow"],
      eyebrows: ["up", "down", "eyelashesUp", "eyelashesDown"],
      mouth: [
        "surprised",
        "laughing",
        "nervous",
        "smile",
        "sad",
        "pucker",
        "frown",
        "smirk",
      ],
    },
  },
  "open-peeps": {
    label: "Open Peeps 👤",
    traits: {
      face: [
        "smile",
        "smileBig",
        "smileLOL",
        "cute",
        "calm",
        "blank",
        "awe",
        "cheeky",
        "driven",
        "serious",
        "tired",
        "old",
      ],
      facialHair: [
        "chin",
        "full",
        "full2",
        "goatee1",
        "goatee2",
        "moustache1",
        "moustache2",
        "moustache3",
      ],
      accessories: [
        "eyepatch",
        "glasses",
        "glasses2",
        "glasses3",
        "sunglasses",
        "sunglasses2",
      ],
    },
  },
  initials: {
    label: "Initials 🔤",
    traits: {
      backgroundColor: [
        "e53935",
        "d81b60",
        "8e24aa",
        "5e35b1",
        "3949ab",
        "1e88e5",
        "00acc1",
        "43a047",
      ],
      fontFamily: [
        "Arial",
        "Verdana",
        "Helvetica",
        "Georgia",
        "Courier New",
        "Times New Roman",
      ],
    },
  },
  lorelei: {
    label: "Lorelei 🎨",
    traits: {
      hair: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
        "variant11",
        "variant12",
        "variant13",
        "variant14",
        "variant15",
      ],
      eyes: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
      eyebrows: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
        "variant06",
        "variant07",
        "variant08",
        "variant09",
        "variant10",
      ],
      glasses: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
      ],
    },
  },
  "fun-emoji": {
    label: "Fun Emoji 😜",
    traits: {
      eyes: [
        "cute",
        "love",
        "wink",
        "wink2",
        "plain",
        "glasses",
        "stars",
        "shades",
        "crying",
        "sleepClose",
      ],
      mouth: [
        "cute",
        "lilSmile",
        "wideSmile",
        "smileTeeth",
        "smileLol",
        "tongueOut",
        "shy",
        "kissHeart",
        "drip",
        "faceMask",
      ],
    },
  },
};

const AvatarEditor = ({ isOpen, onClose }) => {
  const { user, userStats } = useAuth();

  // Determine initial style from saved config or default to 'adventurer'
  const getInitialStyle = () => {
    const saved = userStats?.avatarConfig;
    if (saved?.style && STYLES[saved.style]) {
      return saved.style;
    }
    return "adventurer";
  };

  // Build default config for a given style
  const getDefaultConfig = (styleName) => {
    const styleTraits = STYLES[styleName].traits;
    const config = { style: styleName };
    Object.keys(styleTraits).forEach((trait) => {
      config[trait] = styleTraits[trait][0];
    });
    return config;
  };

  // Initialize state with saved config or default
  const getInitialConfig = () => {
    const saved = userStats?.avatarConfig;
    const styleName = getInitialStyle();
    // If saved config matches current style, use it
    if (saved?.style === styleName) {
      return saved;
    }
    return getDefaultConfig(styleName);
  };

  const [currentStyle, setCurrentStyle] = useState(getInitialStyle());
  const [config, setConfig] = useState(getInitialConfig());
  const [isSaving, setIsSaving] = useState(false);

  // Helper: Get current style's traits
  const currentTraits = STYLES[currentStyle].traits;

  // Switch style: Reset config to new style's defaults
  const handleStyleChange = (newStyle) => {
    setCurrentStyle(newStyle);
    setConfig(getDefaultConfig(newStyle));
  };

  // Cycle through trait options
  const cycleTrait = (trait, direction) => {
    const options = currentTraits[trait];
    const currentIndex = options.indexOf(config[trait]);
    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= options.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = options.length - 1;

    setConfig({ ...config, [trait]: options[nextIndex] });
  };

  // Reroll: Randomize all traits for current style
  const handleReroll = () => {
    const newConfig = { style: currentStyle };
    Object.keys(currentTraits).forEach((trait) => {
      const options = currentTraits[trait];
      newConfig[trait] = options[Math.floor(Math.random() * options.length)];
    });
    setConfig(newConfig);
  };

  // ✅ SECURE SAVE LOGIC (keeps style field!)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) throw new Error("Authentication failed");

      const API_ENDPOINT =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_ENDPOINT}/user/avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarConfig: config }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Avatar Look Updated! 📸");
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save avatar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-xl md:flex md:items-center md:justify-center md:p-4">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-gradient-to-b from-slate-900 to-slate-950 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-3xl border-t md:border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden"
      >
        {/* 🎮 HEADER */}
        <div className="relative p-6 border-b border-white/5 bg-gradient-to-r from-purple-950/20 via-transparent to-purple-950/20 shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCIvPjwvZmVucz4=')] opacity-30" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-['Orbitron'] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                Character Lab
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-purple-500/60 font-mono mt-1">
                Identity Synthesis System v2.0
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-purple-500/20 rounded-xl transition-all border border-white/5 hover:border-purple-500/50"
            >
              <X className="w-5 h-5 text-purple-400" />
            </button>
          </div>
        </div>

        {/* 📜 SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 md:pb-6 md:max-h-[calc(90vh-200px)]">
          {/* 🎨 STYLE GRID */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider font-bold text-purple-400 mb-3 font-mono flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full animate-pulse" />
              Select Avatar Type
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(STYLES).map((styleKey) => (
                <button
                  key={styleKey}
                  onClick={() => handleStyleChange(styleKey)}
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                    currentStyle === styleKey
                      ? "bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                      : "bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10"
                  }`}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    {STYLES[styleKey].label.split(" ")[1] || "✨"}
                  </div>
                  <p
                    className={`text-[11px] font-bold uppercase font-mono transition-colors ${
                      currentStyle === styleKey
                        ? "text-white"
                        : "text-gray-400 group-hover:text-purple-300"
                    }`}
                  >
                    {STYLES[styleKey].label.split(" ")[0]}
                  </p>
                  {currentStyle === styleKey && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 🔮 HOLOGRAPHIC PREVIEW */}
          <div className="relative mb-8">
            <h3 className="text-xs uppercase tracking-wider font-bold text-purple-400 mb-3 font-mono flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full animate-pulse" />
              Avatar Preview
            </h3>

            {/* Holo Base */}
            <div className="relative bg-gradient-to-t from-purple-500/10 via-transparent to-transparent p-8 rounded-3xl border border-purple-500/20">
              {/* Animated Glow Rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-purple-500/20 blur-[60px] rounded-full animate-pulse" />
                <div
                  className="absolute w-40 h-40 border border-purple-500/30 rounded-full animate-spin-slow"
                  style={{ animationDuration: "10s" }}
                />
                <div
                  className="absolute w-52 h-52 border border-purple-500/20 rounded-full animate-spin-slow"
                  style={{
                    animationDuration: "15s",
                    animationDirection: "reverse",
                  }}
                />
              </div>

              {/* Avatar */}
              <div className="relative z-10 flex justify-center">
                <HeroAvatar
                  user={{ ...user, avatarConfig: config }}
                  size={160}
                  className="ring-0 shadow-none"
                />
              </div>

              {/* Reroll Button */}
              <button
                onClick={handleReroll}
                className="absolute bottom-4 right-4 p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/50 hover:scale-110 hover:rotate-12 active:rotate-180 transition-all z-20 border border-white/20"
              >
                <Dices className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ⚙️ TRAIT CONTROLS */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-purple-400 mb-3 font-mono flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full animate-pulse" />
              Customize Traits
            </h3>
            <div className="space-y-2">
              {Object.keys(currentTraits).map((trait) => (
                <div
                  key={trait}
                  className="flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent p-3 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all"
                >
                  <span className="text-[10px] font-black uppercase text-purple-400/80 w-24 truncate font-mono tracking-wider">
                    {trait
                      .replace(/([A-Z])/g, "_$1")
                      .replace("Color", "")
                      .toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cycleTrait(trait, "prev")}
                      className="p-3 hover:bg-purple-500/20 rounded-lg text-purple-300 border border-white/5 hover:border-purple-500/50 transition-all active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="w-24 text-center text-xs font-mono text-white truncate px-2 py-1 bg-black/40 rounded-lg border border-white/10">
                      {config[trait]}
                    </span>
                    <button
                      onClick={() => cycleTrait(trait, "next")}
                      className="p-3 hover:bg-purple-500/20 rounded-lg text-purple-300 border border-white/5 hover:border-purple-500/50 transition-all active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🔘 STICKY ACTION BAR */}
        <div className="fixed md:relative bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent border-t border-purple-500/20 backdrop-blur-xl z-50">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <button
              onClick={handleReroll}
              className="flex-1 py-4 rounded-2xl bg-white/5 text-purple-400 font-bold uppercase text-xs tracking-wider hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black uppercase text-sm tracking-wider transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 active:scale-95 border border-white/20 hover:from-purple-500 hover:to-purple-600"
            >
              {isSaving ? "⚡ Uploading..." : "💾 Save Identity"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AvatarEditor;
