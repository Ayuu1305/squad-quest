// 🍎 iOS SAFARI COMPATIBILITY: Safe localStorage wrapper
// Prevents crashes in Safari Private Browsing mode and PWA low storage scenarios

export const safeLocalStorage = {
  /**
   * Safely get item from localStorage
   * @param {string} key - Storage key
   * @returns {string|null} - Value or null if blocked/not found
   */
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(
        `[SafeStorage] localStorage.getItem blocked for "${key}":`,
        e.message,
      );
      return null;
    }
  },

  /**
   * Safely set item in localStorage
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @returns {boolean} - Success status
   */
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(
        `[SafeStorage] localStorage.setItem blocked for "${key}":`,
        e.message,
      );
      return false;
    }
  },

  /**
   * Safely remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} - Success status
   */
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(
        `[SafeStorage] localStorage.removeItem blocked for "${key}":`,
        e.message,
      );
      return false;
    }
  },

  /**
   * Safely clear localStorage
   * @returns {boolean} - Success status
   */
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn("[SafeStorage] localStorage.clear blocked:", e.message);
      return false;
    }
  },
};

/**
 * Safely parse JSON with fallback
 * @param {string} str - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} - Parsed object or fallback
 */
export const safeParse = (str, fallback = null) => {
  if (!str) return fallback;

  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("[SafeStorage] Failed to parse JSON:", e.message);
    return fallback;
  }
};

/**
 * Safely stringify JSON
 * @param {*} obj - Object to stringify
 * @param {string} fallback - Fallback string if stringify fails
 * @returns {string} - JSON string or fallback
 */
export const safeStringify = (obj, fallback = "{}") => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.warn("[SafeStorage] Failed to stringify JSON:", e.message);
    return fallback;
  }
};
