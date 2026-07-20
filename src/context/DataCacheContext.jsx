/**
 * DataCacheContext.jsx
 *
 * Single source of truth for all data that was previously fetched
 * independently by each page component on every mount.
 *
 * Exposes reference-counted listener attachment/detachment functions:
 * - `startQuestListener()` / `stopQuestListener()`
 * - `startShopListener()` / `stopShopListener()`
 * - `startMissionsListener()` / `stopMissionsListener()`
 *
 * These listeners are active ONLY when their respective pages are mounted,
 * which eliminates standing background connections and avoids continuous background
 * read costs when the user is on other tabs.
 *
 * When a page remounts, the cache serves the data immediately, and the listener
 * connects in the background.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { useGame } from "./GameContext"; // city lives here
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { subscribeToAllQuests, fetchMoreQuests } from "../backend/services/quest.service";
import { getTopHeroes, getUserRank } from "../backend/leaderboardService";

// ─── Stale-while-revalidate window (ms) ───────────────────────────────────────
const LEADERBOARD_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LISTENER_TEARDOWN_GRACE_MS = 30 * 1000; // cancel unsub if remounted within 30s

const DataCacheContext = createContext(null);

export const DataCacheProvider = ({ children }) => {
  const { user } = useAuth();
  const { city } = useGame();

  const uid = user?.uid ?? null;

  // ── QuestBoard ──────────────────────────────────────────────────────────────
  const [realtimeQuests, setRealtimeQuests] = useState([]);
  const [olderQuests, setOlderQuests] = useState([]);
  const [questsLastDoc, setQuestsLastDoc] = useState(null);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [questsLoadingMore, setQuestsLoadingMore] = useState(false);
  const [questsHasMore, setQuestsHasMore] = useState(true);
  const [hasInitialQuestData, setHasInitialQuestData] = useState(false);

// Reference-counted active listeners for QuestBoard
  const questListenersCount = useRef(0);
  const questUnsubRef = useRef(null);
  const questTeardownTimer = useRef(null);

  // ── ShopPage ─────────────────────────────────────────────────────────────────
const [shopItems, setShopItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

// Reference-counted active listeners for ShopPage
  const shopListenersCount = useRef(0);
  const shopUnsubRef = useRef(null);
  const shopTeardownTimer = useRef(null);

  // ── MyMissions ───────────────────────────────────────────────────────────────
  const [myQuests, setMyQuests] = useState([]);
  const [archivedQuests, setArchivedQuests] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

const missionsListenersCount = useRef(0);
  const missionsUnsubRef = useRef(null);
  const missionsArchiveUnsubRef = useRef(null);
  const missionsTeardownTimer = useRef(null);

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  // Cache is keyed by `${city}_${category}` so each combination is independent.
  // Shape: { [key]: { heroes, userRank, nextRankHero, myStats, fetchedAt, loading, error } }
  const [leaderboardCache, setLeaderboardCache] = useState({});
  // Incrementing this forces a re-fetch for every cached key (used after quest complete)
  const [leaderboardVersion, setLeaderboardVersion] = useState(0);

  // ════════════════════════════════════════════════════════════════════════════
  // 1. QUEST BOARD — Reference-counted real-time subscriber
  // ════════════════════════════════════════════════════════════════════════════
  const startQuestListener = useCallback(() => {
    questListenersCount.current += 1;
 clearTimeout(questTeardownTimer.current);
    if (questListenersCount.current === 1 && !questUnsubRef.current && uid) {
      console.log("⚡ [DataCache] Starting quest listener...");
      
      // If we don't have cached data, show the skeleton loader
      if (!hasInitialQuestData) {
        setQuestsLoading(true);
      }

      questUnsubRef.current = subscribeToAllQuests((newTopQuests, newLastDoc) => {
        setRealtimeQuests(newTopQuests);
        setHasInitialQuestData(true);
        setQuestsLoading(false);
        setQuestsLastDoc((prev) => prev || newLastDoc);
      }, city);
    }
  }, [uid, city, hasInitialQuestData]);

  const stopQuestListener = useCallback(() => {
    questListenersCount.current = Math.max(0, questListenersCount.current - 1);

    if (questListenersCount.current === 0) {
      clearTimeout(questTeardownTimer.current);
      questTeardownTimer.current = setTimeout(() => {
        if (questListenersCount.current === 0 && questUnsubRef.current) {
          console.log("⚡ [DataCache] Stopping quest listener (grace expired)...");
          questUnsubRef.current();
          questUnsubRef.current = null;
        }
      }, LISTENER_TEARDOWN_GRACE_MS);
    }
  }, []);

  /**
   * Load the next page of older quests (pagination).
   * QuestBoard calls this instead of its own handleLoadMore.
   */
  const loadMoreQuests = useCallback(async () => {
    if (questsLoadingMore || !questsHasMore || !questsLastDoc) return;
    setQuestsLoadingMore(true);
    try {
      const { quests: newQuests, lastVisible } = await fetchMoreQuests(
        questsLastDoc,
        city,
      );
      if (newQuests.length < 10) setQuestsHasMore(false);
      if (newQuests.length > 0) {
        setOlderQuests((prev) => [...prev, ...newQuests]);
        setQuestsLastDoc(lastVisible);
      }
    } catch (err) {
      console.error("[DataCache] Pagination error:", err);
    } finally {
      setQuestsLoadingMore(false);
    }
  }, [questsLoadingMore, questsHasMore, questsLastDoc, city]);

  // ════════════════════════════════════════════════════════════════════════════
  // 2. SHOP ITEMS — Reference-counted real-time subscriber
  // ════════════════════════════════════════════════════════════════════════════
  const startShopListener = useCallback(() => {
    shopListenersCount.current += 1;
    clearTimeout(shopTeardownTimer.current);

    if (shopListenersCount.current === 1 && !shopUnsubRef.current && uid) {
      console.log("⚡ [DataCache] Starting shop listener...");
      
      if (shopItems.length === 0) {
        setLoadingItems(true);
      }

      const q = query(collection(db, "shop_items"), orderBy("cost", "asc"));
      shopUnsubRef.current = onSnapshot(
        q,
        (snapshot) => {
          setShopItems(
            snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
          );
          setLoadingItems(false);
        },
        (err) => {
          console.error("[DataCache] Shop items error:", err);
          setLoadingItems(false);
        },
      );
    }
  }, [uid, shopItems.length]);

