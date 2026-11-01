import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, noise, fitSize } from "./common";
import { font } from "../fonts";

/** Whip-pan: texto entra rasgando com motion blur, linhas de velocidade e sai na direção oposta. */
export const WhipSpeed: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const ease = Easing.bezier(0.1, 0.9, 0.2, 1);
  const whipIn = (delay: number) => interpolate(frame - delay, [0, 9], [1, 0], { ...clamp, easing: ease });
  const whipOut = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const a = whipIn(0), b = whipIn(5);
  const speed = Math.max(a, b, whipOut);
  const size1 = fitSize(Number(v.fontSize ?? 170) * u, String(v.line1 ?? "").length, width * 0.86, 0.7);
  const size2 = fitSize(size1 * 0.55, String(v.line2 ?? "").length, width * 0.86, 0.66);
  const lines = 26;
  const drift = interpolate(frame, [10, durationInFrames - 10], [0, -30 * u], clamp);

  const row = (p: number, from: number, size: number, text: string, color: string, bg?: string) => (
    <div style={{ transform: `translateX(${p * from * width + drift - whipOut * width * 1.2 * Math.sign(from || 1)}px) skewX(${(p + whipOut) * -25 * Math.sign(from)}deg)`, filter: `blur(${(p + whipOut) * 30 * u}px)`, fontFamily: font(v.font), fontWeight: 900, fontSize: size, color, background: bg, padding: bg ? `${0.05 * size}px ${0.25 * size}px` : 0, textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1.05, fontStyle: v.italic ? "italic" : "normal" }}>
      {text}
    </div>
  );

  return (
    <Background v={v}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {Array.from({ length: lines }).map((_, i) => {
          const y = noise(`ly${i}`, 0) * height;
          const len = (200 + noise(`ll${i}`, 0) * 700) * u;
          const x = ((noise(`lx${i}`, 0) * 3 - frame * (0.08 + noise(`lv${i}`, 0) * 0.1)) % 3 + 3) % 3;
          return <div key={i} style={{ position: "absolute", top: y, left: x * width - width, width: len, height: (2 + noise(`lh${i}`, 0) * 5) * u, background: i % 4 === 0 ? v.accentColor : v.lineColor, opacity: 0.15 + speed * 0.75, filter: `blur(${(1 + speed * 4) * u}px)` }} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 18 * u }}>
        {row(a, 1.3, size1, v.line1, v.textColor)}
        {String(v.line2 ?? "").trim() ? row(b, -1.3, size2, v.line2, v.line2Color ?? "#000", v.accentColor) : null}
      </AbsoluteFill>
    </Background>
  );
};
