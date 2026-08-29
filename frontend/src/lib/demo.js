// One-touch Demo Mode: a scripted autopilot that showcases VAANI to judges.
// Non-destructive — it just drives the public send() function with timed questions.
const SCRIPT = [
  { lang: "en", q: "How much money do I get under PM-KISAN and how is it paid?" },
  { lang: "en", q: "What does crop insurance PMFBY cover and what premium do I pay?" },
  { lang: "hi", q: "किसान क्रेडिट कार्ड कैसे मिलेगा और ब्याज दर क्या है?" },
  { lang: "mr", q: "सहकारी सदस्य म्हणून माझे हक्क काय आहेत?" },
];

// send: (text)=>Promise, waitDone: ()=>Promise resolves when streaming completes,
// setLang: (code)=>void, isCancelled: ()=>bool
export async function runDemo({ send, waitIdle, setLang, isCancelled, onStep }) {
  for (let i = 0; i < SCRIPT.length; i++) {
    if (isCancelled()) return;
    const step = SCRIPT[i];
    onStep?.(i, SCRIPT.length);
    setLang(step.lang);
    await new Promise((r) => setTimeout(r, 400));
    send(step.q, step.lang);
    await waitIdle();
    if (isCancelled()) return;
    await new Promise((r) => setTimeout(r, 2600)); // let judges read
  }
  onStep?.(SCRIPT.length, SCRIPT.length);
}

export const DEMO_STEPS = SCRIPT.length;
