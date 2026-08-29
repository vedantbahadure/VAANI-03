import React, { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Volume2, Cpu, Sparkles, Music, Mic } from "lucide-react";
import { useLang, useMode } from "../lib/contexts";
import { t, LANGS } from "../lib/i18n";
import { Switch } from "../components/ui/switch";
import { sfx } from "../lib/sound";

export default function Settings() {
  const { lang, setLang } = useLang();
  const { mode, setMode } = useMode();
  const { theme, setTheme } = useTheme();
  const [autoVoice, setAutoVoice] = useState(localStorage.getItem("vaani-voice-reply") === "1");
  const [sfxOn, setSfxOn] = useState(sfx.isEnabled());
  const [wakeOn, setWakeOn] = useState(localStorage.getItem("vaani-wakeword") === "1");

  const toggleVoice = (v) => { setAutoVoice(v); localStorage.setItem("vaani-voice-reply", v ? "1" : "0"); };
  const toggleSfx = (v) => { setSfxOn(v); sfx.setEnabled(v); if (v) sfx.success(); };
  const toggleWake = (v) => { setWakeOn(v); localStorage.setItem("vaani-wakeword", v ? "1" : "0"); };

  return (
    <div className="px-5 md:px-10 py-8 max-w-2xl mx-auto">
      <h1 className="font-head text-3xl md:text-4xl font-light tracking-tight">{t(lang, "settings_title")}</h1>

      <div className="mt-8 space-y-6">
        <Section title={t(lang, "theme")}>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: "light", i: Sun, l: t(lang, "light") }, { v: "dark", i: Moon, l: t(lang, "dark") }, { v: "system", i: Monitor, l: t(lang, "system") }].map((o) => (
              <button key={o.v} onClick={() => setTheme(o.v)} data-testid={`theme-${o.v}`}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-colors duration-300 ${theme === o.v ? "border-primary bg-primary/8 text-foreground" : "border-border text-muted-foreground hover:bg-accent"}`}>
                <o.i className="w-5 h-5" /><span className="text-xs font-medium">{o.l}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title={t(lang, "language")}>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} data-testid={`setting-lang-${l.code}`}
                className={`py-4 rounded-2xl border transition-colors duration-300 ${lang === l.code ? "border-primary bg-primary/8" : "border-border text-muted-foreground hover:bg-accent"}`}>
                <div className="font-deva text-base">{l.native}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{l.label}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title={t(lang, "voice")}>
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/40">
              <span className="flex items-center gap-3 text-sm"><Volume2 className="w-5 h-5 text-primary" />{t(lang, "voice_reply")}</span>
              <Switch checked={autoVoice} onCheckedChange={toggleVoice} data-testid="auto-voice-switch" />
            </label>
            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/40">
              <span className="flex items-center gap-3 text-sm"><Mic className="w-5 h-5 text-primary" />{lang === "hi" ? "वेक-वर्ड ‘वाणी’" : lang === "mr" ? "वेक-वर्ड ‘वाणी’" : "Wake word “VAANI”"}</span>
              <Switch checked={wakeOn} onCheckedChange={toggleWake} data-testid="wakeword-switch" />
            </label>
            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/40">
              <span className="flex items-center gap-3 text-sm"><Music className="w-5 h-5 text-primary" />{lang === "hi" ? "ध्वनि प्रभाव" : lang === "mr" ? "ध्वनी प्रभाव" : "Sound effects"}</span>
              <Switch checked={sfxOn} onCheckedChange={toggleSfx} data-testid="sfx-switch" />
            </label>
          </div>
        </Section>

        <Section title={t(lang, "mode")}>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("showcase")} data-testid="mode-showcase"
              className={`flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-colors duration-300 ${mode === "showcase" ? "border-primary bg-primary/8" : "border-border hover:bg-accent"}`}>
              <Sparkles className="w-5 h-5 text-primary mb-1" />
              <span className="text-sm font-medium">{t(lang, "showcase")}</span>
              <span className="text-xs text-muted-foreground">Full 3D, particles, bloom, cinematic motion.</span>
            </button>
            <button onClick={() => setMode("device")} data-testid="mode-device"
              className={`flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-colors duration-300 ${mode === "device" ? "border-primary bg-primary/8" : "border-border hover:bg-accent"}`}>
              <Cpu className="w-5 h-5 text-primary mb-1" />
              <span className="text-sm font-medium">{t(lang, "device")}</span>
              <span className="text-xs text-muted-foreground">Lightweight for Raspberry Pi. Same identity, higher speed.</span>
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">{title}</div>
      {children}
    </section>
  );
}
