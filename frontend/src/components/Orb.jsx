import React from "react";
import { ORB_COLORS } from "../lib/contexts";

// Lightweight, GPU-cheap Living Orb (CSS/SVG). Reflects the 7 VAANI states.
// Used inside the app and in device mode. Size in px.
export function Orb({ state = "idle", size = 120, className = "" }) {
  const c = ORB_COLORS[state] || ORB_COLORS.idle;
  const active = state === "listening" || state === "thinking" || state === "speaking";
  const spin = state === "thinking" ? "10s" : state === "speaking" ? "6s" : "18s";
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      data-testid="vaani-orb"
      data-orb-state={state}
      aria-label={`VAANI ${state}`}
    >
      {/* outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-colors duration-700"
        style={{ background: c.glow, transform: "scale(1.3)" }}
      />
      {/* ripples for listening */}
      {state === "listening" && (
        <>
          <span className="absolute inset-0 rounded-full" style={{ border: `2px solid ${c.a}`, animation: "ripple 2.4s ease-out infinite" }} />
          <span className="absolute inset-0 rounded-full" style={{ border: `2px solid ${c.b}`, animation: "ripple 2.4s ease-out infinite", animationDelay: "1.2s" }} />
        </>
      )}
      {/* core sphere */}
      <div
        className="absolute inset-[10%] rounded-full animate-breathe transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${c.a} 34%, ${c.b} 72%, ${c.b} 100%)`,
          boxShadow: `inset -8px -10px 24px rgba(0,0,0,0.25), inset 6px 8px 20px rgba(255,255,255,0.5), 0 10px 40px ${c.glow}`,
          animationDuration: active ? "2.4s" : "4.5s",
        }}
      />
      {/* rotating light band */}
      <div
        className="absolute inset-[10%] rounded-full mix-blend-screen opacity-70"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${c.a}88 20%, transparent 45%, ${c.b}66 70%, transparent 100%)`,
          animation: `spin-slow ${spin} linear infinite`,
          maskImage: "radial-gradient(circle, transparent 40%, black 70%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 40%, black 70%)",
        }}
      />
      {/* highlight */}
      <div className="absolute rounded-full bg-white/70 blur-[2px]" style={{ width: size * 0.14, height: size * 0.1, top: size * 0.22, left: size * 0.3 }} />
    </div>
  );
}
