import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// ---------------- Language ----------------
const LanguageCtx = createContext(null);
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("vaani-lang") || "en");
  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem("vaani-lang", l);
  }, []);
  return <LanguageCtx.Provider value={{ lang, setLang }}>{children}</LanguageCtx.Provider>;
}
export const useLang = () => useContext(LanguageCtx);

// ---------------- Mode (showcase / device) ----------------
const ModeCtx = createContext(null);
export function ModeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem("vaani-mode") || "showcase");
  const setMode = useCallback((m) => {
    setModeState(m);
    localStorage.setItem("vaani-mode", m);
  }, []);
  return <ModeCtx.Provider value={{ mode, setMode }}>{children}</ModeCtx.Provider>;
}
export const useMode = () => useContext(ModeCtx);

// ---------------- Orb state ----------------
// idle | listening | thinking | speaking | success | warning | offline
const OrbCtx = createContext(null);
export function OrbProvider({ children }) {
  const [orbState, setOrbState] = useState("idle");
  return <OrbCtx.Provider value={{ orbState, setOrbState }}>{children}</OrbCtx.Provider>;
}
export const useOrb = () => useContext(OrbCtx);

// ---------------- Online status ----------------
export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

// ---------------- Orb visual palette ----------------
export const ORB_COLORS = {
  idle:      { a: "#e7efe9", b: "#c8dccf", glow: "rgba(200,220,207,0.5)" },
  listening: { a: "#7cc4ff", b: "#67e8f9", glow: "rgba(103,232,249,0.6)" },
  thinking:  { a: "#8b7cff", b: "#c084fc", glow: "rgba(168,120,255,0.6)" },
  speaking:  { a: "#ffb454", b: "#fdba74", glow: "rgba(253,186,116,0.6)" },
  success:   { a: "#4ade80", b: "#86efac", glow: "rgba(74,222,128,0.55)" },
  warning:   { a: "#fb7185", b: "#f43f5e", glow: "rgba(244,63,94,0.55)" },
  offline:   { a: "#9ca3af", b: "#78716c", glow: "rgba(120,113,108,0.4)" },
};
