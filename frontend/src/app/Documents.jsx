import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, X, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "../lib/contexts";
import { t } from "../lib/i18n";
import { listDocuments, uploadDocument, streamDocAsk, deleteDocument } from "../lib/api";
import { RichText } from "../components/RichText";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { CitationCard } from "../components/CitationCard";
import { domainMeta, DOMAIN_META } from "../lib/domains";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

export default function Documents() {
  const { lang } = useLang();
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [domain, setDomain] = useState("faq");
  const [active, setActive] = useState(null);
  const fileRef = useRef(null);
  const deva = lang !== "en";

  const refresh = () => listDocuments().then(setDocs).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(file, domain, lang);
      toast.success(`Ingested "${doc.title}" (${doc.chunk_count} chunks)`);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl mx-auto">
      <h1 className="font-head text-3xl md:text-4xl font-light tracking-tight">{t(lang, "documents_title")}</h1>
      <p className="text-muted-foreground mt-2">{t(lang, "documents_sub")}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 p-4 rounded-3xl border border-border bg-card/50">
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="w-[190px] rounded-full" data-testid="upload-domain"><SelectValue /></SelectTrigger>
          <SelectContent className="glass rounded-2xl">
            {Object.keys(DOMAIN_META).map((d) => <SelectItem key={d} value={d}>{DOMAIN_META[d].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <input ref={fileRef} type="file" accept=".pdf,.txt,.md" onChange={onFile} className="hidden" data-testid="file-input" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="upload-btn"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-medium disabled:opacity-50 transition-transform duration-300 hover:scale-[1.03]">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {t(lang, "upload")}
        </button>
        <span className="text-xs text-muted-foreground">PDF / TXT · max 25MB</span>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {docs.length === 0 ? (
          <div className="col-span-full text-center py-14 text-muted-foreground" data-testid="docs-empty">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            {t(lang, "empty_docs")}
          </div>
        ) : docs.map((d) => {
          const meta = domainMeta(d.domain); const Icon = meta.icon;
          return (
            <div key={d.id} className="p-5 rounded-3xl border border-border bg-card/50" data-testid="uploaded-doc">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: `${meta.color}1a`, color: meta.color }}><Icon className="w-4.5 h-4.5" /></span>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{meta.label}</span>
              </div>
              <div className="font-medium leading-snug">{d.title}</div>
              <div className="text-xs text-muted-foreground font-mono mt-2">{d.chunk_count} chunks</div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setActive(d)} className="flex-1 rounded-full border border-border py-2 text-sm hover:bg-accent transition-colors duration-300" data-testid="ask-doc-btn">
                  {t(lang, "ask_doc")}
                </button>
                <button onClick={async () => { await deleteDocument(d.id); toast.success("Deleted"); refresh(); }} data-testid="delete-doc-btn"
                  className="grid place-items-center w-10 rounded-full border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {active && <DocAsk doc={active} lang={lang} deva={deva} onClose={() => setActive(null)} />}
    </div>
  );
}

function DocAsk({ doc, lang, deva, onClose }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [meta, setMeta] = useState(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    if (!q.trim() || busy) return;
    setAnswer(""); setMeta(null); setBusy(true);
    await streamDocAsk(doc.id, { message: q, language: lang }, {
      onMeta: setMeta,
      onToken: (d) => setAnswer((a) => a + d),
      onDone: () => setBusy(false),
      onError: () => setBusy(false),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl glass p-6 shadow-2xl" data-testid="doc-ask-modal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-head text-lg font-medium truncate pr-4">{doc.title}</h3>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-2xl border border-border bg-card/60">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder={t(lang, "ask_doc")} data-testid="doc-ask-input"
            className={`flex-1 bg-transparent outline-none px-2 py-1.5 text-sm ${deva ? "font-deva" : ""}`} />
          <button onClick={ask} disabled={busy} className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {(answer || busy) && (
          <div className="mt-4 max-h-[45vh] overflow-y-auto">
            {meta && <div className="mb-3"><ConfidenceBadge confidence={meta.confidence} grounded={meta.grounded ?? (meta.citations?.length > 0)} /></div>}
            <div className="text-sm"><RichText text={answer || "…"} deva={deva} /></div>
            {meta?.citations?.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">{t(lang, "sources")}</div>
                <div className="space-y-2">{meta.citations.map((c) => <CitationCard key={c.n} citation={c} />)}</div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
