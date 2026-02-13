import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Check, X, Clock } from "lucide-react";
import HeroAvatar from "./HeroAvatar";
import TrustBadges from "./TrustBadges";
import {
  subscribeToPendingRequests,
  approveJoinRequest,
  denyJoinRequest,
} from "../backend/services/joinRequest.service";
import { getTier } from "../utils/xp";

/**
 * PendingRequests Component
 * Shows pending join requests for quest hosts
 * Includes user details, trust score, and approve/deny buttons
 */
const PendingRequests = ({ questId, hostId }) => {
  const [requests, setRequests] = useState([]);
  const [processing, setProcessing] = useState(null); // Request ID being processed

  // Subscribe to pending requests in real-time
  useEffect(() => {
    if (!questId || !hostId) return;

    console.log("🔔 [PendingRequests] Subscribing to requests for:", questId);
    const unsubscribe = subscribeToPendingRequests(
      questId,
      hostId,
      (updatedRequests) => {
        console.log(
          "📨 [PendingRequests] Received requests:",
          updatedRequests.length,
        );
        setRequests(updatedRequests);
      },
    );

    return unsubscribe;
  }, [questId, hostId]);

  const handleApprove = async (requestId) => {
    setProcessing(requestId);
    try {
      await approveJoinRequest(requestId, hostId);
      console.log("✅ [PendingRequests] Request approved:", requestId);
    } catch (error) {
      console.error("❌ [PendingRequests] Approval failed:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (requestId) => {
    setProcessing(requestId);
    try {
      await denyJoinRequest(requestId, hostId);
      console.log("❌ [PendingRequests] Request denied:", requestId);
    } catch (error) {
      console.error("❌ [PendingRequests] Denial failed:", error);
    } finally {
      setProcessing(null);
    }
  };

  if (requests.length === 0) {
    return null; // Don't show anything if no pending requests
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-5 h-5 text-yellow-400" />
        <h3 className="text-sm font-black uppercase tracking-widest text-white">
          Pending Requests
        </h3>
        <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>

      {/* Request Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {requests.map((request) => {
            const tier = getTier(request.userLevel || 1);
            const isProcessing = processing === request.id;

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3"
              >
                {/* User Info */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                      <HeroAvatar
                        user={{
                          avatarSeed: request.userAvatarSeed,
                          avatar: request.userAvatar,
                        }}
                        seed={request.userAvatarSeed}
                        tierName={tier.name}
                        size={48}
                      />
                    </div>
                  </div>

                  {/* Name + Level + Trust Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-black text-white truncate">
                        {request.userName}
                      </h4>
                      <span className="text-xs text-gray-400">
                        Level {request.userLevel}
                      </span>
                    </div>

                    {/* Trust Badges */}
                    <TrustBadges
                      user={{
                        verifiedGender: request.userVerifiedGender,
                        gender: request.userGender,
                        authProvider: "google.com", // Assume OAuth
                        questsCompleted: request.userQuestsCompleted,
                      }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-xs text-gray-400">Quests</div>
                    <div className="text-sm font-bold text-white">
                      {request.userQuestsCompleted || 0}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-xs text-gray-400">Photos</div>
                    <div className="text-sm font-bold text-white">
                      {request.userPhotoVerifications || 0}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-xs text-gray-400">Reliability</div>
                    <div className="text-sm font-bold text-green-400">
                      {request.userReliabilityScore || 100}%
                    </div>
                  </div>
                </div>

                {/* Request Time */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    Requested{" "}
                    {request.requestedAt?.toDate
                      ? new Date(request.requestedAt.toDate()).toLocaleString(
                          "en-US",
                        )
                      : "just now"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">
                          Accept
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeny(request.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600/80 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">
                          Deny
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PendingRequests;
