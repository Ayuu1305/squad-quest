import { Users, MapPin, Clock, Gift, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import HeroAvatar from "./HeroAvatar";
import { getTier } from "../utils/xp";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Tilt from "react-parallax-tilt";

const QuestCard = ({ quest, hub, isMyMission = false }) => {
  const [memberAvatars, setMemberAvatars] = useState([]);
  const [members, setMembers] = useState([]); // Use state for members
  const maxPlayers = quest.maxPlayers || 5;
  const slotsRemaining = maxPlayers - members.length;
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const glowRef = useRef(null);

  // Subscribe to Members Subcollection
  useEffect(() => {
  if (!quest.id) return;

  const membersRef = collection(db, "quests", quest.id, "members");

  const unsubscribe = onSnapshot(
    membersRef,
    (snapshot) => {
      const memberIds = snapshot.docs.map((doc) => doc.id);
      setMembers(memberIds);
    },
    (error) => {
      if (error?.code === "permission-denied") return;
      console.warn("Members listener error:", error);
    }
  );

  return unsubscribe;
}, [quest.id]);


  // Rarity styling logic for missions
  const getRarity = (difficulty = 1) => {
    switch (difficulty) {
      case 5:
        return {
          msg: "LEGENDARY",
          color: "#a855f7",
          shadow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
        };
      case 4:
        return {
          msg: "EPIC",
          color: "#ec4899",
          shadow: "shadow-[0_0_20px_rgba(236,72,153,0.3)]",
        };
      case 3:
        return {
          msg: "RARE",
          color: "#3b82f6",
          shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        };
      case 2:
        return {
          msg: "UNCOMMON",
          color: "#10b981",
          shadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        };
      default:
        return {
          msg: "COMMON",
          color: "#9ca3af",
          shadow: "shadow-none",
        };
    }
  };

  const rarity = getRarity(quest.difficulty || 1);

  // GSAP Animations
  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    // Floating animation for High Rarity
    if (quest.difficulty >= 4) {
      gsap.to(card, {
        y: -5,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    // Glitch Effect on Title Hover
    const hoverCtx = gsap.context(() => {
      card.addEventListener("mouseenter", () => {
        gsap.to(titleRef.current, {
          skewX: 10,
          duration: 0.1,
          yoyo: true,
          repeat: 3,
          color: rarity.color,
          onComplete: () =>
            gsap.to(titleRef.current, { skewX: 0, color: "white" }),
        });
      });
    }, cardRef);

    return () => hoverCtx.revert();
  }, [rarity.color]);

  // Hot Zone Logic
  const questStartTime = quest.startTime?.toDate
    ? quest.startTime.toDate()
    : new Date(quest.startTime);
  const startTime = questStartTime.getTime();
  const now = new Date().getTime();
  const minsRemaining = (startTime - now) / (1000 * 60);
  const isHotZone =
    minsRemaining > 0 && minsRemaining < 30 && slotsRemaining === 1;

  const meetupTime = questStartTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Fetch avatars for members
  useEffect(() => {
    const fetchMemberInfo = async () => {
      const info = await Promise.all(
        members.slice(0, 4).map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              return {
                seed: data.avatarSeed || data.name || uid,
                tier: getTier(data.xp || 1).name,
              };
            }
          } catch (e) {}
          return { seed: uid, tier: "Bronze" };
        }),
      );
      setMemberAvatars(info);
    };
    if (members.length > 0) fetchMemberInfo();
    else setMemberAvatars([]);
  }, [members]);

  const getVibeColor = (vibe) => {
    switch (vibe) {
      case "Chill":
        return "bg-blue-500/20 text-blue-300";
      case "Competitive":
        return "bg-red-500/20 text-red-300";
      case "Intellectual":
        return "bg-purple-500/20 text-purple-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  // Squad Capacity Percentage
  const capacityPercent = (members.length / maxPlayers) * 100;

  return (
    <Tilt
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
      perspective={1000}
      scale={1.05}
      transitionSpeed={1500}
      gyroscope={true}
      className="h-full"
    >
      <div
        ref={cardRef}
        className={`glassmorphism-dark relative rounded-2xl overflow-hidden border border-white/5 transition-colors cursor-pointer group h-full`}
        style={{
          borderColor: `${rarity.color}30`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Dynamic Glow Overlay/Border */}
        <div
          ref={glowRef}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 40px ${rarity.color}30, 0 0 20px ${rarity.color}20`,
          }}
        />

        {/* Rarity Stripe */}
        <div
          className="absolute top-0 left-0 bottom-0 w-1 transition-all group-hover:w-1.5"
          style={{
            backgroundColor: rarity.color,
            boxShadow: `0 0 15px ${rarity.color}`,
          }}
        />

        {isHotZone && (
          <div
            className="absolute top-0 right-0 bg-gradient-to-l from-red-600 to-orange-500 text-white text-[10px] font-black px-3 py-1 italic tracking-tighter z-10 rounded-bl-xl flex items-center gap-1 shadow-lg transform translate-z-10"
            style={{ transform: "translateZ(20px)" }}
          >
            <Flame className="w-3 h-3 fill-white" />
            HOT ZONE
          </div>
        )}

        <div
          className="p-5 pl-7 relative z-10 h-full flex flex-col justify-between"
          style={{ transform: "translateZ(10px)" }}
        >
          {/* Header */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3
                  ref={titleRef}
                  className="text-xl font-black font-['Orbitron'] italic mb-1 flex items-center gap-2 text-white drop-shadow-lg"
                  style={{ transform: "translateZ(20px)" }}
                >
                  {quest.title}
                </h3>
                <div
                  className="flex items-center gap-2 mb-2"
                  style={{ transform: "translateZ(15px)" }}
                >
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-black/40 border border-white/10"
                    style={{ color: rarity.color, borderColor: rarity.color }}
                  >
                    {rarity.msg}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    LVL {quest.difficulty || 1}
                  </span>
                </div>

                {quest.genderPreference &&
                  quest.genderPreference !== "everyone" && (
                    <div
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border mb-2 ${
                        quest.genderPreference === "female"
                          ? "bg-pink-500/10 text-pink-400 border-pink-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {quest.genderPreference === "female"
                        ? "♀ Females Only"
                        : "♂ Males Only"}
                    </div>
                  )}
              </div>
            </div>

            {/* Squad Capacity Bar */}
            <div className="mb-4" style={{ transform: "translateZ(10px)" }}>
              <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
                <span>Squad Capacity</span>
                <span style={{ color: rarity.color }}>
                  {members.length}/{maxPlayers}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${capacityPercent}%`,
                    backgroundColor: rarity.color,
                    boxShadow: `0 0 10px ${rarity.color}`,
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            {/* Tactical Intel */}
            <div
              className="grid grid-cols-2 gap-2 mb-4"
              style={{ transform: "translateZ(15px)" }}
            >
              <div className="bg-black/20 rounded-xl p-2 flex items-center gap-3 border border-white/5">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">
                    Timing
                  </div>
                  <div className="text-xs font-black text-white">
                    {meetupTime}
                  </div>
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-2 flex items-center gap-3 border border-white/5">
                <Gift className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">
                    Loot
                  </div>
                  <div className="text-xs font-black text-yellow-500">
                    Active
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between pt-3 border-t border-white/5"
              style={{ transform: "translateZ(10px)" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {memberAvatars.map((info, idx) => (
                    <HeroAvatar
                      key={idx}
                      seed={info.seed}
                      tierName={info.tier}
                      size={24}
                      className="border border-dark-bg"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-2 h-2" />
                  <span>{members?.length || 0} Joined</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
                <MapPin className="w-3 h-3" />
                {quest.distance || "0"} km
              </div>
            </div>
          </div>
        </div>

        {/* Tactical UI Overlay: Coordinates */}
        <div className="absolute top-2 right-2 text-[8px] font-mono text-neon-purple/40 uppercase tracking-widest hidden group-hover:block transition-all">
          LOC: {hub?.coordinates?.latitude || "0.00"},{" "}
          {hub?.coordinates?.longitude || "0.00"}
        </div>
      </div>
    </Tilt>
  );
};

export default QuestCard;
