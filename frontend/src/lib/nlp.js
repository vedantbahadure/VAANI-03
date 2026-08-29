// NLP text normalisation so VAANI's spoken voice sounds natural.
// Strips markdown/citations, speaks numbers & currency naturally, expands
// abbreviations, spells tricky acronyms, and adds gentle pauses.

const CURRENCY_WORD = { en: "rupees", hi: "रुपये", mr: "रुपये" };

const ABBREV_EN = [
  [/\be\.g\./gi, "for example"],
  [/\bi\.e\./gi, "that is"],
  [/\betc\.?/gi, "and so on"],
  [/\bgovt\.?/gi, "government"],
  [/\bapprox\.?/gi, "approximately"],
  [/\bNo\.\s?/g, "number "],
  [/\bvs\.?/gi, "versus"],
];

// Acronyms TTS mispronounces — spell them out (spaced letters).
const SPELL = {
  PMFBY: "P M F B Y",
  PACS: "P A C S",
  KCC: "K C C",
  "PM-KMY": "P M K M Y",
  DBT: "D B T",
  "e-KYC": "e K Y C",
  "e-NAM": "e NAM",
  SHC: "S H C",
  UPI: "U P I",
  LIC: "L I C",
  APMC: "A P M C",
  "PMJDY": "P M J D Y",
};

export function speechNormalize(text = "", lang = "en") {
  let s = text;
  // strip markdown emphasis + citation markers + headings/bullets
  s = s.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
  s = s.replace(/\[\d+\]/g, "");
  s = s.replace(/^#+\s*/gm, "");
  s = s.replace(/^\s*[-•]\s+/gm, ", ");
  s = s.replace(/^\s*\d+[.)]\s+/gm, ", ");

  // currency: "Rs 6,000" / "Rs. 6000" / "₹6,000" -> "6,000 rupees"
  const cur = CURRENCY_WORD[lang] || CURRENCY_WORD.en;
  s = s.replace(/(?:Rs\.?|₹|INR)\s?([\d,]+(?:\.\d+)?)/gi, `$1 ${cur}`);

  // percentages read naturally
  s = s.replace(/(\d)\s?%/g, lang === "en" ? "$1 percent" : "$1 प्रतिशत");

  // spell out tricky acronyms (word-boundary, case-sensitive-ish)
  for (const [k, v] of Object.entries(SPELL)) {
    s = s.replace(new RegExp(`\\b${k.replace(/[-]/g, "\\-")}\\b`, "g"), v);
  }

  if (lang === "en") for (const [re, rep] of ABBREV_EN) s = s.replace(re, rep);

  // gentle pauses + tidy whitespace
  s = s.replace(/\s*—\s*/g, ", ").replace(/\s*–\s*/g, ", ");
  s = s.replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
  s = s.replace(/(,\s*){2,}/g, ", ");
  return s;
}

// Word list used for highlight sync (matches what is spoken).
export function speechWords(normalized) {
  return normalized.split(/\s+/).filter(Boolean);
}
