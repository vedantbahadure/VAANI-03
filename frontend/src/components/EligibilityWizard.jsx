import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../lib/contexts";

// "Am I Eligible?" guided assistant. Collects structured facts, then hands a
// natural-language question to the RAG chat (grounded, cited answer).
const SCHEMES = [
  { id: "PM-KISAN", label: { en: "PM-KISAN (income support)", hi: "पीएम-किसान (आय सहायता)", mr: "पीएम-किसान (उत्पन्न मदत)" } },
  { id: "PMFBY crop insurance", label: { en: "PMFBY (crop insurance)", hi: "पीएमएफबीवाई (पीक विमा)", mr: "पीएमएफबीवाय (पीक विमा)" } },
  { id: "Kisan Credit Card", label: { en: "Kisan Credit Card", hi: "किसान क्रेडिट कार्ड", mr: "किसान क्रेडिट कार्ड" } },
  { id: "PM Kisan Maandhan pension", label: { en: "Kisan Maandhan (pension)", hi: "किसान मानधन (पेंशन)", mr: "किसान मानधन (पेन्शन)" } },
];

const T = {
  en: { title: "Am I Eligible?", sub: "Answer a few quick questions.", scheme: "Which scheme?", land: "Land you own (hectares)", cat: "Category", taxpayer: "Are you an income-tax payer?", govt: "Government employee?", yes: "Yes", no: "No", check: "Check eligibility", next: "Next", back: "Back" },
  hi: { title: "क्या मैं पात्र हूँ?", sub: "कुछ छोटे प्रश्नों के उत्तर दें।", scheme: "कौन सी योजना?", land: "आपकी ज़मीन (हेक्टेयर)", cat: "श्रेणी", taxpayer: "क्या आप आयकर दाता हैं?", govt: "सरकारी कर्मचारी?", yes: "हाँ", no: "नहीं", check: "पात्रता जाँचें", next: "आगे", back: "पीछे" },
  mr: { title: "मी पात्र आहे का?", sub: "काही छोटे प्रश्न सोडवा.", scheme: "कोणती योजना?", land: "तुमची जमीन (हेक्टर)", cat: "श्रेणी", taxpayer: "तुम्ही आयकर भरता का?", govt: "सरकारी कर्मचारी?", yes: "होय", no: "नाही", check: "पात्रता तपासा", next: "पुढे", back: "मागे" },
};

export function EligibilityWizard({ onClose }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  const tr = T[lang] || T.en;
  const [step, setStep] = useState(0);
  const [scheme, setScheme] = useState(SCHEMES[0].id);
  const [land, setLand] = useState("1");
  const [cat, setCat] = useState("General");
  const [taxpayer, setTaxpayer] = useState(false);
  const [govt, setGovt] = useState(false);
  const deva = lang !== "en";

  const submit = () => {
    const q = lang === "en"
      ? `Am I eligible for ${scheme}? I own ${land} hectares of land, my category is ${cat}, I am ${taxpayer ? "" : "not "}an income-tax payer, and I am ${govt ? "" : "not "}a government employee. List the eligibility criteria and tell me if I qualify.`
      : lang === "hi"
      ? `क्या मैं ${scheme} के लिए पात्र हूँ? मेरे पास ${land} हेक्टेयर ज़मीन है, श्रेणी ${cat} है, मैं ${taxpayer ? "" : "नहीं "}आयकर दाता हूँ, और ${govt ? "" : "नहीं "}सरकारी कर्मचारी हूँ। पात्रता शर्तें बताएं और बताएं कि क्या मैं योग्य हूँ।`
      : `मी ${scheme} साठी पात्र आहे का? माझ्याकडे ${land} हेक्टर जमीन आहे, श्रेणी ${cat} आहे, मी ${taxpayer ? "" : "नाही "}आयकर भरतो, आणि ${govt ? "" : "नाही "}सरकारी कर्मचारी आहे. पात्रता निकष सांगा आणि मी पात्र आहे का ते सांगा.`;
    sessionStorage.setItem("vaani-pending-q", q);
    onClose();
    navigate("/app/chat");
  };

  const Opt = ({ active, onClick, children, tid }) => (
    <button onClick={onClick} data-testid={tid}
      className={`px-4 py-2.5 rounded-2xl border text-sm transition-colors duration-300 ${active ? "border-primary bg-primary/8 text-foreground" : "border-border text-muted-foreground hover:bg-accent"} ${deva ? "font-deva" : ""}`}>
      {children}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl glass p-6 shadow-2xl" data-testid="eligibility-wizard">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-head text-xl font-medium inline-flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" />{tr.title}</h3>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <p className={`text-sm text-muted-foreground mb-5 ${deva ? "font-deva" : ""}`}>{tr.sub}</p>

        {step === 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">{tr.scheme}</div>
            {SCHEMES.map((s) => <div key={s.id}><Opt active={scheme === s.id} onClick={() => setScheme(s.id)} tid={`elig-scheme-${s.id}`}>{s.label[lang] || s.label.en}</Opt></div>)}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">{tr.land}</div>
              <input type="number" min="0" step="0.5" value={land} onChange={(e) => setLand(e.target.value)} data-testid="elig-land"
                className="w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 outline-none" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">{tr.cat}</div>
              <div className="flex flex-wrap gap-2">
                {["General", "OBC", "SC", "ST"].map((c) => <Opt key={c} active={cat === c} onClick={() => setCat(c)} tid={`elig-cat-${c}`}>{c}</Opt>)}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">{tr.taxpayer}</div>
              <div className="flex gap-2"><Opt active={taxpayer} onClick={() => setTaxpayer(true)} tid="elig-tax-yes">{tr.yes}</Opt><Opt active={!taxpayer} onClick={() => setTaxpayer(false)} tid="elig-tax-no">{tr.no}</Opt></div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">{tr.govt}</div>
              <div className="flex gap-2"><Opt active={govt} onClick={() => setGovt(true)} tid="elig-govt-yes">{tr.yes}</Opt><Opt active={!govt} onClick={() => setGovt(false)} tid="elig-govt-no">{tr.no}</Opt></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-7">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} data-testid="elig-back"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors duration-300"><ArrowLeft className="w-4 h-4" /> {tr.back}</button>
          {step < 2 ? (
            <button onClick={() => setStep((s) => s + 1)} data-testid="elig-next"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-transform duration-300 hover:scale-[1.03]">{tr.next} <ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={submit} data-testid="elig-submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-transform duration-300 hover:scale-[1.03]">{tr.check} <ArrowRight className="w-4 h-4" /></button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
