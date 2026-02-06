import { getTrustBadges, calculateTrustScore } from "../utils/trustScore";

/**
 * TrustBadges Component
 * Displays trust indicators for a user (OAuth verification, quest count, trust level)
 * Used in Lobby, QuestDetails, and other member displays
 */
const TrustBadges = ({ user, showScore = false }) => {
  if (!user) return null;

  const badges = getTrustBadges(user);
  const trustScore = showScore ? calculateTrustScore(user) : null;

  if (badges.length === 0 && !showScore) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`${badge.color} px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1`}
          title={badge.tooltip}
        >
          <span>{badge.icon}</span>
          <span>{badge.text}</span>
        </span>
      ))}

      {showScore && trustScore !== null && (
        <span
          className="bg-gray-700 px-2 py-0.5 rounded text-[10px] font-mono"
          title={`Trust Score: ${trustScore}/100`}
        >
          {trustScore}
        </span>
      )}
    </div>
  );
};

export default TrustBadges;
