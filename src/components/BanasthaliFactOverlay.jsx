import React, { useState, useEffect, useRef } from "react";
import { BANASTHALI_FACTS } from "../constants/banasthaliFacts";

// Track viewed fact indices across the session to prevent repeating
let sessionViewedIndices = [];

export default function BanasthaliFactOverlay({ isTranslating }) {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [phase, setPhase] = useState("loading"); // "loading" (0-2s) | "fact" (>2s)
  const [factIndex, setFactIndex] = useState(3); // Default to Fact 04 "Honoured by the Nation" as in reference, then rotates

  const twoSecTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const isTranslatingRef = useRef(isTranslating);

  isTranslatingRef.current = isTranslating;

  const pickNextFactIndex = () => {
    let unviewed = BANASTHALI_FACTS.map((_, i) => i).filter(
      (idx) => !sessionViewedIndices.includes(idx)
    );

    if (unviewed.length === 0) {
      sessionViewedIndices = [];
      unviewed = BANASTHALI_FACTS.map((_, i) => i);
    }

    const nextIdx = unviewed[0];
    sessionViewedIndices.push(nextIdx);
    return nextIdx;
  };

  useEffect(() => {
    if (isTranslating) {
      if (twoSecTimerRef.current) clearTimeout(twoSecTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

      setPhase("loading");
      setVisible(true);
      setDismissing(false);

      // Exactly 2-second timer
      twoSecTimerRef.current = setTimeout(() => {
        if (isTranslatingRef.current) {
          const nextIdx = pickNextFactIndex();
          setFactIndex(nextIdx);
          setPhase("fact");
        }
      }, 2000);
    } else {
      if (twoSecTimerRef.current) {
        clearTimeout(twoSecTimerRef.current);
        twoSecTimerRef.current = null;
      }

      setDismissing(true);
      dismissTimerRef.current = setTimeout(() => {
        setVisible(false);
        setDismissing(false);
      }, 190);
    }

    return () => {
      if (twoSecTimerRef.current) clearTimeout(twoSecTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [isTranslating]);

  const handleDiscoverAnother = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextIdx = pickNextFactIndex();
    setFactIndex(nextIdx);
  };

  if (!visible) return null;

  const currentFact = BANASTHALI_FACTS[factIndex] || BANASTHALI_FACTS[0];

  return (
    <>
      {/* Warm ivory/peach translucent backdrop softly lightening & blurring the scene behind */}
      <div
        className={`banasthali-fact-backdrop ${
          dismissing ? "dismissing" : "active"
        }`}
        aria-hidden="true"
      />

      {/* Floating Vintage Postage-Stamp Overlay */}
      <aside
        className={`banasthali-fact-overlay ${
          dismissing ? "dismissing" : "active"
        }`}
        role="complementary"
        aria-label="A Little About Banasthali"
        aria-live="polite"
      >
        <div className="vintage-postage-stamp-wrap">
          {phase === "loading" ? (
            /* Phase 1 (0–2s): Compact Vintage Stamp Dispatch Note */
            <div className="vintage-postage-stamp loading-stamp">
              <div className="stamp-inner-frame loading-frame">
                <div className="stamp-loading-wave-cluster" aria-hidden="true">
                  <span className="stamp-wave-arc arc-1" />
                  <span className="stamp-wave-arc arc-2" />
                  <span className="stamp-wave-arc arc-3" />
                  <span className="stamp-wave-arc arc-4" />
                </div>
                <div className="stamp-loading-text-col">
                  <div className="stamp-eyebrow-mini">
                    <span className="stamp-glyph">✥</span>
                    <span>VOICE TRANSLATION</span>
                    <span className="stamp-glyph">✥</span>
                  </div>
                  <div className="stamp-loading-caption">
                    Translating your voice…
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Phase 2 (>2s): Refined Vintage Postage-Stamp Postcard matching reference Image 3 */
            <div className="vintage-postage-stamp fact-stamp">
              <div className="stamp-inner-frame">
                {/* Left Column: Vintage Chhatri Pavilion Architectural Etching with Bougainvillea */}
                <div className="stamp-illustration-pane">
                  <img
                    src="/chhatri_illustration.png"
                    alt="Banasthali heritage pavilion"
                    className="stamp-chhatri-img"
                  />
                </div>

                {/* Right Column: Editorial Postal Content */}
                <div className="stamp-content-pane">
                  {/* Top Bar with Eyebrow and Vintage Postmark Seal */}
                  <div className="stamp-header-row">
                    <div className="stamp-eyebrow">
                      <span className="stamp-glyph">✥</span>
                      <span>
                        {currentFact.id === "02" || currentFact.id === "03"
                          ? "BANASTHALI · AVIATION HERITAGE"
                          : currentFact.id === "05"
                          ? "BANASTHALI · WOMEN IN LEADERSHIP"
                          : currentFact.id === "10"
                          ? "BANASTHALI · 90-YEAR LEGACY"
                          : "A LITTLE ABOUT BANASTHALI"}
                      </span>
                      <span className="stamp-glyph">✥</span>
                    </div>

                    <div className="stamp-postmark-box" aria-hidden="true">
                      <img
                        src="/postmark.png"
                        alt="Postal cancellation mark"
                        className="stamp-postmark-img"
                      />
                    </div>
                  </div>

                  {/* Fact Heading */}
                  <h3 className="stamp-fact-title">{currentFact.title}</h3>

                  {/* Concise Description with Bold Highlights */}
                  <div className="stamp-fact-body">{currentFact.content}</div>

                  {/* Footer Row: Discover Action (No numbering shown) */}
                  <div className="stamp-footer-row">
                    <div className="stamp-counter-strip" aria-hidden="true">
                      <span className="stamp-counter-diamond">◆</span>
                      <span className="stamp-counter-dash" />
                      <span className="stamp-counter-diamond">◆</span>
                    </div>

                    <button
                      type="button"
                      className="stamp-discover-btn"
                      onClick={handleDiscoverAnother}
                      aria-label="Discover another Banasthali fact"
                    >
                      <span
                        className="stamp-btn-circle-icon"
                        aria-hidden="true"
                      >
                        ➔
                      </span>
                      <span className="stamp-btn-label">Discover another</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
