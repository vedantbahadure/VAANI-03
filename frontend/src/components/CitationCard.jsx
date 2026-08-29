import React from "react";
import { domainMeta } from "../lib/domains";

export function CitationCard({ citation }) {
  const meta = domainMeta(citation.domain);
  const Icon = meta.icon;
  return (
    <div
      className="group rounded-2xl border border-border bg-card/60 p-3 pl-3.5 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ borderLeft: `3px solid ${meta.color}` }}
      data-testid="citation-card"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="grid place-items-center w-6 h-6 rounded-lg shrink-0" style={{ background: `${meta.color}1a`, color: meta.color }}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs font-semibold text-foreground">
          <span className="text-muted-foreground mr-1">[{citation.n}]</span>{citation.title}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-3">{citation.snippet}</p>
      {citation.source && (
        <p className="mt-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono">{citation.source}</p>
      )}
    </div>
  );
}
