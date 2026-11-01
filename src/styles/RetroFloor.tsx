import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleProps, useUnit, clamp, flicker, fitSize } from "./common";
import { font } from "../fonts";

/** Synthwave: chão em grade 3D andando, sol listrado e título neon que acende piscando. */
export const RetroFloor: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const horizon = height * 0.58;
  const spacing = 120 * u;
  const offset = (frame * Number(v.speed ?? 8) * u) % spacing;
  const rows = 40, cols = 25;
  const neonOn = frame < 18 ? (Math.floor(frame / 2) % 3 === 0 ? 0.2 : 1) * flicker(frame, 0.5) : flicker(frame, 0.12, "neon");
  const pop = spring({ frame: frame - 4, fps, config: { damping: 12 } });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [0, 1], clamp);
  const sunR = Math.min(width, height) * 0.2;
  const size = fitSize(Number(v.fontSize ?? 150) * u, String(v.title ?? "").length, width * 0.86, 0.7);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${v.skyTop} 0%, ${v.skyBottom} 58%, ${v.floorColor} 58%)`, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: width / 2 - sunR, top: horizon - sunR * 1.15, width: sunR * 2, height: sunR * 2, borderRadius: "50%", background: `linear-gradient(180deg, ${v.sunTop}, ${v.sunBottom})`, boxShadow: `0 0 ${80 * u}px ${v.sunBottom}` }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: horizon - sunR * 0.6 + i * sunR * 0.13 + ((frame * 0.6 * u) % (sunR * 0.13)), height: (2 + i * 2.2) * u, background: v.skyBottom }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: horizon, height: height - horizon, background: v.floorColor }} />
      {/* Chão projetado em 2D (perspectiva calculada à mão): funciona igual em qualquer renderizador */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {Array.from({ length: rows }).map((_, r) => {
          const z = (r + 1) * spacing - offset;
          const y = horizon + ((height - horizon) * spacing * 0.9) / Math.max(z, 1);
          if (y > height + 10) return null;
          const th = Math.max(1.5 * u, (5 * u * spacing) / Math.max(z, 1) * 0.6);
          return <div key={`r${r}`} style={{ position: "absolute", left: 0, right: 0, top: y, height: th, background: v.gridColor, boxShadow: `0 0 ${8 * u}px ${v.gridColor}`, opacity: Math.min(1, (y - horizon) / (40 * u)) }} />;
        })}
        {Array.from({ length: cols }).map((_, c) => {
          const dx = (c - (cols - 1) / 2) * width * 0.16;
          const len = Math.hypot(dx * 3, (height - horizon) * 3);
          const ang = (Math.atan2(dx * 3, (height - horizon) * 3) * 180) / Math.PI;
          return <div key={`c${c}`} style={{ position: "absolute", left: width / 2 - 1.5 * u, top: horizon, width: 3 * u, height: len, background: v.gridColor, boxShadow: `0 0 ${8 * u}px ${v.gridColor}`, transformOrigin: "50% 0%", transform: `rotate(${-ang}deg)` }} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 50%, ${v.skyBottom}88 58%, transparent 66%)` }} />
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: height * (height > width ? 0.16 : 0.07) }}>
        <div style={{ fontFamily: font(v.font), fontStyle: "italic", fontWeight: 900, fontSize: size, color: v.textColor, opacity: neonOn, transform: `scale(${0.6 + 0.4 * pop}) skewX(-8deg)`, textShadow: `0 0 ${10 * u}px ${v.neonColor}, 0 0 ${40 * u}px ${v.neonColor}, 0 0 ${90 * u}px ${v.neonColor}`, textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1 }}>
          {v.title}
        </div>
        <div style={{ fontFamily: font(v.subtitleFont ?? "spacegrotesk"), fontWeight: 700, fontSize: 40 * u, letterSpacing: "0.5em", color: v.neonColor, marginTop: 24 * u, opacity: interpolate(frame, [20, 34], [0, 1], clamp) * neonOn, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {v.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
