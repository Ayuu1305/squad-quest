let readCount = 0;
let writeCount = 0;
let sessionStart = Date.now();

/**
 * Track Firestore READ operations
 * @param {string} location - Name of the function or component making the read
 */
export const trackRead = (location) => {
  readCount++;
  console.count(`📖 READ_OPERATION [${location}]`);

  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  console.log(
    `%c[FIRESTORE MONITOR] Total Reads: ${readCount} | Elapsed: ${elapsed}s | Rate: ${(readCount / (elapsed || 1)).toFixed(2)}/s`,
    "background: #1e40af; color: #60a5fa; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
  );
};

/**
 * Track Firestore WRITE operations
 * @param {string} location - Name of the function or component making the write
 */
export const trackWrite = (location) => {
  writeCount++;
  console.count(`✍️ WRITE_OPERATION [${location}]`);

  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  console.log(
    `%c[FIRESTORE MONITOR] Total Writes: ${writeCount} | Elapsed: ${elapsed}s | Rate: ${(writeCount / (elapsed || 1)).toFixed(2)}/s`,
    "background: #991b1b; color: #fca5a5; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
  );
};

/**
 * Get current operation counts
 * @returns {{reads: number, writes: number, elapsed: number}}
 */
export const getOperationCounts = () => {
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  return {
    reads: readCount,
    writes: writeCount,
    elapsed,
    readRate: (readCount / (elapsed || 1)).toFixed(2),
    writeRate: (writeCount / (elapsed || 1)).toFixed(2),
  };
};

/**
 * Reset counters (useful for testing)
 */
export const resetCounters = () => {
  readCount = 0;
  writeCount = 0;
  sessionStart = Date.now();
  console.clear();
  console.log(
    "%c[FIRESTORE MONITOR] Counters Reset",
    "color: #10b981; font-weight: bold;",
  );
};

/**
 * Print a summary report
 */
export const printSummary = () => {
  const stats = getOperationCounts();
  console.group(
    "%c📊 FIRESTORE USAGE SUMMARY",
    "color: #8b5cf6; font-size: 14px; font-weight: bold;",
  );
  console.table(stats);
  console.groupEnd();
};
