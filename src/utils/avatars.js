/**
 * Generates a dynamic DiceBear Adventurer avatar URL based on seed and tier.
 * @param {string} seed - The unique seed (usually username or custom seed).
 * @param {string} tierName - The name of the user's tier (Bronze, Silver, Gold, Legendary).
 * @param {number} size - The size of the avatar in pixels.
 * @returns {string} The formatted DiceBear API URL.
 */
export const getHeroAvatarUrl = (seed, tierName = "Bronze", size = 200) => {
  const style = tierName === "Legendary" ? "adventurer-neutral" : "adventurer";
  let baseUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
    seed
  )}&size=${size}`;

  // Add tier-specific parameters
  if (tierName === "Silver") {
    baseUrl += "&baseColor=b6b6b6"; // Silver tint
  } else if (tierName === "Gold") {
    baseUrl += "&baseColor=f59e0b"; // Gold tint
  }

  // Add accessory logic for high-end feel
  if (tierName === "Legendary") {
    baseUrl +=
      "&accessoriesProbability=100&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear";
  } else {
    baseUrl += "&accessoriesProbability=20";
  }

  return baseUrl;
};
