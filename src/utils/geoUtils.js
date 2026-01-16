/**
 * Calculates the distance between two points in meters using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Checks if the user is within a certain range of the hub.
 * @param {number} userLat
 * @param {number} userLon
 * @param {number} hubLat
 * @param {number} hubLon
 * @param {number} rangeInMeters
 * @returns {boolean}
 */
export const isWithinRange = (
  userLat,
  userLon,
  hubLat,
  hubLon,
  rangeInMeters = 100
) => {
  const distance = calculateDistance(userLat, userLon, hubLat, hubLon);
  return distance <= rangeInMeters;
};
