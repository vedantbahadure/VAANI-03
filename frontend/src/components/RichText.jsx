import React from "react";

// Minimal, safe markdown renderer for VAANI answers. Word-indexed so TTS can
// highlight the currently-spoken word (pass highlightIndex, -1 to disable).
export function RichText({ text = "", deva = false, highlightIndex = -1 }) {
  const counter = { i: -1 };
  const lines = text.split("\n");
  const blocks = [];
  let list = [];

  const renderTokens = (line, key) =>
    line.split(/(\s+)/).map((tok, k) => {
      if (tok === "" ) return null;
      if (/^\s+$/.test(tok)) return tok;
      if (/^\[\d+\]$/.test(tok)) return <sup key={`${key}-c${k}`} className="text-primary font-semibold mx-0.5">{tok}</sup>;
      counter.i += 1;
      const idx = counter.i;
      const hasBold = tok.includes("**");
      const clean = tok.replaceAll("**", "");
      const active = idx === highlightIndex;
      const inner = hasBold ? <strong className="font-semibold text-foreground">{clean}</strong> : clean;
      return (
        <span key={`${key}-w${k}`} className={active ? "rounded px-0.5 bg-primary/25 text-foreground" : ""}
          style={active ? { transition: "background-color 120ms ease" } : undefined}>
          {inner}
        </span>
      );
    });

  const flush = (k) => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${k}`} className="my-2 space-y-1.5 pl-1">
          {list.map((it, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span>{renderTokens(it, `li-${k}-${idx}`)}</span>
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) { flush(i); return; }
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)/);
    if (bullet) { list.push(bullet[1]); return; }
    flush(i);
    blocks.push(<p key={`p-${i}`} className="my-1.5 leading-relaxed">{renderTokens(line, `p-${i}`)}</p>);
  });
  flush("end");
  return <div className={deva ? "font-deva" : ""}>{blocks}</div>;
}