const stopShopListener = useCallback(() => {
    shopListenersCount.current = Math.max(0, shopListenersCount.current - 1);

    if (shopListenersCount.current === 0) {
      clearTimeout(shopTeardownTimer.current);
      shopTeardownTimer.current = setTimeout(() => {
        if (shopListenersCount.current === 0 && shopUnsubRef.current) {
          console.log("⚡ [DataCache] Stopping shop listener (grace expired)...");
          shopUnsubRef.current();
          shopUnsubRef.current = null;
        }
      }, LISTENER_TEARDOWN_GRACE_MS);
    }
  }, []);

  // ════════════════════════════════════════════════════════════════════════════
  // 3. MY MISSIONS — Reference-counted real-time subscriber
  // ════════════════════════════════════════════════════════════════════════════
  const startMissionsListener = useCallback(() => {
    missionsListenersCount.current += 1;
    clearTimeout(missionsTeardownTimer.current);

    if (missionsListenersCount.current === 1 && uid) {
      console.log("⚡ [DataCache] Starting missions listeners...");
      
      if (myQuests.length === 0) {
        setMissionsLoading(true);
      }

      const mainQ = query(
        collection(db, "quests"),
        where("members", "array-contains", uid),
      );

      missionsUnsubRef.current = onSnapshot(
        mainQ,
        (snapshot) => {
          const sorted = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const toMs = (v) => {
                if (!v) return 0;
                if (v.toDate) return v.toDate().getTime();
                if (typeof v === "string") return new Date(v.replace(/-/g, "/")).getTime();
                return new Date(v).getTime();
              };
              return toMs(b.startTime) - toMs(a.startTime);
            });
          setMyQuests(sorted);
          setMissionsLoading(false);
        },
        (err) => {
          if (err?.code === "permission-denied") return;
          console.warn("[DataCache] MyMissions main query error:", err?.code);
          setMissionsLoading(false);
        },
      );

      const archiveQ = query(
        collection(db, "archived_quests"),
        where("members", "array-contains", uid),
        where("status", "==", "completed"),
      );

      missionsArchiveUnsubRef.current = onSnapshot(
        archiveQ,
        (snapshot) => {
          setArchivedQuests(
            snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
          );
        },
        (err) => {
          if (
            err?.code === "permission-denied" ||
            err?.code === "failed-precondition"
          ) {
            setArchivedQuests([]);
            return;
          }
          console.warn("[DataCache] Archived quests error:", err?.code);
          setArchivedQuests([]);
        },
      );
    }
  }, [uid, myQuests.length]);

