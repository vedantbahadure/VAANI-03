import { useRef, useState, useCallback } from "react";
import { transcribeAudio } from "./api";

// Records mic audio, returns transcript via Whisper backend.
// Also exposes a live AnalyserNode (getAnalyser) for waveform visualisation.
export function useVoiceRecorder(language) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  const teardownAudio = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    analyserRef.current = null;
  };

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch {}
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      setRecording(false);
      teardownAudio();
      throw e;
    }
  }, []);

  const stop = useCallback(async () => {
    return new Promise((resolve) => {
      const mr = mediaRef.current;
      if (!mr) return resolve("");
      mr.onstop = async () => {
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        teardownAudio();
        if (blob.size < 800) return resolve("");
        setTranscribing(true);
        try {
          const res = await transcribeAudio(blob, language);
          resolve(res.text || "");
        } catch {
          resolve("");
        } finally {
          setTranscribing(false);
        }
      };
      mr.stop();
    });
  }, [language]);

  return { recording, transcribing, start, stop, getAnalyser };
}
