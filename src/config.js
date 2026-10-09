// vaani Translation Configuration
// Set the backend server endpoint and optional API key here.

// Safe server URL resolution:
// 1. Vite environment variable import.meta.env.VITE_SERVER_URL if provided
// 2. Default to Vite proxy path "/api" (which proxies to http://172.16.41.109:8000)
const envServerUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SERVER_URL) 
  ? import.meta.env.VITE_SERVER_URL 
  : "";

const fallbackServerUrl = envServerUrl || "/api";

export const CONFIG = {
  // Primary endpoint (empty or /api routes through Vite development proxy)
  SERVER_URL: fallbackServerUrl,
  API_BASE: fallbackServerUrl,
  API_URL: fallbackServerUrl,
  
  // Direct backend server URL (used for reference or direct non-proxied requests)
  DIRECT_SERVER_URL: "http://172.16.41.109:8000",
  
  // Optional X-API-Key header if authentication is enabled on the server
  API_KEY: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_KEY) || "",
  
  // Network timeout in milliseconds (45 seconds default)
  TIMEOUT_MS: 45000,
  
  // Kiosk mode idle reset timer in seconds (60s as per spec)
  KIOSK_IDLE_SECONDS: 60,
};

