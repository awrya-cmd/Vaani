import React from "react";
import { ALL_LANGUAGES } from "../constants/languages";

export default function VoiceCard({
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  status,
  errorMessage,
  selectedFileName,
  timerSeconds,
  formatTime,
  canvasLeftRef,
  canvasRightRef,
  fileInputRef,
  isSwapRotated,
  onSwap,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onTranslate,
  hasAudio,
}) {
  return (
    <section className="console-card voice-card" id="cardVoice">
      <div className="jaali-accent-top" aria-hidden="true" />

      {/* Card Header */}
      <div className="card-top-head">
        <div className="card-top-icon rose-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>
        <div className="card-top-titles">
          <span className="card-top-name">Your Voice</span>
          <span className="card-top-desc">Speak in any language</span>
        </div>
      </div>

      {/* Language Selectors Row */}
      <div className="language-selectors-strip">
        <div className="selector-group">
          <label htmlFor="source">Source Language</label>
          <select
            id="source"
            className="custom-select"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
          >
            {ALL_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`swap-button-circle ${isSwapRotated ? "rotated" : ""}`}
          id="swapBtn"
          title="Swap languages"
          aria-label="Swap source and target languages"
          onClick={onSwap}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m16 3 4 4-4 4" />
            <path d="M20 7H4" />
            <path d="m8 21-4-4 4-4" />
            <path d="M4 17h16" />
          </svg>
        </button>

        <div className="selector-group">
          <label htmlFor="target">Translate To</label>
          <select
            id="target"
            className="custom-select"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            {ALL_LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Central Microphone Console with Flanking Waveforms */}
      <div className="mic-waveform-studio">
        <div className="mic-stage-row">
          <canvas
            ref={canvasLeftRef}
            id="waveLeft"
            className="waveform-canvas"
            aria-hidden="true"
          />

          <button
            type="button"
            className={`mic-glow-button ${
              status === "recording" ? "recording" : ""
            }`}
            id="recordBtn"
            onClick={status === "recording" ? onStopRecording : onStartRecording}
            aria-label={
              status === "recording" ? "Stop speaking" : "Start speaking"
            }
            title={
              status === "recording"
                ? "Click to stop recording"
                : "Click to speak (or press Spacebar)"
            }
          >
            {status === "recording" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>

          <canvas
            ref={canvasRightRef}
            id="waveRight"
            className="waveform-canvas"
            aria-hidden="true"
          />
        </div>

        <div className="mic-title-caption" id="micCaption">
          {status === "recording"
            ? "Listening to your voice…"
            : status === "translating"
            ? "Translating speech…"
            : selectedFileName
            ? selectedFileName
            : hasAudio
            ? "Audio ready"
            : "Click to start speaking"}
        </div>

        <div className="mic-hint-caption" id="micSubcaption">
          {status === "recording"
            ? "Tap to complete your speech"
            : status === "translating"
            ? "Processing voice model at server…"
            : selectedFileName
            ? "WAV audio ready. Click 'Translate speech'."
            : "Your voice will be translated in real time"}
        </div>

        {status === "recording" && (
          <div className="mic-timer-pill" id="timerPill">
            <span className="mic-timer-dot pulsing" id="timerDot" />
            <span id="timerText">{formatTime(timerSeconds)}</span>
          </div>
        )}
      </div>

      {/* Voice Footer Actions */}
      <div className="card-voice-footer">
        <button
          type="button"
          className="text-action-btn"
          id="uploadBtn"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload audio file
        </button>
        <input
          type="file"
          ref={fileInputRef}
          id="audioFile"
          accept="audio/*,.wav"
          onChange={onFileUpload}
          hidden
        />

        <button
          type="button"
          className="primary-translate-trigger"
          id="translateBtn"
          disabled={!hasAudio || status === "translating"}
          onClick={onTranslate}
        >
          {status === "translating" ? "Translating…" : "Translate speech ↗"}
        </button>
      </div>

      {errorMessage && (
        <div className="inline-error-banner show" id="errorBox" role="alert">
          {errorMessage}
        </div>
      )}
    </section>
  );
}
