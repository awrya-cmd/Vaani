import React, { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import VoiceCard from "./components/VoiceCard";
import ConversationCard from "./components/ConversationCard";
import Footer from "./components/Footer";
import BanasthaliFactOverlay from "./components/BanasthaliFactOverlay";
import { CONFIG } from "./config";
import { ALL_LANGUAGES, RTL_LANG_CODES, getLangObj } from "./constants/languages";
import { formatTime, ensureWavBlob } from "./utils/audio";

export default function App() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [detectedLangCode, setDetectedLangCode] = useState("hi");

  // Status: 'ready' | 'recording' | 'recorded' | 'translating' | 'translated' | 'error'
  const [status, setStatus] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");

  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [translationStage, setTranslationStage] = useState("Understanding");
  const [audioUrl, setAudioUrl] = useState(null);
  const [ttsEngine, setTtsEngine] = useState("");

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSlow, setIsSlow] = useState(false);
  const [isSwapRotated, setIsSwapRotated] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const fileInputRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasWaveRef = useRef(null);
  const audioElementRef = useRef(null);

  // Real-Time Live Waveform Visualizer using Web Audio API frequency/amplitude data
  const drawWaveform = useCallback(() => {
    const canvas = canvasWaveRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const values = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(values);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const bars = 28;
    const barW = 4;
    const gap = (w - bars * barW) / (bars - 1);
    const mid = h / 2;

    for (let i = 0; i < bars; i++) {
      // Symmetrical amplitude radiating from the center outwards
      const distFromCenter = Math.abs(i - (bars - 1) / 2);
      const freqIdx = Math.min(
        bufferLength - 1,
        Math.floor((1 - distFromCenter / (bars / 2)) * (bufferLength * 0.72))
      );
      const rawAmp = (values[freqIdx] || 0) / 255.0;
      const barH = Math.max(3.5, rawAmp * (h * 0.88));
      const x = i * (barW + gap);

      // Dynamic palette: dusty rose transitioning into vibrant marigold at higher amplitudes
      ctx.fillStyle = rawAmp > 0.40 ? "#D99A3D" : "#C75D72";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, mid - barH / 2, barW, barH, 2);
      else ctx.rect(x, mid - barH / 2, barW, barH);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const canvas = canvasWaveRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
  }, []);

  // Resize live waveform canvas according to device pixel ratio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasWaveRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  // Recording Controls
  const startRecording = async () => {
    try {
      setErrorMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      audioBlobRef.current = null;
      setSelectedFileName("");

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (t) => MediaRecorder.isTypeSupported(t)
      );
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const recordedBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        stopWaveform();

        // Convert recorded audio to standard 16kHz mono WAV for backend compatibility
        const wavData = await ensureWavBlob(recordedBlob);
        audioBlobRef.current = wavData.blob;
        setSelectedFileName("voice_recording.wav");
        setStatus("recorded");

        // Immediately begin translation request upon recording stop
        executeTranslation(sourceLang, targetLang, wavData.blob, "voice_recording.wav");
      };

      recorder.start(200);
      setStatus("recording");
      setTimerSeconds(0);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      setTimeout(() => {
        resizeCanvas();
        drawWaveform();
      }, 50);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const startMs = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - startMs) / 1000));
      }, 250);
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Microphone permission was denied. Please allow microphone access in your browser."
          : "Could not initialize microphone hardware.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // Upload Audio Handler: Transcodes to standard WAV immediately to prevent backend hangs
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");
    if (status === "recording") stopRecording();
    stopWaveform();

    try {
      setSelectedFileName(file.name);
      // Ensure file is prepared as a valid WAV
      const wavResult = await ensureWavBlob(file);
      audioBlobRef.current = wavResult.blob;
      setSelectedFileName(wavResult.filename);
      setStatus("recorded");
    } catch (err) {
      console.error("Audio file preparation error:", err);
      audioBlobRef.current = file;
      setSelectedFileName(file.name);
      setStatus("recorded");
    }
  };

  const handleSwap = () => {
    setIsSwapRotated((prev) => !prev);
    const newTarget = sourceLang === "auto" ? (detectedLangCode || "hi") : sourceLang;
    const newSource = targetLang;
    setSourceLang(newSource);
    setTargetLang(newTarget);
    if (audioBlobRef.current && status !== "recording") {
      executeTranslation(newSource, newTarget);
    }
  };

  // Translation API Call with timeout and fallback
  const executeTranslation = async (
    sLang = sourceLang,
    tLang = targetLang,
    customBlob = null,
    customFileName = null
  ) => {
    const rawAudio = customBlob || audioBlobRef.current;
    if (!rawAudio) return;

    setErrorMessage("");
    setStatus("translating");
    setTranslationStage("Understanding");

    // Progressive backend stage progression as permitted by server roundtrip
    const stageTimer1 = setTimeout(() => {
      setTranslationStage("Translating");
    }, 1100);

    const stageTimer2 = setTimeout(() => {
      setTranslationStage("Preparing your audio");
    }, 2500);

    try {
      // Ensure we have a valid WAV blob before dispatching
      const wavPack =
        customBlob && customBlob.type === "audio/wav"
          ? { blob: customBlob, filename: customFileName || "voice_recording.wav" }
          : await ensureWavBlob(rawAudio);
      const audioWavBlob = wavPack.blob;
      const audioFileName = wavPack.filename || "audio.wav";

      const form = new FormData();
      form.append("audio", audioWavBlob, audioFileName);

      // Resolve "auto" to concrete language code for FastAPI backend
      let actualSource =
        sLang === "auto" || !sLang
          ? detectedLangCode && detectedLangCode !== "auto"
            ? detectedLangCode
            : tLang === "hi"
            ? "en"
            : "hi"
          : sLang;

      if (sLang === "auto" && actualSource === tLang) {
        actualSource = tLang === "hi" ? "en" : "hi";
      }

      form.append("source", actualSource);
      form.append("target", tLang);

      const headers = {};
      if (CONFIG?.API_KEY) {
        headers["X-API-Key"] = CONFIG.API_KEY;
      }

      // Try primary server URL first, fallback to proxy if network fails
      const endpointsToTry = [
        `${(CONFIG.SERVER_URL || "http://172.16.41.109:8000").replace(/\/$/, "")}/translate`,
        "/api/translate",
      ];

      let lastError = null;
      let data = null;

      for (const endpoint of endpointsToTry) {
        const controller = new AbortController();
        const timeoutMs = CONFIG?.TIMEOUT_MS || 180000; // 180s timeout (3 mins) for heavy neural models
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const resp = await fetch(endpoint, {
            method: "POST",
            headers,
            body: form,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!resp.ok) {
            let detail = "The translation server returned an error.";
            try {
              const errData = await resp.json();
              detail = errData.detail || errData.message || detail;
            } catch {}
            throw new Error(`${detail} (HTTP ${resp.status})`);
          }

          data = await resp.json();
          break; // Succeeded!
        } catch (err) {
          clearTimeout(timeoutId);
          lastError = err;
          // If aborted due to timeout, break immediately with informative message
          if (err.name === "AbortError") {
            throw new Error("Translation is taking longer than expected. Please wait, the server may still be processing neural speech models.");
          }
          // If 400 Bad Request, do not retry other endpoint
          if (err.message && err.message.includes("HTTP 400")) {
            throw err;
          }
        }
      }

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (!data) {
        throw lastError || new Error("Failed to reach translation server.");
      }

      setInputTranscript(data.source_text || "");
      setOutputTranscript(data.translated_text || "");
      setTtsEngine(data.tts_engine || "");

      if (data.source_language && data.source_language !== "auto") {
        setDetectedLangCode(data.source_language);
      } else if (data.detected_language && data.detected_language !== "auto") {
        setDetectedLangCode(data.detected_language);
      }


      if (data.audio_base64) {
        const binary = atob(data.audio_base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const url = URL.createObjectURL(
          new Blob([bytes], { type: "audio/wav" })
        );
        setAudioUrl(url);

        if (audioElementRef.current) {
          audioElementRef.current.src = url;
          audioElementRef.current.playbackRate = isSlow ? 0.75 : 1.0;
          audioElementRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }

      setStatus("translated");
    } catch (err) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      const serverDisplay =
        CONFIG?.DIRECT_SERVER_URL ||
        CONFIG?.SERVER_URL ||
        "http://172.16.41.109:8000";
      setErrorMessage(
        `Translation failed. ${err.message}. Verify that the server is active at ${serverDisplay}.`
      );
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
    if (!audioElementRef.current) return;
    setCurrentTime(audioElementRef.current.currentTime || 0);
    setDuration(audioElementRef.current.duration || 0);
  };

  const handleScrub = (e) => {
    if (!audioElementRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioElementRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  const toggleSpeed = () => {
    const nextSlow = !isSlow;
    setIsSlow(nextSlow);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = nextSlow ? 0.75 : 1.0;
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `vaani_${sourceLang}_to_${targetLang}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopySource = () => {
    if (!inputTranscript) return;
    navigator.clipboard.writeText(inputTranscript);
    setCopiedSource(true);
    setTimeout(() => setCopiedSource(false), 1300);
  };

  const handleCopyTarget = () => {
    if (!outputTranscript) return;
    navigator.clipboard.writeText(outputTranscript);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 1300);
  };

  // Keyboard shortcut: Spacebar to toggle recording
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        const tag = document.activeElement
          ? document.activeElement.tagName.toLowerCase()
          : "";
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          tag === "button"
        )
          return;
        e.preventDefault();
        if (status === "recording") stopRecording();
        else startRecording();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

  // Auto-scroll on phone to transcript & audio player once translation completes
  useEffect(() => {
    if (status === "translated") {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const scrollTimer = setTimeout(() => {
          const conversationSection =
            document.getElementById("cardConversation") ||
            document.querySelector(".conversation-card");
          if (conversationSection) {
            conversationSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 180);
        return () => clearTimeout(scrollTimer);
      }
    }
  }, [status]);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const sourceLangObj =
    sourceLang === "auto"
      ? status === "translated" && detectedLangCode
        ? { ...getLangObj(detectedLangCode), name: `${getLangObj(detectedLangCode).name} (Auto)` }
        : { code: "auto", name: "Auto Detect" }
      : getLangObj(sourceLang);
  const targetLangObj = getLangObj(targetLang);

  const isSourceRTL = RTL_LANG_CODES.includes(
    sourceLang === "auto" ? detectedLangCode : sourceLang
  );
  const isTargetRTL = RTL_LANG_CODES.includes(targetLang);

  const scrubPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="scenic-wrapper">
      {/* Subtle, non-blocking Banasthali Fun Facts floating heritage overlay */}
      <BanasthaliFactOverlay isTranslating={status === "translating"} />

      <div className="content-container">
        {/* Navbar Header */}
        <Navbar />

        {/* Centered Hero Heading */}
        <Hero />

        {/* Balanced 2-Card Translation Workspace */}
        <main className="workspace-grid">
          {/* LEFT CARD: YOUR VOICE */}
          <VoiceCard
            sourceLang={sourceLang}
            setSourceLang={setSourceLang}
            targetLang={targetLang}
            setTargetLang={setTargetLang}
            status={status}
            errorMessage={errorMessage}
            selectedFileName={selectedFileName}
            timerSeconds={timerSeconds}
            formatTime={formatTime}
            canvasWaveRef={canvasWaveRef}
            fileInputRef={fileInputRef}
            isSwapRotated={isSwapRotated}
            onSwap={handleSwap}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onFileUpload={handleFileUpload}
            onTranslate={() => executeTranslation()}
            hasAudio={Boolean(audioBlobRef.current)}
            translationStage={translationStage}
          />

          {/* Center Connector Arrow */}
          <div className="cards-connector-arrow" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          {/* RIGHT CARD: YOUR CONVERSATION */}
          <ConversationCard
            sourceLangObj={sourceLangObj}
            targetLangObj={targetLangObj}
            sourceLang={sourceLang}
            isSourceRTL={isSourceRTL}
            isTargetRTL={isTargetRTL}
            inputTranscript={inputTranscript}
            outputTranscript={outputTranscript}
            copiedSource={copiedSource}
            copiedTarget={copiedTarget}
            onCopySource={handleCopySource}
            onCopyTarget={handleCopyTarget}
            audioUrl={audioUrl}
            ttsEngine={ttsEngine}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            currentTime={currentTime}
            duration={duration}
            scrubPercent={scrubPercent}
            onScrub={handleScrub}
            isSlow={isSlow}
            onToggleSpeed={toggleSpeed}
            onDownload={handleDownload}
            audioElementRef={audioElementRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            status={status}
            translationStage={translationStage}
          />
        </main>
      </div>

      {/* Bottom Creed & Border Ribbon */}
      <Footer />
    </div>
  );
}