// Configuration for Real Estate Autonomous Map Engine
// Centered on Tumkur, Karnataka

const CONFIG = {
  // Reads from config.local.js if available, or fallback
  GOOGLE_MAPS_API_KEY: (typeof LOCAL_CONFIG !== "undefined" && LOCAL_CONFIG.GOOGLE_MAPS_API_KEY)
    ? LOCAL_CONFIG.GOOGLE_MAPS_API_KEY
    : "YOUR_GOOGLE_MAPS_API_KEY",

  // Default map settings (Tumkur City Center)
  DEFAULT_CENTER: {
    lat: 13.3409,
    lng: 77.1010
  },
  DEFAULT_ZOOM: 12.8,
  DETAIL_ZOOM: 17.0,

  // Map theme styling
  DEFAULT_MAP_TYPE: "roadmap"
};
