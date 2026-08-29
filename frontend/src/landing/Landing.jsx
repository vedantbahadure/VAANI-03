import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import { ArrowRight, Mic, ShieldCheck, Languages, Sparkles } from "lucide-react";
import { OrbCanvas } from "../components/OrbCanvas";
import { Orb } from "../components/Orb";
import { ParticleField } from "../components/ParticleField";
import CinematicIntro from "./CinematicIntro";
import { ThemeToggle, LanguageSwitcher } from "../components/Controls";
import { useLang, useMode } from "../lib/contexts";
import { t } from "../lib/i18n";

const CHAPTERS = [
  { n: "01", orb: "idle", title: "India Awakens", kicker: "भारत जागता है", body: "Across six hundred thousand villages, a new morning begins. Technology arrives — not to replace tradition, but to serve it.", img: "https://images.unsplash.com/photo-1694011772133-dc4b3ff3f24f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200" },
  { n: "02", orb: "warning", title: "Rural Challenges", kicker: "ग्रामीण चुनौतियाँ", body: "Schemes exist. Support exists. But forms are complex, offices are far, and information rarely reaches those who need it most." },
  { n: "03", orb: "listening", title: "Language Barriers", kicker: "भाषा की दीवारें", body: "Knowledge locked in one language is knowledge denied. VAANI listens and answers in Marathi, Hindi and English — the way you speak." },
  { n: "04", orb: "thinking", title: "Government Complexity", kicker: "जटिलता", body: "PM-KISAN, PMFBY, KCC, PACS, cooperative law. VAANI turns dense circulars into simple, trustworthy guidance." },
  { n: "05", orb: "thinking", title: "Knowledge Network", kicker: "ज्ञान का जाल", body: "Every answer is grounded in verified documents, connected as a living knowledge graph — never invented, always cited.", img: "https://images.unsplash.com/photo-1737505599162-d9932323a889?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200" },
  { n: "06", orb: "speaking", title: "Voice Technology", kicker: "आवाज़", body: "Speak naturally. VAANI transcribes with Whisper, reasons with Gemini, and replies in a warm human voice." },
  { n: "07", orb: "success", title: "VAANI Awakens", kicker: "वाणी जागती है", body: "Voice, light, knowledge and language become one Living Orb — the calm, trusted face of rural governance." },
  { n: "08", orb: "idle", title: "Empowering Citizens", kicker: "सशक्तिकरण", body: "A farmer checks an insurance claim. A cooperative member learns their rights. Confidence, restored — one conversation at a time.", img: "https://images.pexels.com/photos/32277759/pexels-photo-32277759.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { n: "09", orb: "success", title: "Digital India", kicker: "डिजिटल भारत", body: "Offline-ready. Hardware-ready. From a laptop to a Raspberry Pi kiosk in a panchayat — the same trusted VAANI." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { mode } = useMode();
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("vaani-intro-seen"));
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const orbScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.75]);
  const orbY = useTransform(scrollYProgress, [0, 0.12], [0, -40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let id;
    const raf = (time) => { lenis.raf(time); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, [showIntro]);

  const finishIntro = useCallback(() => { sessionStorage.setItem("vaani-intro-seen", "1"); setShowIntro(false); }, []);
  const enter = () => navigate("/app");
  const deva = lang !== "en";
  const showcase = mode === "showcase";

  return (
    <div className="relative bg-background text-foreground">
      <AnimatePresence>{showIntro && <CinematicIntro key="intro" onComplete={finishIntro} />}</AnimatePresence>

      {/* Fixed chrome */}
      <div className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 md:px-10 h-16">
        <div className="flex items-center gap-2.5">
          <img src="/vaani-logo.png" alt="VAANI" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <button onClick={enter} data-testid="enter-app-top"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium transition-transform duration-300 hover:scale-[1.04]">
            {t(lang, "enter")} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-60"><ParticleField intensity={showcase ? 1 : 0.5} /></div>
        <motion.div style={{ scale: orbScale, y: orbY, opacity: heroOpacity }} className="relative w-[min(72vw,440px)] h-[min(72vw,440px)]">
          {showcase ? <OrbCanvas state="idle" enableBloom /> : <div className="grid place-items-center h-full"><Orb state="idle" size={300} /></div>}
        </motion.div>
        <motion.div style={{ opacity: heroOpacity }} className="relative text-center mt-2 px-6">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground font-semibold mb-4">{t(lang, "tagline")}</div>
          <h1 className={`font-head text-5xl sm:text-6xl md:text-7xl font-extralight tracking-tighter leading-none ${deva ? "font-deva" : ""}`}>
            {t(lang, "app_name")}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mt-5 text-base">A premium AI operating system for rural governance — verified, multilingual, voice-first.</p>
          <button onClick={enter} data-testid="enter-app-hero"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 font-medium transition-transform duration-300 hover:scale-[1.04] active:scale-95">
            <Mic className="w-4.5 h-4.5" /> {t(lang, "enter")}
          </button>
        </motion.div>
        <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-8 text-xs uppercase tracking-[0.25em] text-muted-foreground animate-float-y">
          {t(lang, "scroll")}
        </motion.div>
      </section>

      {/* Trust strip */}
      <section className="relative border-y border-border py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[{ i: ShieldCheck, t: "Verified Answers", s: "Grounded in real documents, always cited" },
            { i: Languages, t: "Three Languages", s: "Marathi · Hindi · English" },
            { i: Mic, t: "Voice-First", s: "Speak and listen, naturally" }].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <f.i className="w-6 h-6 mx-auto text-primary mb-3" />
              <div className="font-medium">{f.t}</div>
              <div className="text-sm text-muted-foreground mt-1">{f.s}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Chapters */}
      {CHAPTERS.map((ch, i) => <Chapter key={ch.n} ch={ch} index={i} deva={deva} showcase={showcase} />)}

      {/* Chapter 10 — Live Dashboard / CTA */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-50"><ParticleField intensity={showcase ? 1 : 0.5} /></div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative text-center max-w-2xl">
          <div className="mx-auto w-[min(50vw,260px)] h-[min(50vw,260px)] mb-6">
            {showcase ? <OrbCanvas state="success" enableBloom /> : <div className="grid place-items-center h-full"><Orb state="success" size={200} /></div>}
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-3">Chapter 10 · Live Dashboard</div>
          <h2 className={`font-head text-4xl md:text-5xl font-light tracking-tight ${deva ? "font-deva" : ""}`}>Your assistant is ready</h2>
          <p className="text-muted-foreground mt-4">Step inside VAANI. Ask your first question by voice or text and see verified, cited answers appear.</p>
          <button onClick={enter} data-testid="enter-app-final"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-lg font-medium transition-transform duration-300 hover:scale-[1.04] active:scale-95">
            <Sparkles className="w-5 h-5" /> {t(lang, "enter")} <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        VAANI · Project Genesis · Built for a Digital, inclusive India
      </footer>
    </div>
  );
}

