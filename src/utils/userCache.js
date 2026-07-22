import { doc, getDoc } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

// In-memory cache for user profiles to prevent duplicate Firestore reads
const cache = new Map();
const pending = new Map();
const subscribers = new Set();

export const getUserProfile = (uid) => {
  if (!uid) return null;
  return cache.get(uid) || null;
};

export const setUserProfileCache = (uid, data) => {
  if (!uid || !data) return;
  const existing = cache.get(uid) || {};
  cache.set(uid, { ...existing, ...data, uid, id: uid });
  notifySubscribers();
};

export const fetchUserProfile = async (uid) => {
  if (!uid) return null;

  if (cache.has(uid)) {
    return cache.get(uid);
  }

  if (pending.has(uid)) {
    return pending.get(uid);
  }

  const promise = (async () => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const userData = { uid, id: snap.id, ...snap.data() };
        cache.set(uid, userData);
        notifySubscribers();
        return userData;
      }
    } catch (err) {
      console.warn(`Failed to fetch user profile for ${uid}:`, err);
    } finally {
      pending.delete(uid);
    }
    return null;
  })();

  pending.set(uid, promise);
  return promise;
};

const notifySubscribers = () => {
  subscribers.forEach((cb) => cb());
};

export const subscribeUserCache = (callback) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};
