import { db } from "./firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";

/**
 * ✅ Uses Firestore indexes you created:
 * users + city + xp
 * users + city + thisWeekXP
 * users + city + reliabilityScore
 */

const FIELD_MAP = {
  weekly: "thisWeekXP",
  xp: "lifetimeXP", // 🎖️ All-Time ranks by total earned, not wallet balance
  reliability: "reliabilityScore",
};

export const getTopHeroes = async (city, category = "xp") => {
  const field = FIELD_MAP[category] || "xp";

  try {
    const q = query(
      collection(db, "users"),
      where("city", "==", city),
      orderBy(field, "desc"),
      limit(20),
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    console.error("getTopHeroes failed:", err);
    return [];
  }
};

export const getUserRank = async (
  userId,
  city,
  category = "xp",
  userValue = 0,
) => {
  const field = FIELD_MAP[category] || "xp";

  try {
    const q = query(
      collection(db, "users"),
      where("city", "==", city),
      where(field, ">", userValue),
    );

    const snap = await getCountFromServer(q);
    return snap.data().count + 1;
  } catch (err) {
    console.error("getUserRank failed:", err);
    return null;
  }
};
