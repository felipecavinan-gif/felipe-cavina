import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, StyleProps, useUnit, clamp, splitList, fitSize } from "./common";
import { font } from "../fonts";

/** Título no centro com palavras orbitando em 3D, desfocadas quando estão atrás. */
export const Orbit3D: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const items = splitList(v.items);
  const n = Math.max(1, items.length);
  const R = Math.min(width * 0.42, 620 * u);
  const persp = 1400 * u;
  const pop = spring({ frame, fps, config: { damping: 14 } });
  const spin = (frame / fps) * Number(v.spinSpeed ?? 40) * (Math.PI / 180);
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [0, 1], clamp);
  const tilt = Number(v.tilt ?? 14) * (Math.PI / 180);
  const size = fitSize(Number(v.fontSize ?? 120) * u, String(v.title ?? "").length, width * 0.6, 0.66);

  const placed = items.map((it, i) => {
    const a = spin + (i / n) * Math.PI * 2;
    const x = Math.sin(a) * R * pop;
    const z = Math.cos(a) * R * pop;
    const y = -Math.cos(a) * R * Math.sin(tilt) * pop;
    return { it, i, x, y, z };
  });
  const renderItem = ({ it, i, x, y, z }: (typeof placed)[number]) => {
    const depth = (R - z) / (2 * R); // 0 frente, 1 atrás
    return (
      <div key={i} style={{ position: "absolute", fontFamily: font(v.itemFont ?? v.font), fontWeight: 700, fontSize: 46 * u, color: i % 2 ? v.accentColor : v.itemColor, whiteSpace: "nowrap", padding: `${8 * u}px ${20 * u}px`, border: `${2 * u}px solid ${i % 2 ? v.accentColor : v.itemColor}`, borderRadius: 999, opacity: (1 - depth * 0.6) * (1 - out), filter: `blur(${depth * 10 * u}px)`, transform: `perspective(${persp}px) translate3d(${x}px, ${y}px, ${z}px)` }}>
        {it}
      </div>
    );
  };

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {placed.filter((p) => p.z < 0).sort((a, b) => a.z - b.z).map(renderItem)}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - out }}>
        <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: size, color: v.textColor, transform: `scale(${pop}) translateZ(0)`, textAlign: "center", lineHeight: 1, textTransform: v.uppercase ? "uppercase" : "none", textShadow: `0 ${6 * u}px ${30 * u}px rgba(0,0,0,.5)` }}>
          {v.title}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {placed.filter((p) => p.z >= 0).sort((a, b) => a.z - b.z).map(renderItem)}
      </AbsoluteFill>
    </Background>
  );
};
