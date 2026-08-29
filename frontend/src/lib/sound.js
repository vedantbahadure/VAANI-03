// Subtle WebAudio sound effects — no assets, respects a user toggle.
let ctx = null;
const enabled = () => localStorage.getItem("vaani-sfx") !== "0"; // default on

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

function tone(freq, dur = 0.12, type = "sine", gain = 0.05, delay = 0) {
  if (!enabled()) return;
  const a = ac();
  if (!a) return;
  try {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(a.destination);
    const t = a.currentTime + delay;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  } catch {}
}

export const sfx = {
  start: () => { tone(523.25, 0.1, "sine", 0.05); tone(783.99, 0.12, "sine", 0.04, 0.06); },
  send: () => tone(660, 0.09, "triangle", 0.045),
  receive: () => { tone(880, 0.09, "sine", 0.04); tone(1174.66, 0.1, "sine", 0.03, 0.05); },
  listen: () => tone(440, 0.14, "sine", 0.045),
  success: () => { tone(659.25, 0.1, "sine", 0.05); tone(987.77, 0.14, "sine", 0.04, 0.07); },
  tap: () => tone(320, 0.05, "triangle", 0.03),
  setEnabled: (v) => localStorage.setItem("vaani-sfx", v ? "1" : "0"),
  isEnabled: enabled,
};
