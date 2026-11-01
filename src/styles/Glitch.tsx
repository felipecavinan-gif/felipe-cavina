import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, StyleProps, useUnit, clamp, noise, fitSize } from "./common";
import { font } from "../fonts";

/** Glitch digital: separação RGB, fatias deslocadas, blocos de ruído e flicker em rajadas. */
export const Glitch: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const intensity = Number(v.intensity ?? 1);
  const inBurst = (f: number) => f < 14 || f > durationInFrames - 12 || noise("burst", Math.floor(f / 3)) > 0.78;
  const burst = inBurst(frame);
  const amt = burst ? intensity : intensity * 0.08;
  const size = fitSize(Number(v.fontSize ?? 170) * u, String(v.title ?? "").length, width * 0.88, 0.68);
  const ox = (noise("ox", frame) - 0.5) * 50 * u * amt;
  const appear = interpolate(frame, [0, 10], [0, 1], clamp);
  const gone = interpolate(frame, [durationInFrames - 6, durationInFrames - 1], [1, 0], clamp);
  const flick = burst && noise("fl", frame) > 0.7 ? 0.25 : 1;
  const textStyle: React.CSSProperties = { fontFamily: font(v.font), fontWeight: 900, fontSize: size, textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1, letterSpacing: "-0.02em" };
  const slices = 6;

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: appear * gone * flick }}>
        <div style={{ position: "relative" }}>
          <div style={{ ...textStyle, color: v.colorA, position: "absolute", left: 0, top: 0, transform: `translate(${-8 * u * amt + ox}px, ${2 * u * amt}px)`, opacity: 0.85 }}>{v.title}</div>
          <div style={{ ...textStyle, color: v.colorB, position: "absolute", left: 0, top: 0, transform: `translate(${8 * u * amt - ox}px, ${-2 * u * amt}px)`, opacity: 0.85 }}>{v.title}</div>
          <div style={{ ...textStyle, color: v.textColor, position: "relative" }}>{v.title}</div>
          {burst
            ? Array.from({ length: slices }).map((_, i) => {
                const top = noise(`st${i}`, frame) * 100;
                const h = 4 + noise(`sh${i}`, frame) * 14;
                const dx = (noise(`sd${i}`, frame) - 0.5) * 120 * u * intensity;
                return (
                  <div key={i} style={{ ...textStyle, position: "absolute", left: 0, top: 0, color: i % 2 ? v.colorA : v.textColor, clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`, transform: `translateX(${dx}px)` }}>
                    {v.title}
                  </div>
                );
              })
            : null}
        </div>
        <div style={{ fontFamily: font("jetbrains"), fontSize: 34 * u, color: v.colorA, marginTop: 30 * u, letterSpacing: "0.2em", textTransform: "uppercase", transform: `translateX(${-ox * 0.5}px)`, opacity: interpolate(frame, [12, 20], [0, 1], clamp) }}>
          {v.subtitle}
        </div>
      </AbsoluteFill>
      {burst
        ? Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: noise(`bx${i}`, frame) * width, top: noise(`by${i}`, frame) * height, width: (40 + noise(`bw${i}`, frame) * 260) * u, height: (6 + noise(`bh${i}`, frame) * 30) * u, background: [v.colorA, v.colorB, v.textColor][i % 3], opacity: 0.8 * intensity }} />
          ))
        : null}
      {v.scanlines ? (
        <AbsoluteFill>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i / 40) * 100}%`, height: 2 * u, background: "rgba(0,0,0,.35)" }} />
          ))}
        </AbsoluteFill>
      ) : null}
    </Background>
  );
};
