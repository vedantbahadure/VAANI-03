import React from "react";

// Minimal, safe markdown renderer for VAANI answers: bold, bullet/numbered lists,
// citation markers [1], paragraphs. No raw HTML injection.
function renderInline(text, key) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*)|(\[\d+\])/g;
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={`${key}-b${i++}`} className="font-semibold text-foreground">{m[1].slice(2, -2)}</strong>);
    else if (m[2]) parts.push(<sup key={`${key}-c${i++}`} className="text-primary font-semibold mx-0.5">{m[2]}</sup>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function RichText({ text = "", deva = false }) {
  const lines = text.split("\n");
  const blocks = [];
  let list = [];
  const flush = (k) => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${k}`} className="my-2 space-y-1.5 pl-1">
          {list.map((it, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span>{renderInline(it, `li-${k}-${idx}`)}</span>
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
    blocks.push(<p key={`p-${i}`} className="my-1.5 leading-relaxed">{renderInline(line, `p-${i}`)}</p>);
  });
  flush("end");
  return <div className={deva ? "font-deva" : ""}>{blocks}</div>;
}
