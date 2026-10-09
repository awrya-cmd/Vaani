/**
 * Audio Utilities for vaani Speech Translation
 * Handles time formatting, PCM WAV encoding, and audio transcoding.
 */

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob (16kHz mono recommended for ASR models)
 */
export function audioBufferToWav(buffer, optSampleRate = 16000) {
  const numChannels = 1;
  const sampleRate = optSampleRate || buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // Downmix to mono if multi-channel
  const channelCount = buffer.numberOfChannels;
  const length = buffer.length;
  const monoSamples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let c = 0; c < channelCount; c++) {
      sum += buffer.getChannelData(c)[i];
    }
    monoSamples[i] = sum / channelCount;
  }

  // Resample if necessary
  let resampledData = monoSamples;
  if (buffer.sampleRate !== sampleRate) {
    const ratio = buffer.sampleRate / sampleRate;
    const newLength = Math.round(length / ratio);
    resampledData = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIdx = Math.round(i * ratio);
      resampledData[i] = monoSamples[Math.min(srcIdx, length - 1)];
    }
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = resampledData.length * bytesPerSample;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (v, offset, str) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < resampledData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, resampledData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * Ensures an audio file or blob is sent as a valid WAV file.
 * If already a .wav file, returns as-is.
 * If mp3, m4a, webm, etc., decodes and converts to standard 16kHz WAV.
 */
export async function ensureWavBlob(fileOrBlob) {
  if (!fileOrBlob) return null;

  const isWavFile =
    fileOrBlob.name && fileOrBlob.name.toLowerCase().endsWith(".wav");

  if (isWavFile && fileOrBlob.type.includes("wav")) {
    return {
      blob: fileOrBlob,
      filename: fileOrBlob.name || "audio.wav",
    };
  }

  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtxClass();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const wavBlob = audioBufferToWav(audioBuffer, 16000);
    ctx.close();

    const baseName = fileOrBlob.name
      ? fileOrBlob.name.replace(/\.[^/.]+$/, "")
      : "audio";
    return {
      blob: wavBlob,
      filename: `${baseName}.wav`,
    };
  } catch (err) {
    console.warn("Could not transcode audio to WAV; sending raw blob:", err);
    return {
      blob: fileOrBlob,
      filename: fileOrBlob.name || "audio.wav",
    };
  }
}
