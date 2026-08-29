import { useRef, useState, useCallback } from "react";
import { transcribeAudio } from "./api";

// Records mic audio, returns transcript via Whisper backend.
export function useVoiceRecorder(language) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      setRecording(false);
      throw e;
    }
  }, []);

  const stop = useCallback(async () => {
    return new Promise((resolve) => {
      const mr = mediaRef.current;
      if (!mr) return resolve("");
      mr.onstop = async () => {
        setRecording(false);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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

  return { recording, transcribing, start, stop };
}
