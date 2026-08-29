import { Landmark, ShieldCheck, Building2, Scale, Wallet, Sprout, FileText, HelpCircle } from "lucide-react";

export const DOMAIN_META = {
  schemes:     { label: "Government Schemes", icon: Landmark,   color: "#2f7d54" },
  insurance:   { label: "Crop Insurance",     icon: ShieldCheck, color: "#2a7db5" },
  pacs:        { label: "PACS",               icon: Building2,   color: "#8a6d2f" },
  cooperative: { label: "Cooperative Law",    icon: Scale,       color: "#7b5fd0" },
  finance:     { label: "Financial Literacy", icon: Wallet,      color: "#b5762a" },
  agriculture: { label: "Agriculture",        icon: Sprout,      color: "#4a8f36" },
  circular:    { label: "Circulars",          icon: FileText,    color: "#5b6470" },
  faq:         { label: "FAQs",               icon: HelpCircle,  color: "#c0663f" },
};

export const domainMeta = (d) => DOMAIN_META[d] || { label: d, icon: FileText, color: "#5b6470" };
