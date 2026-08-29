import { useCallback, useRef, useState, useEffect } from "react";
import { speak } from "./api";
import { sfx } from "./sound";
import { toast } from "sonner";

// Centralised TTS playback with word-by-word highlighting + barge-in (stop).
export function useSpeech() {
  const [playingId, setPlayingId] = useState(null);
  const [activeWord, setActiveWord] = useState(-1);
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
    setActiveWord(-1);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const play = useCallback(async (text, id, voice = "alloy") => {
    if (playingId === id) { stop(); return; }
    stop();
    const clean = text.replace(/\*\*/g, "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
    const words = clean.split(" ").filter(Boolean);
    if (!words.length) return;
    setPlayingId(id);
    setActiveWord(0);
    try {
      const url = await speak(clean, voice);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      const tick = () => {
        if (!audioRef.current) return;
        const d = audio.duration || 1;
        const idx = Math.min(words.length - 1, Math.floor((audio.currentTime / d) * words.length));
        setActiveWord(idx);
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

  return { play, stop, playingId, activeWord };
}
