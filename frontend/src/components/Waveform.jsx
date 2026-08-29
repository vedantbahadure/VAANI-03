import React, { useRef, useEffect } from "react";

// Real-time microphone waveform. Reads an AnalyserNode via getAnalyser().
export function Waveform({ getAnalyser, active, bars = 32, color = "currentColor", className = "" }) {
  const ref = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const data = new Uint8Array(256);
    const draw = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const an = getAnalyser && getAnalyser();
      const gap = 3;
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        let v = 0.06;
        if (an && active) {
          an.getByteFrequencyData(data);
          const seg = Math.floor((i / bars) * (data.length * 0.6));
          v = Math.max(0.06, data[seg] / 255);
        } else {
          v = 0.06 + Math.abs(Math.sin(Date.now() / 400 + i)) * 0.08;
        }
        const bh = v * h;
        const x = i * (bw + gap);
        const y = (h - bh) / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = active ? 0.9 : 0.4;
        const r = Math.min(bw / 2, 4);
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, bw, bh, r) : ctx.rect(x, y, bw, bh);
        ctx.fill();
      }
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, [getAnalyser, active, bars, color]);

  return <canvas ref={ref} className={`w-full h-full ${className}`} data-testid="mic-waveform" />;
}
