import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Orb } from "../components/Orb";
import { useLang } from "../lib/contexts";
import { t, SUGGESTIONS } from "../lib/i18n";
import { getDomains, listConversations } from "../lib/api";
import { domainMeta } from "../lib/domains";

export default function Home() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [domains, setDomains] = useState({});
  const [recent, setRecent] = useState([]);
  const deva = lang !== "en";

  useEffect(() => {
    getDomains().then(setDomains).catch(() => {});
    listConversations().then((c) => setRecent(c.slice(0, 5))).catch(() => {});
  }, []);

  const ask = (q) => { sessionStorage.setItem("vaani-pending-q", q); navigate("/app/chat"); };

  return (
    <div className="px-5 md:px-10 py-8 md:py-12 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        <Orb state="idle" size={132} className="animate-float-y" />
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-3">{t(lang, "tagline")}</div>
          <h1 className={`font-head text-4xl md:text-5xl font-light tracking-tight leading-tight ${deva ? "font-deva" : ""}`}>{t(lang, "home_greeting")}</h1>
          <p className={`text-muted-foreground mt-4 max-w-xl ${deva ? "font-deva" : ""}`}>{t(lang, "home_sub")}</p>
          <button onClick={() => navigate("/app/chat")} data-testid="start-chat-cta"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium transition-transform duration-300 hover:scale-[1.03] active:scale-95">
            <MessageCircle className="w-4.5 h-4.5" /> {t(lang, "ask_anything")} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Suggestions */}
      <section className="mt-14">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">{t(lang, "quick_actions")}</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {(SUGGESTIONS[lang] || SUGGESTIONS.en).map((s, i) => (
            <motion.button key={i} onClick={() => ask(s)} data-testid={`home-suggestion-${i}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
              className={`group text-left p-5 rounded-3xl border border-border bg-card/50 hover:bg-accent hover:-translate-y-1 transition-transform duration-300 flex items-center justify-between gap-3 ${deva ? "font-deva" : ""}`}>
              <span className="text-sm">{s}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform duration-300 shrink-0" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* Domains */}
      <section className="mt-12">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">{t(lang, "domains")}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(domains).map((d) => {
            const meta = domainMeta(d); const Icon = meta.icon;
            return (
              <button key={d} onClick={() => navigate(`/app/knowledge?domain=${d}`)} data-testid={`home-domain-${d}`}
                className="p-4 rounded-2xl border border-border bg-card/50 hover:-translate-y-1 transition-transform duration-300 text-left">
                <span className="grid place-items-center w-9 h-9 rounded-xl mb-3" style={{ background: `${meta.color}1a`, color: meta.color }}><Icon className="w-4.5 h-4.5" /></span>
                <div className="text-sm font-medium">{meta.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{domains[d]} {domains[d] === 1 ? "source" : "sources"}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent */}
      <section className="mt-12">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">{t(lang, "recent")}</div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(lang, "no_recent")}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((c) => (
              <button key={c.id} onClick={() => navigate(`/app/chat/${c.id}`)} data-testid={`recent-${c.id}`}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card/40 hover:bg-accent transition-colors duration-300 text-left">
                <span className="text-sm truncate">{c.title}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
