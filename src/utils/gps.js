// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

// Get user's current location with iOS safety checks
export const getCurrentLocation = () => {
  return new Promise(async (resolve, reject) => {
    // 🍎 iOS SAFETY: Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    // 🍎 iOS SAFETY: Check permission state if available (iOS 15.4+)
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });
        if (result.state === "denied") {
          reject(new Error("Location permission denied. Enable in Settings."));
          return;
        }
      } catch (e) {
        // Permission API not supported, continue with getCurrentPosition
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { timeout: 10000, enableHighAccuracy: false }, // 🍎 iOS: Add timeout
    );
  });
};

// Validate if user is at the hub location (within 100 meters)
export const validateLocation = (
  userLat,
  userLong,
  hubLat,
  hubLong,
  threshold = 0.1,
) => {
  const distance = calculateDistance(userLat, userLong, hubLat, hubLong);
  return distance <= threshold; // threshold in km (0.1 km = 100 meters)
};

// Mock GPS check for development
export const mockGPSCheck = (hubId) => {
  // Simulate GPS validation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "GPS location verified!",
      });
    }, 1000);
  });
};
