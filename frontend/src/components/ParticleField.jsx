import React, { useRef, useEffect } from "react";

// Canvas 2D particle "neural network" field. Cinematic yet performant.
// intensity: 0..1 controls density; interactive adds cursor magnetism.
export function ParticleField({ intensity = 1, interactive = true, className = "", colorLight = "17,24,21", colorDark = "214,229,219" }) {
  const ref = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, dpr, particles = [], mouse = { x: -9999, y: -9999 };

    const isDark = () => document.documentElement.classList.contains("dark");

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((w * h) / 14000 * intensity);
      particles = Array.from({ length: Math.max(24, count) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const draw = () => {
      const col = isDark() ? colorDark : colorLight;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (interactive) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 120) { p.x += (dx / d) * 0.6; p.y += (dy / d) * 0.6; }
        }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      const maxD = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxD) {
            ctx.strokeStyle = `rgba(${col},${(1 - d / maxD) * 0.18})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.fillStyle = `rgba(${col},0.55)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf.current = requestAnimationFrame(draw);
    };

    resize();
    if (!reduce) raf.current = requestAnimationFrame(draw);
    else draw();
    window.addEventListener("resize", resize);
    const move = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    if (interactive) window.addEventListener("mousemove", move);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      if (interactive) window.removeEventListener("mousemove", move);
    };
  }, [intensity, interactive, colorLight, colorDark]);

  return <canvas ref={ref} className={`w-full h-full ${className}`} data-testid="particle-field" />;
}
