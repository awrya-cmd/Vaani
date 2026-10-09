import React from "react";
import { ALL_LANGUAGES } from "../constants/languages";
import JaaliCorners from "./JaaliCorners";

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
  canvasWaveRef,
  fileInputRef,
  isSwapRotated,
  onSwap,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onTranslate,
  hasAudio,
  translationStage,
}) {
  return (
    <section className="console-card voice-card" id="cardVoice">
      <div className="jaali-accent-top" aria-hidden="true" />
      <JaaliCorners />

      {/* Card Header */}
      <div className="card-top-head">
        <div className="card-top-icon rose-icon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v18" />
            <path d="M16 7v10" />
            <path d="M8 7v10" />
            <path d="M20 11v2" />
            <path d="M4 11v2" />
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
            <option value="auto">Auto Detect</option>
            {ALL_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
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
            {ALL_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Signature Microphone Recording Console Studio */}
      <div className="mic-waveform-studio">
        {/* Prominent Circular Microphone Button (72px) with Rose Halo */}
        <div className="mic-signature-stage">
          <button
            type="button"
            className={`mic-signature-btn ${
              status === "recording" ? "recording" : "idle"
            } ${hasAudio && status !== "recording" ? "has-audio" : ""}`}
            id="recordBtn"
            onClick={status === "recording" ? onStopRecording : onStartRecording}
            aria-label={
              status === "recording" ? "Stop recording" : "Start speaking"
            }
            title={
              status === "recording"
                ? "Click to stop recording"
                : "Click to speak (or press Spacebar)"
            }
          >
            {status === "recording" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="3" />
              </svg>
            ) : (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>
        </div>

        {/* Live Web Audio Waveform with Rounded Bars (Collapses on stop) */}
        <div
          className={`mic-waveform-collapsible ${
            status === "recording" ? "expanded" : "collapsed"
          }`}
          aria-hidden={status !== "recording"}
        >
          <canvas
            ref={canvasWaveRef}
            id="liveWaveformCanvas"
            className="live-waveform-canvas"
            aria-label="Microphone live waveform"
          />
        </div>

        {/* Dynamic Status / Feedback Display beneath Mic & Waveform */}
        {status === "recording" ? (
          <div className="mic-live-meta">
            <div className="mic-timer-pill" id="timerPill">
              <span className="mic-timer-dot pulsing" id="timerDot" />
              <span id="timerText">{formatTime(timerSeconds)}</span>
            </div>
            <div className="mic-title-caption live-caption" id="micCaption">
              Listening to your voice…
            </div>
            <div className="mic-hint-caption" id="micSubcaption">
              Tap the microphone to finish speaking
            </div>
          </div>
        ) : hasAudio ? (
          <div className="mic-collapsed-ready-area">
            <div className="compact-audio-ready-pill" id="audioReadyBadge">
              <span className="ready-indicator-dot" />
              <span className="ready-file-title" id="micCaption">
                {selectedFileName || "Audio ready"}
              </span>
              <span className="ready-action-tag">Ready to translate</span>
            </div>
            <div className="mic-hint-caption ready-hint" id="micSubcaption">
              Click &lsquo;Translate speech &nearr;&rsquo; or record again
            </div>
          </div>
        ) : (
          <div className="mic-idle-meta">
            <div className="mic-title-caption" id="micCaption">
              {status === "translating" ? `${translationStage}…` : "Click to speak"}
            </div>
            <div className="mic-hint-caption" id="micSubcaption">
              {status === "translating"
                ? "Processing speech model at server…"
                : "Or press Spacebar to start speaking"}
            </div>
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
