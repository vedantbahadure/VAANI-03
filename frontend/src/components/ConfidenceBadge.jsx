import React from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useLang } from "../lib/contexts";
import { t } from "../lib/i18n";

// Trust state is unified: a grounded answer is NEVER shown in alarming red.
export function ConfidenceBadge({ confidence, grounded }) {
  const { lang } = useLang();
  const pct = Math.round((confidence || 0) * 100);
  let cls, Icon, label;
  if (grounded) {
    Icon = ShieldCheck;
    label = t(lang, "grounded");
    cls = "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
  } else {
    Icon = ShieldAlert;
    label = t(lang, "ungrounded");
    cls = "bg-muted text-muted-foreground border-border";
  }
  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="confidence-badge" data-grounded={grounded ? "true" : "false"}>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
        <Icon className="w-3.5 h-3.5" />
        {t(lang, "confidence")} {pct}%
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
