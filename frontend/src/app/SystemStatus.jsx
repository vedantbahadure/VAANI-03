import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Database, Mic, Volume2, Brain, Boxes, CircleCheck, ArrowRight } from "lucide-react";
import { useLang } from "../lib/contexts";
import { t } from "../lib/i18n";
import { getSystemStatus, getHardware } from "../lib/api";
import { domainMeta } from "../lib/domains";

const PIPELINE = ["Speech", "Language", "Embedding", "Vector Search", "Documents", "Gemini", "Verified Answer", "Voice"];

export default function SystemStatus() {
  const { lang } = useLang();
  const [status, setStatus] = useState(null);
  const [hw, setHw] = useState(null);

  useEffect(() => {
    getSystemStatus().then(setStatus).catch(() => {});
    getHardware().then(setHw).catch(() => {});
  }, []);

  const sub = status?.subsystems || {};
  const cards = [
    { k: "llm", icon: Brain, label: "Language Model", detail: sub.llm?.model },
    { k: "stt", icon: Mic, label: "Speech-to-Text", detail: sub.stt?.model },
    { k: "tts", icon: Volume2, label: "Text-to-Speech", detail: sub.tts?.model },
    { k: "vector_store", icon: Boxes, label: "Vector Store", detail: `${sub.vector_store?.vectors ?? 0} vectors` },
    { k: "database", icon: Database, label: "Database", detail: sub.database?.engine },
  ];

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-head text-3xl md:text-4xl font-light tracking-tight">{t(lang, "status_title")}</h1>
        {status && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-breathe" /> All systems {t(lang, "online")}
          </span>
        )}
      </div>

      {/* Subsystem cards */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <motion.div key={c.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-5 rounded-3xl border border-border bg-card/50" data-testid={`status-${c.k}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="grid place-items-center w-10 h-10 rounded-2xl bg-primary/10 text-primary"><c.icon className="w-5 h-5" /></span>
              <CircleCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-sm font-medium">{c.label}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1 truncate">{c.detail || "—"}</div>
          </motion.div>
        ))}
      </div>

      {/* RAG pipeline */}
      <section className="mt-10">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Retrieval-Augmented Pipeline</div>
        <div className="flex flex-wrap items-center gap-2">
          {PIPELINE.map((p, i) => (
            <React.Fragment key={p}>
              <span className="px-3 py-1.5 rounded-full border border-border bg-card/60 text-xs font-medium">{p}</span>
              {i < PIPELINE.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Answers are generated strictly from retrieved documents when verified evidence exists (threshold {status?.knowledge?.rag_threshold ?? "—"}), always with citations and confidence.</p>
      </section>

      {/* Knowledge breakdown */}
      <section className="mt-10">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Knowledge Base · {status?.knowledge?.documents ?? 0} documents</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(status?.knowledge?.domains || {}).map(([d, n]) => {
            const meta = domainMeta(d); const Icon = meta.icon;
            return (
              <div key={d} className="p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3" data-testid={`kb-domain-${d}`}>
                <span className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: `${meta.color}1a`, color: meta.color }}><Icon className="w-4 h-4" /></span>
                <div><div className="text-sm font-medium leading-none">{n}</div><div className="text-[11px] text-muted-foreground mt-1">{meta.label}</div></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hardware */}
      {hw && (
        <section className="mt-10">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Hardware Abstraction · {hw.adapter}</div>
          <div className="p-5 rounded-3xl border border-border bg-card/50">
            <div className="flex items-center gap-3 mb-4"><Cpu className="w-5 h-5 text-primary" /><span className="text-sm text-muted-foreground">{hw.description}</span></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(hw.capabilities || {}).map(([k, v]) => (
                <div key={k} className={`p-3 rounded-2xl border text-center ${v.available ? "border-emerald-500/25 bg-emerald-500/5" : "border-border opacity-60"}`}>
                  <div className="text-xs font-medium capitalize">{k}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">{v.driver || "n/a"}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