function Chapter({ ch, index, deva, showcase }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const imgY = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  const flip = index % 2 === 1;

  return (
    <section ref={ref} className="relative min-h-screen flex items-center px-6 md:px-16 py-20 overflow-hidden">
      <div className={`max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-10 md:gap-16 items-center ${flip ? "md:[direction:rtl]" : ""}`}>
        <motion.div style={{ y }} className="md:[direction:ltr]">
          <div className="font-mono text-sm text-primary mb-4">{ch.n}</div>
          <div className={`text-sm uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3 font-deva`}>{ch.kicker}</div>
          <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 0.6 }}
            className={`font-head text-4xl md:text-6xl font-light tracking-tighter leading-[1.05] ${deva ? "" : ""}`}>{ch.title}</motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-muted-foreground mt-6 max-w-md leading-relaxed">{ch.body}</motion.p>
        </motion.div>

        <div className="md:[direction:ltr] relative grid place-items-center">
          {ch.img ? (
            <motion.div style={{ y: imgY }} className="relative w-full aspect-[4/5] max-w-sm rounded-[2rem] overflow-hidden border border-border shadow-2xl">
              <img src={ch.img} alt={ch.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5"><Orb state={ch.orb} size={64} /></div>
            </motion.div>
          ) : (
            <motion.div style={{ y: imgY }} className="relative w-[min(60vw,320px)] h-[min(60vw,320px)]">
              {showcase ? <OrbCanvas state={ch.orb} enableBloom={false} /> : <div className="grid place-items-center h-full"><Orb state={ch.orb} size={220} /></div>}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
