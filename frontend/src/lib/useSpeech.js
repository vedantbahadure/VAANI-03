import { useCallback, useRef, useState, useEffect } from "react";
import { speak } from "./api";
import { sfx } from "./sound";
import { speechNormalize } from "./nlp";
import { toast } from "sonner";

// Centralised TTS playback (warm female voice) with progress-based word
// highlighting + barge-in. Spoken text is NLP-normalised for naturalness;
// highlight tracks audio progress so it stays in sync with the displayed text.
export function useSpeech() {
  const [playingId, setPlayingId] = useState(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const urlRef = useRef(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current = null; }
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setPlayingId(null);
    setProgress(0);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const play = useCallback(async (text, id, lang = "en", voice = "nova") => {
    if (playingId === id) { stop(); return; }
    stop();
    const spoken = speechNormalize(text, lang);
    if (!spoken) return;
    setPlayingId(id);
    setProgress(0.0001);
    try {
      const url = await speak(spoken, voice);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      const tick = () => {
        if (!audioRef.current) return;
        const d = audio.duration || 1;
        setProgress(Math.min(0.999, audio.currentTime / d));
        rafRef.current = requestAnimationFrame(tick);
      };
      audio.onplay = () => { rafRef.current = requestAnimationFrame(tick); };
      audio.onended = () => { sfx.tap(); stop(); };
      audio.onerror = () => stop();
      await audio.play();
    } catch {
      toast.error("Could not play voice");
      stop();
    }
  }, [playingId, stop]);

  return { play, stop, playingId, progress };
}
