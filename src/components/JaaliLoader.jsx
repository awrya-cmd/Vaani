import React from "react";

export default function JaaliLoader({ stage = "Translating" }) {
  return (
    <div className="jaali-loader-container" role="status" aria-live="polite">
      <div className="jaali-loader-emblem">
        {/* Background Slowly Rotating Jaali Geometry */}
        <svg
          className="jaali-bg-mandala"
          width="46"
          height="46"
          viewBox="0 0 50 50"
          fill="none"
          aria-hidden="true"
        >
          {/* Outer fine dotted circle */}
          <circle
            cx="25"
            cy="25"
            r="22"
            stroke="#DEC6A7"
            strokeWidth="1"
            strokeDasharray="2.5 2.5"
            opacity="0.85"
          />
          {/* Dual concentric 8-point jaali fretwork */}
          <rect
            x="14"
            y="14"
            width="22"
            height="22"
            rx="2"
            stroke="#C4735E"
            strokeWidth="0.85"
            opacity="0.45"
          />
          <rect
            x="14"
            y="14"
            width="22"
            height="22"
            rx="2"
            stroke="#C4735E"
            strokeWidth="0.85"
            opacity="0.45"
            transform="rotate(45 25 25)"
          />
          {/* Inner delicate dashed ring */}
          <circle
            cx="25"
            cy="25"
            r="10"
            stroke="#D99A3D"
            strokeWidth="0.85"
            strokeDasharray="2 2"
            opacity="0.65"
          />
        </svg>

        {/* Foreground Curved Soundwave Strokes Moving Towards Each Other */}
        <svg
          className="jaali-soundwaves"
          width="46"
          height="46"
          viewBox="0 0 50 50"
          fill="none"
          aria-hidden="true"
        >
          {/* Left Outer Soundwave */}
          <path
            className="wave-stroke wave-left-outer"
            d="M 13 15 A 15 15 0 0 1 13 35"
            stroke="#C4735E"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Left Inner Soundwave */}
          <path
            className="wave-stroke wave-left-inner"
            d="M 19 19 A 9 9 0 0 1 19 31"
            stroke="#C75D72"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Center Acoustic Pulse Jewel */}
          <circle
            className="wave-center-jewel"
            cx="25"
            cy="25"
            r="2.2"
            fill="#D99A3D"
          />
          {/* Right Inner Soundwave */}
          <path
            className="wave-stroke wave-right-inner"
            d="M 31 19 A 9 9 0 0 0 31 31"
            stroke="#C75D72"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Right Outer Soundwave */}
          <path
            className="wave-stroke wave-right-outer"
            d="M 37 15 A 15 15 0 0 0 37 35"
            stroke="#C4735E"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="jaali-loader-text-wrap">
        <span className="jaali-loader-stage-name">{stage}</span>
        <span className="jaali-loader-dots" aria-hidden="true">
          <span className="dot dot-1">.</span>
          <span className="dot dot-2">.</span>
          <span className="dot dot-3">.</span>
        </span>
      </div>
    </div>
  );
}
