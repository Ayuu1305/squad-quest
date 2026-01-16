// Set this to true to FORCE the Showdown UI for testing
const TEST_MODE = false;

export const isShowdownActive = (date = new Date()) => {
  if (TEST_MODE) return true;

  const now = date instanceof Date ? date : new Date(date);
  const day = now.getDay(); // 0 is Sunday
  const hours = now.getHours();

  // Sunday (0) between 21:00 (9 PM) and 23:59
  return day === 0 && hours >= 21;
};

export const getTimeUntilShowdownEnd = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight - now;
  if (diff < 0) return { h: 0, m: 0, s: 0, total: 0 };

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return { h, m, s, total: diff };
};
