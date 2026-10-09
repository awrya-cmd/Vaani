# vaani

> Speech-to-speech translation platform redesigned for the **BRICS Summit 2026 at Banasthali Vidyapith**.

`vaani` bridges multilateral diplomacy with Rajasthan’s artistic traditions—incorporating **Gandhian handmade paper palettes**, a **Jharokha cusped archway microphone**, a real-time **Leheriya textile waveform**, and an interactive **Sanganeri block-print atelier** that settles into a decorative border upon translation.

---

## 1. Quick Start & Run Steps

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Launch Vite development server
npm run dev
```

The application will start locally on `http://localhost:5173`.

---

## 2. Configuration (`src/config.js`)

All server connectivity, timeouts, and kiosk parameters are centrally managed in `src/config.js`:

```javascript
export const CONFIG = {
  // When using Vite dev proxy, '/api' forwards requests to the remote translation server
  SERVER_URL: "/api",
  
  // Direct backend address
  DIRECT_SERVER_URL: "http://172.16.41.109:8000",
  
  // Optional X-API-Key header if authentication is required by the backend
  API_KEY: "",
  
  // Network timeout in milliseconds
  TIMEOUT_MS: 45000,
  
  // Kiosk mode idle reset timer in seconds (resets to initial state after 60s)
  KIOSK_IDLE_SECONDS: 60,
};
```

### Vite Dev Proxy (`vite.config.js`)
To avoid CORS issues in local development, `/api` is proxied directly:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://172.16.41.109:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

---

## 3. Microphone & Audio Plan

- **Origin Security**: Web Audio and `navigator.mediaDevices.getUserMedia` are supported natively on `localhost` (e.g., `http://localhost:5173`) and any `https://` production deployment.
- **Audio Encoding**: Audio is captured at `16,000 Hz` (mono) and encoded client-side into clean 16-bit PCM `RIFF/WAVE` format (`speechinput.wav`) using `encodeWAV()`. This format is uncompressed and universally supported by speech-to-speech translation pipelines.
- **Cached Re-translation**: Changing the target language re-transmits the cached audio blob immediately without requiring the delegate to re-speak.

---

## 4. Key Architectural Features

- **Jharokha Arch with Mic**: Cusped Rajasthani stone archway framing the central push-to-talk button (`min 56px`, exceeding the 48px touch requirement). Supports both tap-to-toggle and `Spacebar` keyboard shortcut.
- **Real-Time Leheriya Waveform**: Web Audio `AnalyserNode` drives undulating sinusoidal bars styled after Jaipur's Leheriya tie-dye textiles. When recording stops, it smoothly contracts into a single centered dot.
- **Interactive Sanganeri Block-Print Loader**:
  - Displays while translation is processing.
  - Delegates can tap/drag to stamp authentic wooden block motifs (*Lotus*, *Kalka/Paisley*, *Champa flower*, *Buti*).
  - **Symmetric Mode**: Stamps 2-way and 4-way mirrored motifs simultaneously.
  - **Self-Playing Fallback**: Rhythmical auto-stamping activates if idle for > 2 seconds.
  - **Settling Border**: Settles into a decorative Sanganeri border framing the Translation panel when results arrive.
- **Heard & Translation Panels**:
  - `dir="rtl"` applied dynamically per-panel when Arabic (`ar`), Persian (`fa`), or Urdu (`ur`) is selected.
  - Word-by-word reveal effect for translated text.
  - **"via English"** tag appears when `pivot_text` is returned by the backend.
  - Complete audio toolbar: **Replay**, **Slow 0.75x**, **Copy**, and **Download audio (.wav)**.
  - **"Translated in X s"** certification seal.
- **Kiosk Mode**:
  - Automatic 60-second idle reset on inactivity.
  - `A+` large-text toggle button for conference hall and podium legibility.
- **Conversation History**:
  - In-memory turn log with timestamps, source/target transcripts, and inline audio playback.
  - "Clear" button to wipe session logs.

---

## 5. Verification & Testing Checklist

The following scenarios were verified:

1. **Brand Adherence**: Title tag and primary branding strictly set to `vaani`. Forbidden string ("Voice Translator") eliminated completely from all titles, headings, and alt text.
2. **Visual & Design Constraints**:
   - Zero gradients (all flat colors from `VAANI_SPEC.md`: `#fbf6ed`, `#fffdf8`, `#302a27`, `#c75d72`, `#d99a3d`, `#557564`).
   - Zero glassmorphism (no `backdrop-filter: blur`).
   - Zero navy or dark-blue backgrounds.
   - Zero glow effects or clipart.
   - Zero CDN dependencies (system font stacks: Playfair Display / Georgia for headings, DM Sans / System UI for text).
3. **Mobile & Responsive Layout**:
   - Mobile (< 520px): Single-column view with touch targets ≥ 48px.
   - Tablet (820px): Stacked bilateral consoles and touch-friendly chip rows.
   - Desktop (1080px): Expansive bilateral side-by-side workspace.
4. **Reduced Motion (`prefers-reduced-motion: reduce`)**:
   - Disables Leheriya wave animation, Sanganeri stamp animations, and reveals words instantly.
5. **RTL Directionality**:
   - Verified right-to-left layout for Arabic (`ar`), Persian (`fa`), and Urdu (`ur`) on both source and target panels.
6. **Error Scenarios**:
   - Handled mic permission denial, network timeouts, and server unreachable errors with friendly messages.
