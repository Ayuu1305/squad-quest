import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Users,
  Clock,
  AlertTriangle,
  Crown,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { safeLocalStorage, safeParse } from "../utils/safeStorage";
import {
  subscribeToSquadChat,
  sendSquadMessage,
} from "../backend/services/chat.service";
import { createReport } from "../backend/services/user.service";
import { isWithinOneHour } from "../utils/notifications";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import HeroAvatar from "./HeroAvatar";
import { getTier } from "../utils/xp";

// 🍎 SAFARI COMPATIBILITY: Safe date parser for iOS
const safeDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput.toDate) return dateInput.toDate();
  if (typeof dateInput === "string") {
    return new Date(dateInput.replace(/-/g, "/"));
  }
  return new Date(dateInput);
};

const ChatInterface = ({ quest, user, onLeave, isReadOnly = false }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [memberData, setMemberData] = useState({});
  const [members, setMembers] = useState([]); // Use state for members instead of prop
  const [mutedUsers, setMutedUsers] = useState(() => {
    const saved = safeLocalStorage.getItem(`muted_${user.uid}`);
    return safeParse(saved, []);
  });
  const [reportModalData, setReportModalData] = useState(null); // { reportedUserId, reportedUserName }
  const [reportSuccess, setReportSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  const startTimeObj = safeDate(quest.startTime);
  const isOneHour = isWithinOneHour(startTimeObj);

  useEffect(() => {
    if (!quest.id) return;

    // 1. Subscribe to Messages
    const unsubscribeChat = subscribeToSquadChat(quest.id, (newMessages) => {
      setMessages(newMessages);
    });

    // 2. Subscribe to Members (New Data Model)
    const membersRef = collection(db, "quests", quest.id, "members");
    const unsubscribeMembers = onSnapshot(
      membersRef,
      (snapshot) => {
        const squadData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMembers(squadData.map((member) => member.id)); // Keep `members` state updated for IDs
        setLoading(false);
      },
      (error) => {
        console.warn("Squad members listener suppressed:", error);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeChat();
      unsubscribeMembers();
    };
  }, [quest.id]);

  // Fetch names and avatars for members and message senders
  useEffect(() => {
    const fetchMemberData = async () => {
      const newData = { ...memberData };
      let changed = false;

      const uidsToFetch = [
        ...new Set([
          ...members,
          ...messages.map((m) => m.senderId).filter((id) => id),
        ]),
      ].filter((uid) => !newData[uid]);

      for (const uid of uidsToFetch) {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            newData[uid] = {
              uid: uid, // ✅ Critical for HeroAvatar check
              name: data.name || `Hero_${uid.slice(0, 4)}`,
              seed: data.avatarSeed || data.name || uid,
              tier: getTier(data.xp || 1).name,
              avatarConfig: data.avatarConfig || null, // ✅ Fetch Avatar Config
            };
            changed = true;
          }
        } catch (e) {}
      }

      if (changed) setMemberData(newData);
    };
    fetchMemberData();
  }, [members, messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      await sendSquadMessage(quest.id, user.uid, inputText.trim(), user.name);
      setInputText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleLeaveClick = () => {
    if (isOneHour) {
      setShowLeaveWarning(true);
    } else {
      onLeave();
    }
  };

  const handleReportSubmit = async (reason) => {
    if (!reportModalData) return;

    try {
      await createReport({
        reportedUserId: reportModalData.reportedUserId,
        reporterId: user.uid,
        questId: quest.id,
        reason,
      });

      // Local Mute
      const newMuted = [...mutedUsers, reportModalData.reportedUserId];
      setMutedUsers(newMuted);
      safeLocalStorage.setItem(`muted_${user.uid}`, JSON.stringify(newMuted));
      setReportModalData(null);
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (error) {
      console.error("Report failed", error);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Squad Members Horizontal List */}
      <div className="p-4 pt-6 md:pt-4 border-b border-white/10 overflow-x-auto whitespace-nowrap no-scrollbar flex items-center gap-3 bg-black/20 shrink-0">
        {members.map((userId) => (
          <div key={userId} className="inline-flex flex-col items-center gap-1">
            <div className="relative">
              <HeroAvatar
                user={memberData[userId] || { uid: userId }} // ✅ Pass User Object to prevent "isMe" fallback
                seed={memberData[userId]?.seed || userId}
                tierName={memberData[userId]?.tier || "Bronze"}
                size={48}
                className="border-2 border-neon-purple shadow-lg"
              />
              {userId === quest.partyLeader && (
                <Crown className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-bold max-w-[60px] truncate">
              {memberData[userId]?.name || `Hero_${userId.slice(0, 4)}`}
            </span>
          </div>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20 no-scrollbar relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
            <Zap className="w-8 h-8" />
            <p className="font-mono text-[10px] uppercase tracking-widest">
              Awaiting Comms...
            </p>
          </div>
        ) : (
          messages
            .filter((msg) => !mutedUsers.includes(msg.senderId))
            .map((msg) => {
              const isMe = msg.senderId === user.uid;
              const senderName =
                msg.senderName ||
                memberData[msg.senderId]?.name ||
                `Hero_${msg.senderId?.slice(0, 4)}`;
              const senderAvatar =
                memberData[msg.senderId]?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <HeroAvatar
                      user={memberData[msg.senderId] || { uid: msg.senderId }} // ✅ Fix: Pass sender's user object
                      seed={memberData[msg.senderId]?.seed || msg.senderId}
                      tierName={memberData[msg.senderId]?.tier || "Bronze"}
                      size={32}
                      className="mr-2 self-end mb-1"
                    />
                  )}
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-lg relative group ${
                      isMe
                        ? "bg-neon-purple text-white rounded-tr-none shadow-neon-purple/20"
                        : "bg-white/10 text-gray-200 rounded-tl-none border border-white/5"
                    }`}
                  >
                    {!isMe && (
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="text-[10px] font-bold text-neon-purple/80">
                          {senderName}
                        </div>
                        <button
                          onClick={() =>
                            setReportModalData({
                              reportedUserId: msg.senderId,
                              reportedUserName: senderName,
                            })
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                          title="Report User"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                    <div className="break-words font-medium">{msg.text}</div>
                    <div
                      className={`text-[9px] mt-1.5 flex items-center gap-1 ${
                        isMe ? "text-purple-200" : "text-gray-500"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {msg.createdAt?.toDate
                        ? msg.createdAt.toDate().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })
                        : "Syncing..."}
                    </div>
                  </div>
                </div>
              );
            })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer / Input */}
      <div className="p-4 pb-6 md:pb-4 glassmorphism border-t border-white/10 relative z-20 shrink-0">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            className={`input-field py-2 ${isReadOnly ? "cursor-not-allowed opacity-50" : ""}`}
            placeholder={
              isReadOnly
                ? "Chat is read-only (Mission completed)"
                : "Squad Chat..."
            }
            value={inputText}
            onChange={(e) => !isReadOnly && setInputText(e.target.value)}
            onKeyPress={(e) => !isReadOnly && e.key === "Enter" && handleSend()}
            disabled={isReadOnly}
          />
          <button
            onClick={handleSend}
            disabled={isReadOnly}
            className={`bg-neon-purple p-3 rounded-lg transition-transform ${
              isReadOnly ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleLeaveClick}
          className="w-full text-xs text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          Leave Quest
        </button>
      </div>

      {/* Leave Warning Modal */}
      <AnimatePresence>
        {showLeaveWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glassmorphism-dark p-6 rounded-2xl w-full max-w-xs border border-red-500/30"
            >
              <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Wait, Hero!
              </h2>
              <p className="text-sm text-gray-300 mb-6">
                Leaving within 1 hour of the start time will reduce your{" "}
                <span className="text-red-400 font-bold">
                  Reliability Score by 2%
                </span>
                . Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveWarning(false)}
                  className="flex-1 py-3 btn-secondary text-sm"
                >
                  Stay
                </button>
                <button
                  onClick={onLeave}
                  className="flex-1 py-3 bg-red-600 rounded-lg text-sm font-bold shadow-lg shadow-red-600/20"
                >
                  Confirm Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Success Popup */}
      <AnimatePresence>
        {reportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-6 right-6 z-[70]"
          >
            <div className="bg-green-600/90 backdrop-blur-md border border-green-400/30 p-4 rounded-xl shadow-2xl flex items-center justify-center gap-3">
              <ShieldAlert className="w-5 h-5 text-white" />
              <div className="text-sm font-black uppercase text-white tracking-widest">
                Threat Redacted & Muted
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glassmorphism-dark p-6 rounded-2xl w-full max-w-xs border border-red-500/30"
            >
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <ShieldAlert className="w-6 h-6" />
                <h2 className="text-xl font-bold uppercase tracking-tighter">
                  Guardian Shield
                </h2>
              </div>
              <p className="text-xs text-gray-400 mb-6 font-mono uppercase">
                Reporting Hero:{" "}
                <span className="text-white">
                  {reportModalData.reportedUserName}
                </span>
              </p>

              <div className="space-y-2">
                {[
                  "Harassment",
                  "Not at Location",
                  "Inappropriate Content",
                  "Spam",
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleReportSubmit(reason)}
                    className="w-full py-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-xl text-sm font-bold transition-all text-left px-4"
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setReportModalData(null)}
                className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterface;
