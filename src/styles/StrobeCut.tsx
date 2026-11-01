import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleProps, useUnit, noise, parseWords, fitSize } from "./common";
import { font } from "../fonts";

/** Corte rápido palavra por palavra com fundo alternando cor (estilo hype/promo). */
export const StrobeCut: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const words = parseWords(v.text);
  const per = Math.max(2, Number(v.framesPerWord ?? 6));
  const i = Math.min(words.length - 1, Math.floor(frame / per));
  const t = frame - i * per;
  const last = i === words.length - 1;
  const palette = [v.colorA, v.colorB, v.colorC].filter(Boolean);
  const bg = palette[i % palette.length];
  const fg = i % palette.length === 0 ? v.textOnA : v.textOnB;
  const w = words[i] ?? { word: "", accent: false };
  const zoom = last ? interpolate(t, [0, durationInFrames - i * per], [1.25, 1]) : 1 + t * 0.02;
  const rot = last ? 0 : (noise("rot", i) - 0.5) * Number(v.chaos ?? 10);
  const flash = v.flash && t < 1 && i % 2 === 0;
  const size = fitSize(Number(v.fontSize ?? 230) * u, w.word.length, width * 0.9, 0.72);

  return (
    <AbsoluteFill style={{ background: v.transparent ? "transparent" : bg, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: size, lineHeight: 1, color: w.accent ? v.accentColor : fg, transform: `scale(${zoom}) rotate(${rot}deg)`, textTransform: "uppercase", whiteSpace: "nowrap", filter: `blur(${t === 0 && !last ? 6 * u : 0}px)` }}>
        {w.word}
      </div>
      {flash ? <AbsoluteFill style={{ background: "#fff", opacity: 0.7 }} /> : null}
    </AbsoluteFill>
  );
};