const stopMissionsListener = useCallback(() => {
    missionsListenersCount.current = Math.max(0, missionsListenersCount.current - 1);

    if (missionsListenersCount.current === 0) {
      clearTimeout(missionsTeardownTimer.current);
      missionsTeardownTimer.current = setTimeout(() => {
        if (missionsListenersCount.current === 0) {
          console.log("⚡ [DataCache] Stopping missions listeners (grace expired)...");
          if (missionsUnsubRef.current) {
            missionsUnsubRef.current();
            missionsUnsubRef.current = null;
          }
          if (missionsArchiveUnsubRef.current) {
            missionsArchiveUnsubRef.current();
            missionsArchiveUnsubRef.current = null;
          }
        }
      }, LISTENER_TEARDOWN_GRACE_MS);
    }
  }, []);

  // ════════════════════════════════════════════════════════════════════════════
  // 4. LEADERBOARD — fetch-and-cache with TTL
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Fetch leaderboard data for a specific city+category combination.
   * Results are stored in leaderboardCache keyed by `${city}_${category}`.
   * If cached data is fresh (< TTL), this is a no-op unless force=true.
   */
  // Mirrors leaderboardCache without being a dependency — keeps fetchLeaderboardSlice's
// identity stable so it doesn't retrigger every effect that depends on it.
const leaderboardCacheRef = useRef({});
const leaderboardCategoryRef = useRef("weekly");
useEffect(() => {
  leaderboardCacheRef.current = leaderboardCache;
}, [leaderboardCache]);

