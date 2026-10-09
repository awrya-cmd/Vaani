import React from "react";
import { formatTime } from "../utils/audio";
import JaaliCorners from "./JaaliCorners";
import JaaliLoader from "./JaaliLoader";

export default function ConversationCard({
  sourceLangObj,
  targetLangObj,
  sourceLang,
  isSourceRTL,
  isTargetRTL,
  inputTranscript,
  outputTranscript,
  copiedSource,
  copiedTarget,
  onCopySource,
  onCopyTarget,
  audioUrl,
  ttsEngine,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  scrubPercent,
  onScrub,
  isSlow,
  onToggleSpeed,
  onDownload,
  audioElementRef,
  onTimeUpdate,
  onEnded,
  status,
  translationStage,
}) {
  return (
    <section className="console-card conversation-card" id="cardConversation">
      <div className="jaali-accent-top" aria-hidden="true" />
      <JaaliCorners />

      {/* Card Header */}
      <div className="card-top-head">
        <div className="card-top-icon gold-icon">
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
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-10-5 10" />
            <path d="M14 18h6" />
          </svg>
        </div>
        <div className="card-top-titles">
          <span className="card-top-name">Your Conversation</span>
          <span className="card-top-desc">
            Original transcript and translated voice
          </span>
        </div>
      </div>

      {/* Transcript Stack */}
      <div className="conversation-blocks-stack">
        {/* WHAT YOU SAID */}
        <div className="transcript-section-card">
          <div className="transcript-header-row">
            <span className="transcript-label-caps">WHAT YOU SAID</span>
            <div className="language-flag-pill" id="sourceMeta">
              <span id="sourceLangLabel">{sourceLangObj.name}</span>
            </div>
          </div>

          <div
            className={`transcript-content-text ${
              !inputTranscript ? "empty" : ""
            }`}
            id="sourceText"
            dir={isSourceRTL ? "rtl" : undefined}
            aria-live="polite"
          >
            {inputTranscript || "Your spoken transcript will appear here."}
          </div>

          <button
            type="button"
            className="copy-icon-btn"
            id="copySource"
            disabled={!inputTranscript}
            onClick={onCopySource}
            title="Copy original transcript"
          >
            {copiedSource ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
            <span>{copiedSource ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* TRANSLATED TEXT */}
        <div className="transcript-section-card">
          <div className="transcript-header-row">
            <span className="transcript-label-caps">TRANSLATED TEXT</span>
            <div className="language-flag-pill" id="translatedMeta">
              <span id="targetLangLabel">{targetLangObj.name}</span>
            </div>
          </div>

          {status === "translating" ? (
            <div className="transcript-loading-state" id="translatingState">
              <JaaliLoader stage={translationStage} />
            </div>
          ) : (
            <div
              className={`transcript-content-text ${
                !outputTranscript ? "empty" : ""
              } ${status === "translated" ? "fade-in" : ""}`}
              id="translatedText"
              dir={isTargetRTL ? "rtl" : undefined}
              aria-live="polite"
            >
              {outputTranscript || "Your translated text will appear here."}
            </div>
          )}

          <button
            type="button"
            className="copy-icon-btn"
            id="copyTranslated"
            disabled={!outputTranscript || status === "translating"}
            onClick={onCopyTarget}
            title="Copy translation"
          >
            {copiedTarget ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
            <span>{copiedTarget ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Translated Voice Audio Player Console */}
      <div className="translated-voice-player">
        <div className="voice-motif-badge" aria-hidden="true">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </div>

        <div className="player-inner-content">
          <span className="player-header-title" id="audioHeaderLabel">
            {ttsEngine ? `Translated Voice (${ttsEngine})` : "Translated Voice"}
          </span>

          <div className="player-controls-row">
            <button
              type="button"
              className="play-pause-btn"
              id="playAudioBtn"
              disabled={!audioUrl}
              onClick={onTogglePlay}
              title="Play translated audio"
              aria-label="Play audio"
            >
              {isPlaying ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ marginLeft: "1px" }}
                >
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              )}
            </button>

            <div
              className="scrub-track"
              id="scrubTrack"
              onClick={onScrub}
              title="Seek playback"
            >
              <div
                className="scrub-progress"
                id="scrubProgress"
                style={{ width: `${scrubPercent}%` }}
              />
            </div>

            <span className="player-time-badge" id="playerTime">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="audio-toolbar-buttons">
              <button
                type="button"
                className={`speed-pill-btn ${isSlow ? "active" : ""}`}
                id="speedToggleBtn"
                onClick={onToggleSpeed}
                title="Toggle 0.75x speed"
              >
                {isSlow ? "0.75x" : "1x"}
              </button>
              <button
                type="button"
                className="speed-pill-btn"
                id="downloadWavBtn"
                disabled={!audioUrl}
                onClick={onDownload}
                title="Download audio"
                aria-label="Download audio"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
              </button>
            </div>
          </div>

          <audio
            ref={audioElementRef}
            id="translatedAudio"
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            hidden
          />
        </div>
      </div>
    </section>
  );
}
