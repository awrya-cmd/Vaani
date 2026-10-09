import React, { useState, useRef, useEffect, useCallback } from "react";
import { CONFIG } from "./config";

export const ALL_LANGUAGES = [
  { code: "auto", name: "Auto Detect", flag: "🌐" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", rtl: true },
  { code: "bn", name: "Bengali", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", flag: "🇵🇰", rtl: true },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "fa", name: "Persian", flag: "🇮🇷", rtl: true },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
];

const RTL_LANG_CODES = ["ar", "ur", "fa"];

export default function App() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");

  // Status: 'ready' | 'recording' | 'recorded' | 'translating' | 'translated' | 'error'
  const [status, setStatus] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");

  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [detectedLangCode, setDetectedLangCode] = useState("hi");
  const [audioUrl, setAudioUrl] = useState(null);
  const [ttsEngine, setTtsEngine] = useState("");

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSlow, setIsSlow] = useState(false);
  const [isSwapRotated, setIsSwapRotated] = useState(false);

  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const selectedFileNameRef = useRef("");
  const fileInputRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasLeftRef = useRef(null);
  const canvasRightRef = useRef(null);
  const audioElementRef = useRef(null);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const getLangObj = (code) => ALL_LANGUAGES.find((l) => l.code === code) || { code, name: code, flag: "🌐" };

  // Flanking Waveform Visualization
  const drawFlankingWaves = useCallback(() => {
    const cLeft = canvasLeftRef.current;
    const cRight = canvasRightRef.current;
    const analyser = analyserRef.current;
    if (!cLeft || !cRight || !analyser) return;

    const ctxL = cLeft.getContext("2d");
    const ctxR = cRight.getContext("2d");
    const values = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(values);

    const renderBars = (canvas, ctx, isLeft) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const bars = 18;
      const barW = 3;
      const gap = (w - bars * barW) / (bars - 1);
      const mid = h / 2;

      for (let i = 0; i < bars; i++) {
        const valIdx = isLeft ? bars - 1 - i : i;
        const amp = (values[valIdx * 2] || 0) / 255.0;
        const barH = Math.max(3, amp * (h * 0.9));
        const x = i * (barW + gap);

        ctx.fillStyle = amp > 0.5 ? "#D38D30" : "#8F2B39";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, mid - barH / 2, barW, barH, 2);
        else ctx.rect(x, mid - barH / 2, barW, barH);
        ctx.fill();
      }
    };

    renderBars(cLeft, ctxL, true);
    renderBars(cRight, ctxR, false);

    animFrameRef.current = requestAnimationFrame(drawFlankingWaves);
  }, []);

  const stopFlankingWaves = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    [canvasLeftRef.current, canvasRightRef.current].forEach((c) => {
      if (c) {
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
      }
    });
  }, []);

  // Resize canvases
  const resizeCanvases = () => {
    const dpr = window.devicePixelRatio || 1;
    [canvasLeftRef.current, canvasRightRef.current].forEach((c) => {
      if (c) {
        const r = c.getBoundingClientRect();
        c.width = Math.max(1, r.width * dpr);
        c.height = Math.max(1, r.height * dpr);
        const ctx = c.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    });
  };

  // Start Recording
  const startRecording = async () => {
    setErrorMessage("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage("Microphone access is unavailable. A secure HTTPS origin or localhost is required.");
      setStatus("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      audioBlobRef.current = null;
      selectedFileNameRef.current = "";

      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioBlobRef.current = blob;

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        stopFlankingWaves();
        setStatus("recorded");
      };

      recorder.start(200);
      setStatus("recording");
      setTimerSeconds(0);

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      resizeCanvases();
      drawFlankingWaves();

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const startMs = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - startMs) / 1000));
      }, 250);
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Microphone permission was denied. Please allow microphone access in your browser."
        : "Could not initialize microphone.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage("");
    if (status === "recording") stopRecording();
    audioBlobRef.current = file;
    selectedFileNameRef.current = file.name;
    stopFlankingWaves();
    setStatus("recorded");
  };

  const handleSwap = () => {
    setIsSwapRotated((prev) => !prev);
    const newTarget = sourceLang === "auto" ? "en" : sourceLang;
    const newSource = targetLang;
    setSourceLang(newSource);
    setTargetLang(newTarget);
    if (audioBlobRef.current && status !== "recording") {
      executeTranslation(newSource, newTarget);
    }
  };

  // Translation API Call
  const executeTranslation = async (sLang = sourceLang, tLang = targetLang) => {
    const blob = audioBlobRef.current;
    if (!blob) return;

    setErrorMessage("");
    setStatus("translating");

    try {
      const form = new FormData();
      const ext = blob.name ? blob.name.split(".").pop() : (blob.type.includes("mp4") ? "mp4" : "webm");
      form.append("audio", blob, selectedFileNameRef.current || `recording.${ext}`);

      // Resolve "auto" to a concrete language code before calling the API
      let actualSource = (sLang === "auto" || !sLang)
        ? (detectedLangCode && detectedLangCode !== "auto" ? detectedLangCode : "hi")
        : sLang;

      if (sLang === "auto" && actualSource === tLang) {
        actualSource = tLang === "hi" ? "en" : "hi";
      }

      form.append("source", actualSource);
      form.append("target", tLang);

      const serverUrl = CONFIG?.API_BASE || CONFIG?.SERVER_URL || "/api";
      const sanitizedBase = (serverUrl || "").replace(/\/$/, "");
      const endpoint = `${sanitizedBase}/translate`;

      const headers = {};
      if (CONFIG?.API_KEY) {
        headers["X-API-Key"] = CONFIG.API_KEY;
      }

      const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: form,
      });

      if (!resp.ok) {
        let detail = "The translation server returned an error.";
        try {
          const errData = await resp.json();
          detail = errData.detail || errData.message || detail;
        } catch {}
        throw new Error(`${detail} (HTTP ${resp.status})`);
      }

      const data = await resp.json();

      setInputTranscript(data.source_text || "");
      setOutputTranscript(data.translated_text || "");
      setTtsEngine(data.tts_engine || "");

      if (data.source_text && sLang === "auto") {
        setDetectedLangCode("hi");
      }

      if (data.audio_base64) {
        const binary = atob(data.audio_base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
        setAudioUrl(url);

        if (audioElementRef.current) {
          audioElementRef.current.src = url;
          audioElementRef.current.playbackRate = isSlow ? 0.75 : 1.0;
          audioElementRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }

      setStatus("translated");
    } catch (err) {
      const serverDisplay = CONFIG?.DIRECT_SERVER_URL || CONFIG?.SERVER_URL || "http://172.16.41.109:8000";
      setErrorMessage(`Translation failed. ${err.message}. Verify that the translation server is running at ${serverDisplay}.`);
      setStatus("error");
    }
  };

  // Audio Playback Controls
  const togglePlay = () => {
    if (!audioElementRef.current || !audioUrl) return;
    if (audioElementRef.current.paused) {
      audioElementRef.current.play();
      setIsPlaying(true);
    } else {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      setCurrentTime(audioElementRef.current.currentTime || 0);
      setDuration(audioElementRef.current.duration || 0);
    }
  };

  const handleScrub = (e) => {
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (audioElementRef.current && duration > 0) {
      audioElementRef.current.currentTime = pos * duration;
    }
  };

  const toggleSpeed = () => {
    const nextSlow = !isSlow;
    setIsSlow(nextSlow);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = nextSlow ? 0.75 : 1.0;
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `vaani_${sourceLang}_to_${targetLang}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Copy Handlers
  const handleCopySource = () => {
    if (!inputTranscript) return;
    navigator.clipboard.writeText(inputTranscript).then(() => {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 1300);
    });
  };

  const handleCopyTarget = () => {
    if (!outputTranscript) return;
    navigator.clipboard.writeText(outputTranscript).then(() => {
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 1300);
    });
  };

  // Spacebar Record Toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") return;
        e.preventDefault();
        if (status === "recording") stopRecording();
        else startRecording();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvases);
    return () => {
      window.removeEventListener("resize", resizeCanvases);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const sourceLangObj = getLangObj(sourceLang === "auto" ? detectedLangCode : sourceLang);
  const targetLangObj = getLangObj(targetLang);

  const isSourceRTL = RTL_LANG_CODES.includes(sourceLang === "auto" ? detectedLangCode : sourceLang);
  const isTargetRTL = RTL_LANG_CODES.includes(targetLang);

  const scrubPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="scenic-wrapper">
      <div className="content-container">
        {/* Navbar Header */}
        <header className="navbar">
          <a href="#" className="nav-pill-badge" title="Vaani — Speech Translation">
            <div className="nav-logo-circle">
              <img src="/vaani_emblem.png" alt="Vaani Crest" className="nav-logo-img" onError={(e) => (e.currentTarget.src = "/logo.png")} />
            </div>
            <span className="nav-brand-title">Vaani</span>
            <span className="nav-divider">|</span>
            <span className="nav-tagline">Speech, Understood</span>
          </a>

          <div className="nav-right-group">
            <a href="https://banasthali.org" target="_blank" rel="noreferrer" className="banasthali-header-badge" title="Banasthali Vidyapith">
              <img src="/banasthali_logo.png" alt="Banasthali University" className="banasthali-header-img" />
            </a>
          </div>
        </header>

        {/* Centered Hero Heading */}
        <section className="hero-block" id="home">
          <div className="rajasthan-eyebrow">
            <span className="eyebrow-flourish">✤</span>
            <span>Pādhāro Māre Des</span>
            <span className="eyebrow-flourish">✤</span>
          </div>

          <div className="hero-title-graphic-container">
            <img src="/vaani_title.png" alt="Vaani — Speech, Understood" className="hero-title-img" />
          </div>

          <p className="hero-tagline">Speak naturally. See the words. Hear the translation.</p>
        </section>

        {/* Balanced 2-Card Translation Workspace */}
        <main className="workspace-grid">
          {/* LEFT CARD: YOUR VOICE */}
          <section className="console-card voice-card" id="cardVoice">
            <div className="jaali-accent-top" aria-hidden="true" />
            <div className="card-top-head">
              <div className="card-top-icon rose-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  onChange={(e) => {
                    setSourceLang(e.target.value);
                    if (audioBlobRef.current && status !== "recording") {
                      executeTranslation(e.target.value, targetLang);
                    }
                  }}
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
                onClick={handleSwap}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  onChange={(e) => {
                    setTargetLang(e.target.value);
                    if (audioBlobRef.current && status !== "recording") {
                      executeTranslation(sourceLang, e.target.value);
                    }
                  }}
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
                <canvas ref={canvasLeftRef} id="waveLeft" className="waveform-canvas" aria-hidden="true" />

                <button
                  type="button"
                  className={`mic-glow-button ${status === "recording" ? "recording" : ""}`}
                  id="recordBtn"
                  onClick={status === "recording" ? stopRecording : startRecording}
                  aria-label={status === "recording" ? "Stop speaking" : "Start speaking"}
                  title={status === "recording" ? "Click to stop recording" : "Click to speak (or press Spacebar)"}
                >
                  {status === "recording" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  )}
                </button>

                <canvas ref={canvasRightRef} id="waveRight" className="waveform-canvas" aria-hidden="true" />
              </div>

              <div className="mic-title-caption" id="micCaption">
                {status === "recording"
                  ? "Listening to your voice…"
                  : status === "recorded"
                  ? "Recording captured"
                  : status === "translating"
                  ? "Translating speech…"
                  : selectedFileNameRef.current
                  ? selectedFileNameRef.current
                  : "Click to start speaking"}
              </div>

              <div className="mic-hint-caption" id="micSubcaption">
                {status === "recording"
                  ? "Tap to complete your speech"
                  : status === "recorded"
                  ? "Tap Translate speech or speak again"
                  : status === "translating"
                  ? "Giving your words a voice in another language…"
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
                accept="audio/*"
                onChange={handleFileUpload}
                hidden
              />

              <button
                type="button"
                className="primary-translate-trigger"
                id="translateBtn"
                disabled={!audioBlobRef.current || status === "translating"}
                onClick={() => executeTranslation()}
              >
                Translate speech ↗
              </button>
            </div>

            {errorMessage && (
              <div className="inline-error-banner show" id="errorBox" role="alert">
                {errorMessage}
              </div>
            )}
          </section>

          {/* Center Connector Arrow */}
          <div className="cards-connector-arrow" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          {/* RIGHT CARD: YOUR CONVERSATION */}
          <section className="console-card conversation-card" id="cardConversation">
            <div className="jaali-accent-top" aria-hidden="true" />
            <div className="card-top-head">
              <div className="card-top-icon gold-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <span className="card-top-desc">Original transcript and translated voice</span>
              </div>
            </div>

            {/* Transcript Stack */}
            <div className="conversation-blocks-stack">
              {/* WHAT YOU SAID */}
              <div className="transcript-section-card">
                <div className="transcript-header-row">
                  <span className="transcript-label-caps">WHAT YOU SAID</span>
                  <div className="language-flag-pill" id="sourceMeta">
                    <span className="flag-emoji" id="sourceFlag">{sourceLangObj.flag}</span>
                    <span id="sourceLangLabel">
                      {sourceLang === "auto" ? `${sourceLangObj.name} (Detected)` : sourceLangObj.name}
                    </span>
                  </div>
                </div>

                <div
                  className={`transcript-content-text ${!inputTranscript ? "empty" : ""}`}
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
                  onClick={handleCopySource}
                  title="Copy original transcript"
                >
                  {copiedSource ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <span className="flag-emoji" id="targetFlag">{targetLangObj.flag}</span>
                    <span id="targetLangLabel">{targetLangObj.name}</span>
                  </div>
                </div>

                <div
                  className={`transcript-content-text ${!outputTranscript ? "empty" : ""}`}
                  id="translatedText"
                  dir={isTargetRTL ? "rtl" : undefined}
                  aria-live="polite"
                >
                  {outputTranscript || "Your translated text will appear here."}
                </div>

                <button
                  type="button"
                  className="copy-icon-btn"
                  id="copyTranslated"
                  disabled={!outputTranscript}
                  onClick={handleCopyTarget}
                  title="Copy translation"
                >
                  {copiedTarget ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    onClick={togglePlay}
                    title="Play translated audio"
                    aria-label="Play audio"
                  >
                    {isPlaying ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "1px" }}>
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                    )}
                  </button>

                  <div className="scrub-track" id="scrubTrack" onClick={handleScrub} title="Seek playback">
                    <div className="scrub-progress" id="scrubProgress" style={{ width: `${scrubPercent}%` }} />
                  </div>

                  <span className="player-time-badge" id="playerTime">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <div className="audio-toolbar-buttons">
                    <button
                      type="button"
                      className={`speed-pill-btn ${isSlow ? "active" : ""}`}
                      id="speedToggleBtn"
                      onClick={toggleSpeed}
                      title="Toggle 0.75x speed"
                    >
                      {isSlow ? "0.75x" : "1x"}
                    </button>
                    <button
                      type="button"
                      className="speed-pill-btn"
                      id="downloadWavBtn"
                      disabled={!audioUrl}
                      onClick={handleDownload}
                      title="Download audio"
                      aria-label="Download audio"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  hidden
                />
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Creed & Border Ribbon */}
      <footer className="footer-runner">
        <div className="footer-creed">
          <span className="creed-flourish">✤</span>
          <span>BRIDGING CULTURES • EMPOWERING DIALOGUE • BANASTHALI VIDYAPITH</span>
          <span className="creed-flourish">✤</span>
        </div>
        <div className="rajasthani-border-ribbon" aria-hidden="true" />
      </footer>
    </div>
  );
}