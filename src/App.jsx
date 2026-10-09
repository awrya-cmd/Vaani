import React, { useState, useRef, useEffect } from "react";

const LANGUAGE_OPTIONS = [
  { code: "af", name: "Afrikaans", bcp47: "af-ZA" },
  { code: "ar", name: "Arabic", bcp47: "ar-SA" },
  { code: "zh", name: "Chinese", bcp47: "zh-CN" },
  { code: "en", name: "English", bcp47: "en-US" },
  { code: "hi", name: "Hindi", bcp47: "hi-IN" },
  { code: "id", name: "Indonesian", bcp47: "id-ID" },
  { code: "kk", name: "Kazakh", bcp47: "kk-KZ" },
  { code: "ms", name: "Malay", bcp47: "ms-MY" },
  { code: "fa", name: "Persian", bcp47: "fa-IR" },
  { code: "pt", name: "Portuguese", bcp47: "pt-PT" },
  { code: "ru", name: "Russian", bcp47: "ru-RU" },
  { code: "es", name: "Spanish", bcp47: "es-ES" },
  { code: "sw", name: "Swahili", bcp47: "sw-KE" },
  { code: "th", name: "Thai", bcp47: "th-TH" },
  { code: "uz", name: "Uzbek", bcp47: "uz-UZ" },
  { code: "vi", name: "Vietnamese", bcp47: "vi-VN" },
];

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

export default function App() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [detectedLangCode, setDetectedLangCode] = useState("hi");
  const [lastRecordedBlob, setLastRecordedBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [barHeights, setBarHeights] = useState([12, 12, 12, 12]);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const audioDataRef = useRef([]);
  const speechRecognizerRef = useRef(null);

  const updateBars = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);

    const b1 = Math.max(12, (data[2] / 255) * 60);
    const b2 = Math.max(12, (data[6] / 255) * 75);
    const b3 = Math.max(12, (data[10] / 255) * 65);
    const b4 = Math.max(12, (data[15] / 255) * 50);

    setBarHeights([b1, b2, b3, b4]);
    animFrameRef.current = requestAnimationFrame(updateBars);
  };

  const startRecording = async () => {
    setStatusMessage("");
    setAudioUrl(null);
    setInputTranscript("");
    setOutputTranscript("");
    setLastRecordedBlob(null);
    audioDataRef.current = [];

    let recognitionLang = "hi-IN";
    if (sourceLang !== "auto") {
      const match = LANGUAGE_OPTIONS.find((l) => l.code === sourceLang);
      if (match) recognitionLang = match.bcp47;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.lang = recognitionLang;
      recognizer.interimResults = true;
      recognizer.continuous = true;

      recognizer.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setInputTranscript(text);

        if (sourceLang === "auto") {
          const hasDevanagari = /[\u0900-\u097F]/.test(text);
          setDetectedLangCode(hasDevanagari ? "hi" : "en");
        }
      };

      recognizer.onerror = () => { };
      recognizer.start();
      speechRecognizerRef.current = recognizer;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        audioDataRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setStatusMessage("Listening...");
      updateBars();
    } catch (err) {
      setStatusMessage("Microphone permission denied.");
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setBarHeights([12, 12, 12, 12]);

    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch { }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const sampleRate = audioContextRef.current
      ? audioContextRef.current.sampleRate
      : 16000;
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const totalLength = audioDataRef.current.reduce((acc, curr) => acc + curr.length, 0);
    const combinedSamples = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioDataRef.current) {
      combinedSamples.set(chunk, offset);
      offset += chunk.length;
    }

    const wavBlob = encodeWAV(combinedSamples, sampleRate);
    setLastRecordedBlob(wavBlob);
    sendAudioToServer(wavBlob, targetLang);
  };

  const sendAudioToServer = async (wavBlob, chosenTargetLang) => {
    setStatusMessage("Translating speech...");
    setIsLoading(true);

    const actualSource = sourceLang === "auto" ? detectedLangCode : sourceLang;
    const target = chosenTargetLang || targetLang;

    const formData = new FormData();
    formData.append("audio", wavBlob, "speechinput.wav");
    formData.append("source", actualSource);
    formData.append("target", target);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend error: ${response.status}`);
      }

      const data = await response.json();

      if (data.source_text) {
        setInputTranscript(data.source_text);
      }
      if (data.translated_text) {
        setOutputTranscript(data.translated_text);
      }

      if (data.audio_base64) {
        const byteCharacters = atob(data.audio_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: "audio/wav" });
        setAudioUrl(URL.createObjectURL(audioBlob));
      }

      setStatusMessage("Done!");
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetLanguageChange = (newTarget) => {
    setTargetLang(newTarget);
    if (lastRecordedBlob && !isRecording && !isLoading) {
      sendAudioToServer(lastRecordedBlob, newTarget);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="app-container">
      <div className="card">
        <header className="header">
          <div className="badge">Speech-to-Speech Engine</div>
          <h1>Voice Translator</h1>
        </header>

        <div className="lang-row">
          <div className="form-group">
            <label>SOURCE LANGUAGE</label>
            <select
              className="select-field"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={isRecording || isLoading}
            >
              <option value="auto">Auto Detect</option>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="arrow-icon">➔</div>

          <div className="form-group">
            <label>TARGET LANGUAGE</label>
            <select
              className="select-field"
              value={targetLang}
              onChange={(e) => handleTargetLanguageChange(e.target.value)}
              disabled={isRecording || isLoading}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isRecording && (
          <div className="google-modulator-wrapper">
            <div className="modulator-pills">
              <span className="pill" style={{ height: `${barHeights[0]}px` }}></span>
              <span className="pill" style={{ height: `${barHeights[1]}px` }}></span>
              <span className="pill" style={{ height: `${barHeights[2]}px` }}></span>
              <span className="pill" style={{ height: `${barHeights[3]}px` }}></span>
            </div>
            <p className="listening-tag">Listening to your voice...</p>
          </div>
        )}

        <div className="record-section">
          {!isRecording ? (
            <button
              className="record-btn"
              onClick={startRecording}
              disabled={isLoading}
            >
              <span className="dot"></span>
              {isLoading ? "Processing..." : "Start Speaking"}
            </button>
          ) : (
            <button className="stop-btn" onClick={stopRecording}>
              <span className="stop-square"></span>
              Stop & Translate
            </button>
          )}
        </div>

        {statusMessage && !isRecording && (
          <div className={`status ${isLoading ? "loading" : ""}`}>
            {statusMessage}
          </div>
        )}

        {(inputTranscript || audioUrl) && (
          <div className="results-container">
            {inputTranscript && (
              <div className="transcript-box">
                <span className="box-tag">INPUT SPEECH TRANSCRIPT</span>
                <p className="transcript-body">{inputTranscript}</p>
              </div>
            )}

            {audioUrl && (
              <div className="transcript-box target-box">
                <span className="box-tag">TRANSLATED OUTPUT</span>
                {outputTranscript && (
                  <p className="transcript-body" style={{ marginBottom: "12px" }}>
                    {outputTranscript}
                  </p>
                )}
                <audio controls autoPlay src={audioUrl} className="audio-player" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}