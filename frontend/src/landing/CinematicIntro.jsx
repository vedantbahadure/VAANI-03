import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrbCanvas } from "../components/OrbCanvas";
import { ParticleField } from "../components/ParticleField";
import { useLang, useMode } from "../lib/contexts";
import { t } from "../lib/i18n";

// Cinematic 15-18s opening. Staged scenes over a particle awakening -> Living Orb.
const SCENES = [
  { at: 0,    kind: "spark" },
  { at: 2200, kind: "awaken" },
  { at: 4600, kind: "network", caption: { en: "Thousands of voices awaken", hi: "हज़ारों आवाज़ें जागती हैं", mr: "हजारो आवाज जागतात" } },
  { at: 7200, kind: "scripts", caption: { en: "भाषा · Language · भाषा", hi: "भाषा · Language · भाषा", mr: "भाषा · Language · भाषा" } },
  { at: 9600, kind: "knowledge", caption: { en: "Knowledge becomes light", hi: "ज्ञान प्रकाश बनता है", mr: "ज्ञान प्रकाश बनते" } },
  { at: 12000, kind: "orb", caption: { en: "Hello. I'm VAANI.", hi: "नमस्ते। मैं वाणी हूँ।", mr: "नमस्कार. मी वाणी आहे." } },
];

export default function CinematicIntro({ onComplete }) {
  const { lang } = useLang();
  const { mode } = useMode();
  const [scene, setScene] = useState(0);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduce) { onComplete(); return; }
    const timers = SCENES.map((s, i) => setTimeout(() => setScene(i), s.at));
    const end = setTimeout(onComplete, 16000);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
  }, [onComplete, reduce]);

  const cur = SCENES[scene];
  const showOrb = cur.kind === "orb";
  const showNetwork = ["network", "scripts", "knowledge"].includes(cur.kind);

  return (
    <motion.div className="fixed inset-0 z-[100] bg-[#07090b] overflow-hidden" data-testid="cinematic-intro"
      exit={{ opacity: 0 }} transition={{ duration: 1 }}>
      {/* particle layer */}
      <motion.div className="absolute inset-0" animate={{ opacity: showNetwork ? 0.9 : cur.kind === "awaken" ? 0.5 : 0.15 }} transition={{ duration: 1.5 }}>
        <ParticleField intensity={showNetwork ? 1.3 : 0.6} interactive={false} colorLight="214,229,219" colorDark="214,229,219" />
      </motion.div>

      {/* single spark */}
      <AnimatePresence>
        {(cur.kind === "spark" || cur.kind === "awaken") && (
          <motion.div key="spark" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            initial={{ width: 4, height: 4, opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1], boxShadow: ["0 0 10px 2px rgba(255,255,255,0.6)", "0 0 40px 12px rgba(150,220,190,0.7)"] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} exit={{ opacity: 0, scale: 2 }} />
        )}
      </AnimatePresence>

      {/* Orb reveal */}
      <AnimatePresence>
        {showOrb && (
          <motion.div key="orb" className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2, ease: "easeOut" }}>
            <div className="w-[min(60vw,420px)] h-[min(60vw,420px)]">
              <OrbCanvas state="speaking" enableBloom={mode === "showcase"} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captions */}
      <div className="absolute inset-x-0 bottom-[16%] flex justify-center px-6">
        <AnimatePresence mode="wait">
          {cur.caption && (
            <motion.h2 key={scene} initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              transition={{ duration: 1 }}
              className={`font-head text-3xl md:text-5xl font-light tracking-tight text-white/90 text-center ${lang !== "en" ? "font-deva" : ""}`}>
              {cur.caption[lang] || cur.caption.en}
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* Skip */}
      <button onClick={onComplete} data-testid="skip-intro"
        className="absolute top-6 right-6 text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white/90 transition-colors duration-300 border border-white/15 rounded-full px-4 py-2">
        {t(lang, "skip")}
      </button>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
    </motion.div>
  );
}
