import { useEffect, useRef, useCallback, useState } from "react";

// Browser wake-word listener ("VAANI") using Web Speech API.
// Lightweight on Raspberry Pi (offloads to the OS speech engine). Gracefully
// no-ops where SpeechRecognition is unavailable.
export function useWakeWord({ enabled, onWake, paused }) {
  const recRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    try { recRef.current && recRef.current.stop(); } catch {}
    recRef.current = null;
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !enabled || paused) { stop(); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    activeRef.current = true;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = (e.results[i][0].transcript || "").toLowerCase();
        if (txt.includes("vaani") || txt.includes("वाणी") || txt.includes("bani") || txt.includes("wani")) {
          onWake && onWake();
          break;
        }
      }
    };
    rec.onend = () => { if (activeRef.current) { try { rec.start(); } catch {} } };
    rec.onerror = () => {};
    try { rec.start(); recRef.current = rec; } catch {}
    return () => { activeRef.current = false; try { rec.stop(); } catch {} };
  }, [enabled, paused, onWake, stop]);

  return { supported };
}
