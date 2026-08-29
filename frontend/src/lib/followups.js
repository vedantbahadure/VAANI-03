// Context-aware follow-up suggestions derived from the answer's top citation domain.
const MAP = {
  schemes: {
    en: ["Am I eligible for this scheme?", "What documents do I need?", "How do I apply?"],
    hi: ["क्या मैं इस योजना के लिए पात्र हूँ?", "मुझे कौन से दस्तावेज़ चाहिए?", "आवेदन कैसे करूँ?"],
    mr: ["मी या योजनेसाठी पात्र आहे का?", "मला कोणती कागदपत्रे लागतील?", "अर्ज कसा करावा?"],
  },
  insurance: {
    en: ["What premium will I pay?", "How do I report a crop loss?", "Which crops are covered?"],
    hi: ["मुझे कितना प्रीमियम देना होगा?", "फसल नुकसान की सूचना कैसे दूँ?", "कौन सी फसलें शामिल हैं?"],
    mr: ["मला किती प्रीमियम भरावा लागेल?", "पीक नुकसानीची तक्रार कशी करावी?", "कोणती पिके समाविष्ट आहेत?"],
  },
  finance: {
    en: ["What is the interest rate?", "How do I apply at my bank?", "What is the repayment period?"],
    hi: ["ब्याज दर क्या है?", "अपने बैंक में आवेदन कैसे करूँ?", "चुकौती अवधि क्या है?"],
    mr: ["व्याजदर किती आहे?", "माझ्या बँकेत अर्ज कसा करावा?", "परतफेडीचा कालावधी किती?"],
  },
  cooperative: {
    en: ["What are my voting rights?", "How is the committee elected?", "How are disputes resolved?"],
    hi: ["मेरे मतदान अधिकार क्या हैं?", "समिति कैसे चुनी जाती है?", "विवाद कैसे सुलझते हैं?"],
    mr: ["माझे मतदान हक्क काय आहेत?", "समिती कशी निवडली जाते?", "वाद कसे सोडवले जातात?"],
  },
  pacs: {
    en: ["How do I become a PACS member?", "What loans does PACS offer?", "What services does PACS provide?"],
    hi: ["PACS सदस्य कैसे बनूँ?", "PACS कौन से ऋण देता है?", "PACS क्या सेवाएँ देता है?"],
    mr: ["PACS सदस्य कसे व्हावे?", "PACS कोणती कर्जे देते?", "PACS कोणत्या सेवा देते?"],
  },
  agriculture: {
    en: ["How do I get a Soil Health Card?", "How does e-NAM help me sell?", "What crop practices are advised?"],
    hi: ["मृदा स्वास्थ्य कार्ड कैसे मिलेगा?", "e-NAM बेचने में कैसे मदद करता है?", "कौन सी फसल पद्धतियाँ सलाह दी जाती हैं?"],
    mr: ["मृदा आरोग्य कार्ड कसे मिळेल?", "e-NAM विक्रीत कशी मदत करते?", "कोणत्या पीक पद्धती सुचवल्या जातात?"],
  },
};

const GENERIC = {
  en: ["Tell me more", "How do I apply?", "What documents do I need?"],
  hi: ["और बताइए", "आवेदन कैसे करूँ?", "कौन से दस्तावेज़ चाहिए?"],
  mr: ["अधिक सांगा", "अर्ज कसा करावा?", "कोणती कागदपत्रे लागतील?"],
};

export function contextualActions(citations = [], lang = "en") {
  const domain = citations[0]?.domain;
  const set = (domain && MAP[domain]) || null;
  return (set && (set[lang] || set.en)) || GENERIC[lang] || GENERIC.en;
}
