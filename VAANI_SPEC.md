# VAANI_SPEC.md
**Specification & Design System for vaani • BRICS Summit 2026 at Banasthali Vidyapith**

---

## 1. Brand & Identity

- **Name**: `vaani` (Strictly lowercase in primary brand marks and title tags. Never use "Voice Translator").
- **Motto / Tagline**: *"Speech, understood • Banasthali Vidyapith"*
- **Heritage**: Gandhian simplicity meets Rajasthani cultural heritage (Sanganeri block-print motifs, Leheriya textiles, Jharokha stone archways, warm handmade paper).
- **Language Policy**: All UI text is in English. Only transcripts and translated speech appear in the selected language.

---

## 2. Flat Color Palette (Strictly No Gradients, No Glows, No Glassmorphism, No Navy)

All colors are flat, high-contrast, earthy, and warm:

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#fbf6ed` | Primary page backdrop (warm handmade paper) |
| `--paper2` | `#fffdf8` | Elevated card surfaces (milk-white handmade card) |
| `--ink` | `#302a27` | Primary typography & deep ink marks |
| `--muted` | `#766c64` | Secondary labels, captions, metadata |
| `--rose` | `#c75d72` | Jaipur terracotta / rose accent (primary action) |
| `--rose-dark` | `#9f4055` | Hover & active states for rose |
| `--rose-pale` | `#f6e2e3` | Pill backgrounds, subtle badge fills |
| `--saffron` | `#d99a3d` | Desert saffron / marigold accent (secondary highlight) |
| `--saffron-pale` | `#f7ecd5` | Saffron pill background & badges |
| `--green` | `#557564` | Eucalyptus / champa green (success & active recording) |
| `--green-pale` | `#eaf1ed` | Success message backgrounds |
| `--line` | `#e9ded1` | Refined hairline structural borders |
| `--line-dark` | `#d5c7b7` | Active borders, dividers |

---

## 3. Typography & Spacing

- **Heading Font**: `'Playfair Display', Georgia, Cambria, 'Times New Roman', serif`
- **Body & UI Font**: `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Scale**:
  - Title: `32px` – `48px` (clamp)
  - Card Titles: `17px` – `19px`
  - Body / Transcripts: `15px` – `17px`
  - Metadata / Badges: `11px` – `12px`
- **Touch Target**: Minimum `48px x 48px` for all interactive elements (WCAG AA).
- **Contrast**: Contrast ratio between `--ink` and `--paper` is > 11:1 (exceeding WCAG AAA).

---

## 4. Components & Architecture

### A. Jharokha Arch with Mic
- Traditional pointed cusped archway inspired by Rajasthani architecture.
- Housing the central microphone push-to-talk button (`min 56px`).
- Tap-to-toggle recording.
- Spacebar shortcut toggles recording on/off (disabled when typing in text fields).

### B. Leheriya Real-Time Waveform
- Driven by Web Audio API `AnalyserNode`.
- Undulating wave rhythm reminiscent of Jaipur's diagonal Leheriya textiles.
- Flat alternating terracotta (`#c75d72`) and saffron (`#d99a3d`) bars with smooth sinusoidal envelopes.
- **On Stop**: Smoothly collapses inward into a single centered dot.

### C. Sanganeri Block-Print Loader
- Active strictly during the `Translating` state.
- Interactive stamping canvas: users can tap/drag to stamp authentic wooden block motifs (Lotus, Champa flower, Paisley/Kalka, Trefoil buti).
- **Symmetric Mode**: Toggle to stamp 2-way or 4-way mirrored motifs like printed textile borders.
- **Self-Playing Fallback**: If no user interaction occurs for 2 seconds, automated rhythmic stamping triggers.
- **Settling Border**: When translation completes, the stamps settle into a decorative Sanganeri border framing the Translation panel.

### D. Heard & Translation Panels
- **Heard Panel**: Real-time transcript of speaker remarks. Copy button.
- **Translation Panel**: Translated output with word-by-word staggered reveal.
- **"via English" Tag**: Visible when `pivot_text` is returned by the backend.
- **Playback Controls**: Auto-play audio, Replay, Slow (0.75x toggle), Copy text, Download audio (.wav).
- **"Translated in X s" Seal**: Block-printed certification seal showing execution time.

### E. History Archive
- In-memory feed of previous session turns with source/target texts and inline replay.
- Clear History action.

### F. Kiosk Mode & Accessibility
- **60-Second Idle Reset**: Automatic timeout clears audio/transcript back to clean state for the next delegate.
- **Large Text Mode**: Toggle for exhibition/kiosk visibility.
- **RTL Support**: Automatic `dir="rtl"` applied per-panel when Arabic (`ar`) or Persian (`fa`) is selected.
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce`.

---

## 5. Backend Contract

- **Endpoint**: `POST {SERVER}/translate`
- **Body**: Multipart form data with `audio` (WAV file), `source` (code), `target` (code).
- **Headers**: Optional `X-API-Key`.
- **Response**: JSON with `source_text`, `pivot_text` (optional), `translated_text`, `tts_engine`, `processing_seconds`, `audio_base64`.
