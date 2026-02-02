/**
 * requestIdleCallback with Safari fallback
 * Defers execution to browser idle time to improve page load performance
 */

/**
 * Run a callback when the browser is idle
 * @param {Function} callback - Function to run when idle
 * @param {{timeout?: number}} options - Timeout in ms (default: 2000)
 * @returns {number} - ID for cancellation
 */
export const runWhenIdle = (callback, options = {}) => {
  const { timeout = 2000 } = options;

  // Use native requestIdleCallback if available (Chrome, Firefox, Edge)
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, { timeout });
  }

  // Safari/iOS fallback: use setTimeout with small delay
  return setTimeout(callback, 100);
};

/**
 * Cancel an idle callback
 * @param {number} id - ID returned from runWhenIdle
 */
export const cancelIdle = (id) => {
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};
