// vaani Translation Configuration
// Set the backend server endpoint and optional API key here.

// Server URL fallback resolution:
// 1. Vite environment variable import.meta.env.VITE_SERVER_URL if provided
// 2. Direct backend server http://172.16.41.109:8000
const envServerUrl =
  typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SERVER_URL
    ? import.meta.env.VITE_SERVER_URL
    : "";

export const CONFIG = {
  // Direct backend server URL (the primary FastAPI server for the summit)
  SERVER_URL: envServerUrl || "http://172.16.41.109:8000",
  API_BASE: envServerUrl || "http://172.16.41.109:8000",
  DIRECT_SERVER_URL: "http://172.16.41.109:8000",

  // Vite development proxy fallback
  PROXY_URL: "/api",

  // Optional X-API-Key header if authentication is enabled on the server
  API_KEY:
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_KEY) ||
    "",

  // Network timeout in milliseconds (180 seconds to allow ASR + NMT + TTS neural pipeline)
  TIMEOUT_MS: 180000,

  // Kiosk mode idle reset timer in seconds (60s as per spec)
  KIOSK_IDLE_SECONDS: 60,
};
