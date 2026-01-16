import { useState, useEffect } from "react";
import {
  isShowdownActive,
  getTimeUntilShowdownEnd,
} from "../utils/showdownUtils";

const useShowdown = () => {
  const [isActive, setIsActive] = useState(isShowdownActive());
  const [multiplier, setMultiplier] = useState(isActive ? 2 : 1);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilShowdownEnd());
  const [nextReset, setNextReset] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const active = isShowdownActive();
      setIsActive(active);
      setMultiplier(active ? 2 : 1);

      if (active) {
        // Count down to midnight (Showdown End)
        const t = getTimeUntilShowdownEnd();
        setTimeLeft(t);
      } else {
        // Count down to Next Sunday 9 PM (Showdown Start)
        // OR simply "Next Reset: Monday" logic if requested,
        // but user asked for "Next Reset: [Countdown to Monday]"
        // which implies the weekly reset is the main target when not in showdown.

        // Let's implement Countdown to Monday 00:00 (Weekly Reset)
        const now = new Date();
        const curDay = now.getDay();
        const daysUntilMonday = curDay === 0 ? 0 : 8 - curDay; // If Sunday(0), next Monday is tomorrow(1), so wait... actually logic:
        // If Sunday (0), next Monday is 1 day away (at 00:00).
        // If Monday (1) and it's 00:00:01, next Monday is 6 days 23h away.

        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
        nextMonday.setHours(0, 0, 0, 0);

        const diff = nextMonday - now;
        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setNextReset(`${d}d ${h}h ${m}m ${s}s`);
        } else {
          setNextReset("Processing...");
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return { isActive, multiplier, timeLeft, nextReset };
};

export default useShowdown;
