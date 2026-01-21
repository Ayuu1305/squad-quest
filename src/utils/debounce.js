/**
 * Debounce utility - prevents a function from being called too frequently
 * @param {Function} func - The function to debounce
 * @param {number} delay - Minimum milliseconds between calls (default: 2000ms)
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 2000) => {
  let timeoutId;
  let lastCall = 0;

  return function debounced(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    console.log(
      `%c⏱️ [DEBOUNCE] ${func.name || "anonymous"}: ${timeSinceLastCall}ms since last call`,
      "color: #f59e0b; font-weight: bold;",
    );

    if (timeSinceLastCall < delay) {
      console.warn(
        `%c🚫 [DEBOUNCE] ${func.name || "anonymous"} BLOCKED (called within ${delay}ms)`,
        "background: #dc2626; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
      );
      return Promise.reject(
        new Error(
          `Function called too frequently. Wait ${delay - timeSinceLastCall}ms`,
        ),
      );
    }

    lastCall = now;
    return func.apply(this, args);
  };
};

/**
 * Throttle utility - ensures a function is called at most once per specified period
 * @param {Function} func - The function to throttle
 * @param {number} limit - Minimum milliseconds between executions (default: 2000ms)
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 2000) => {
  let inThrottle;
  let lastResult;

  return function throttled(...args) {
    if (!inThrottle) {
      console.log(
        `%c✅ [THROTTLE] ${func.name || "anonymous"} EXECUTED`,
        "background: #10b981; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
      );
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        console.log(
          `%c🔓 [THROTTLE] ${func.name || "anonymous"} UNLOCKED`,
          "color: #10b981; font-weight: bold;",
        );
      }, limit);
    } else {
      console.warn(
        `%c⏸️ [THROTTLE] ${func.name || "anonymous"} SKIPPED (still throttled)`,
        "color: #f59e0b; font-weight: bold;",
      );
    }
    return lastResult;
  };
};