const fetchLeaderboardSlice = useCallback(
  async (targetCity, targetCategory, force = false) => {
    if (!uid || !targetCity) return;

    // Track the last viewed category so XP watchers know what to invalidate eagerly
    leaderboardCategoryRef.current = targetCategory;

    const key = `${targetCity}_${targetCategory}`;
    const existing = leaderboardCacheRef.current[key];

     // Already fetching this slice — don't fire a duplicate request
      if (existing?.loading && !force) return;

    if (
      !force &&
      existing &&
      !existing.loading &&
      !existing.error &&
      Date.now() - (existing.fetchedAt ?? 0) < LEADERBOARD_TTL_MS
    ) {
      return;
    }

      // Mark as loading (show stale data while refreshing)
      setLeaderboardCache((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? {}), loading: true, error: null },
      }));

      try {
        // First get myStats
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        const myStats = snap.exists() ? { id: snap.id, ...snap.data() } : null;

        const fieldMap = {
          weekly: "thisWeekXP",
          xp: "lifetimeXP",
          wars: "lifetimeXP",
          reliability: "reliabilityScore",
        };
        const field = fieldMap[targetCategory] || "lifetimeXP";
        const myValue = myStats?.[field] ?? 0;

        // Then fetch heroes and rank in parallel
        const [heroes, userRank] = await Promise.all([
          getTopHeroes(targetCity, targetCategory),
          getUserRank(uid, targetCity, targetCategory, myValue),
        ]);

        const nextRankHero =
          userRank > 1 ? (heroes.find((h) => h.id !== uid) ?? null) : null;

        setLeaderboardCache((prev) => ({
          ...prev,
          [key]: {
            heroes,
            userRank,
            nextRankHero,
            myStats,
            fetchedAt: Date.now(),
            loading: false,
            error: null,
          },
        }));
      } catch (err) {
        console.error("[DataCache] Leaderboard fetch error:", err);
        setLeaderboardCache((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? {}),
            loading: false,
            error: err.message?.includes("index") ? "INDEX_REQUIRED" : "FETCH_ERROR",
          },
        }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid],
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 5. INVALIDATION HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  /** Call after a successful purchase so shop data refreshes. */


  /**
   * Call after a quest is completed, XP changes, etc.
   * Clears all leaderboard cache entries and triggers background re-fetch.
   */
  const invalidateLeaderboard = useCallback(async (activeCity, activeCategory) => {
  setLeaderboardCache((prev) => {
    const wiped = {};
    Object.keys(prev).forEach((k) => {
      wiped[k] = { ...prev[k], fetchedAt: 0 };
    });
    return wiped;
  });

  // Only eagerly refresh the slice currently in view — others stay
  // marked stale and refetch lazily on their next mount.
  if (activeCity && activeCategory) {
    fetchLeaderboardSlice(activeCity, activeCategory, true);
  }
}, [fetchLeaderboardSlice]);

  // Automatically invalidate and refresh the leaderboard when the user's XP changes (debounced)
  const prevXpRef = useRef(null);
  const prevLifetimeXpRef = useRef(null);
  const prevThisWeekXpRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      prevXpRef.current = null;
      prevLifetimeXpRef.current = null;
      prevThisWeekXpRef.current = null;
      clearTimeout(debounceTimerRef.current);
      return;
    }

    const currentXp = user?.xp ?? 0;
    const currentLifetimeXp = user?.lifetimeXP ?? 0;
    const currentThisWeekXp = user?.thisWeekXP ?? 0;

    // Check if any XP value has changed (and it's not the initial load)
    const xpChanged =
      (prevXpRef.current !== null && currentXp !== prevXpRef.current) ||
      (prevLifetimeXpRef.current !== null && currentLifetimeXp !== prevLifetimeXpRef.current) ||
      (prevThisWeekXpRef.current !== null && currentThisWeekXp !== prevThisWeekXpRef.current);

    if (xpChanged) {
      console.log("💰 [DataCache] User XP changed! Debouncing leaderboard invalidation...");
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        const activeCategory = leaderboardCategoryRef.current;
        console.log(`💰 [DataCache] Debounce completed. Invalidate & refresh active slice: ${city}_${activeCategory}`);
        invalidateLeaderboard(city, activeCategory);
      }, 500);
    }

    prevXpRef.current = currentXp;
    prevLifetimeXpRef.current = currentLifetimeXp;
    prevThisWeekXpRef.current = currentThisWeekXp;

    return () => clearTimeout(debounceTimerRef.current);
  }, [uid, user?.xp, user?.lifetimeXP, user?.thisWeekXP, city, invalidateLeaderboard]);

  // ════════════════════════════════════════════════════════════════════════════
  // 6. CLEAR CACHE & DETACH LISTENERS ON LOGOUT
  // ════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!uid) {
      clearTimeout(questTeardownTimer.current);
      clearTimeout(shopTeardownTimer.current);
      clearTimeout(missionsTeardownTimer.current);
      // Detach any active listeners
      if (questUnsubRef.current) {
        questUnsubRef.current();
        questUnsubRef.current = null;
      }
      if (shopUnsubRef.current) {
        shopUnsubRef.current();
        shopUnsubRef.current = null;
      }
      if (missionsUnsubRef.current) {
        missionsUnsubRef.current();
        missionsUnsubRef.current = null;
      }
      if (missionsArchiveUnsubRef.current) {
        missionsArchiveUnsubRef.current();
        missionsArchiveUnsubRef.current = null;
      }

      questListenersCount.current = 0;
      shopListenersCount.current = 0;
      missionsListenersCount.current = 0;

      // Reset state values
      setRealtimeQuests([]);
      setOlderQuests([]);
      setShopItems([]);
      setMyQuests([]);
      setArchivedQuests([]);
      setLeaderboardCache({});
      setHasInitialQuestData(false);
    }
  }, [uid]);

  // ════════════════════════════════════════════════════════════════════════════
  // 7. CONTEXT VALUE
  // ════════════════════════════════════════════════════════════════════════════
  const value = useMemo(
    () => ({
      // QuestBoard
      realtimeQuests,
      olderQuests,
      questsLoading,
      questsLoadingMore,
      questsHasMore,
      hasInitialQuestData,
      startQuestListener,
      stopQuestListener,
      loadMoreQuests,

      // ShopPage
      shopItems,
      loadingItems,
      startShopListener,
      stopShopListener,


      // MyMissions
      myQuests,
      archivedQuests,
      missionsLoading,
      startMissionsListener,
      stopMissionsListener,

      // Leaderboard
      leaderboardCache,
      fetchLeaderboardSlice,
      invalidateLeaderboard,
    }),
    [
      realtimeQuests,
      olderQuests,
      questsLoading,
      questsLoadingMore,
      questsHasMore,
      hasInitialQuestData,
      startQuestListener,
      stopQuestListener,
      loadMoreQuests,
      shopItems,
      loadingItems,
      startShopListener,
      stopShopListener,
    
      myQuests,
      archivedQuests,
      missionsLoading,
      startMissionsListener,
      stopMissionsListener,
      leaderboardCache,
      fetchLeaderboardSlice,
      invalidateLeaderboard,
    ],
  );

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error("useDataCache must be used inside DataCacheProvider");
  return ctx;
};
