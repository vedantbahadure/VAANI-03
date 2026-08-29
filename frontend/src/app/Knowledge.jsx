import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, FileText, ArrowRight } from "lucide-react";
import { useLang } from "../lib/contexts";
import { t } from "../lib/i18n";
import { getKnowledge, getDomains, searchKnowledge } from "../lib/api";
import { domainMeta } from "../lib/domains";

export default function Knowledge() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const active = params.get("domain") || "";
  const [domains, setDomains] = useState({});
  const [docs, setDocs] = useState(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);

  useEffect(() => { getDomains().then(setDomains).catch(() => {}); }, []);
  useEffect(() => {
    setDocs(null);
    getKnowledge(active || undefined).then(setDocs).catch(() => setDocs([]));
  }, [active]);

  const runSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!q.trim()) { setResults(null); return; }
    const r = await searchKnowledge(q, active || undefined);
    setResults(r);
  }, [q, active]);

  const setDomain = (d) => { d ? setParams({ domain: d }) : setParams({}); setResults(null); setQ(""); };

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl mx-auto">
      <h1 className="font-head text-3xl md:text-4xl font-light tracking-tight">{t(lang, "knowledge_title")}</h1>
      <p className="text-muted-foreground mt-2">{t(lang, "knowledge_sub")}</p>

      <form onSubmit={runSearch} className="mt-6 flex items-center gap-2 p-2 rounded-full border border-border bg-card/60 max-w-xl">
        <Search className="w-4 h-4 ml-3 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="knowledge-search-input"
          placeholder={t(lang, "search")} className="flex-1 bg-transparent outline-none py-1.5 text-sm" />
        <button type="submit" data-testid="knowledge-search-btn" className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm">{t(lang, "search")}</button>
      </form>

      {/* Domain chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={!active} onClick={() => setDomain("")}>{t(lang, "all")}</Chip>
        {Object.keys(domains).map((d) => (
          <Chip key={d} active={active === d} onClick={() => setDomain(d)}>{domainMeta(d).label}</Chip>
        ))}
      </div>

      {/* Search results */}
      {results && (
        <section className="mt-8">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Semantic matches</div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border bg-card/50" style={{ borderLeft: `3px solid ${domainMeta(r.domain).color}` }} data-testid="knowledge-result">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium">{r.title}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{Math.round(r.score * 100)}%</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.text}</p>
              </div>
            ))}
            {results.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
          </div>
        </section>
      )}

      {/* Document list */}
      <section className="mt-8 grid sm:grid-cols-2 gap-3">
        {docs === null ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-3xl skeleton" />)
        ) : docs.map((d, i) => {
          const meta = domainMeta(d.domain); const Icon = meta.icon;
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-5 rounded-3xl border border-border bg-card/50 hover:-translate-y-1 transition-transform duration-300" data-testid="knowledge-doc">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: `${meta.color}1a`, color: meta.color }}><Icon className="w-4.5 h-4.5" /></span>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{meta.label}</span>
              </div>
              <div className="font-medium text-[15px] leading-snug">{d.title}</div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground font-mono">{d.source} · {d.chunk_count} chunks</span>
                <button onClick={() => { sessionStorage.setItem("vaani-pending-q", `Tell me about ${d.title}`); navigate("/app/chat"); }}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:gap-2 transition-all duration-300">Ask <ArrowRight className="w-3.5 h-3.5" /></button>
              </div>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} data-testid="domain-chip"
      className={`px-4 py-1.5 rounded-full text-sm border transition-colors duration-300 ${active ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
      {children}
    </button>
  );
}
