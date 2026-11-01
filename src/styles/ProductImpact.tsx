import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, shake, noise, parseWords, fitSize } from "./common";
import { ProductImg } from "./product";
import { font } from "../fonts";

/** Produto cai na tela com impacto: blur de movimento, flash, onda de choque, linhas radiais e texto martelado. */
export const ProductImpact: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const m = Math.min(width, height);
  const hit = Number(v.hitFrame ?? 7);
  const size = m * Number(v.imageScale ?? 0.58);
  const fall = interpolate(frame, [0, hit], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const scale = interpolate(fall, [0, 1], [4, 1]) * (frame >= hit ? interpolate(frame - hit, [0, 3, 8], [0.9, 1.04, 1], clamp) : 1);
  const sh = shake(frame, hit, Number(v.shake ?? 30) * u, 12);
  const flash = interpolate(frame - hit, [0, 4], [0.9, 0], clamp) * (frame >= hit ? 1 : 0);
  const wave = (k: number) => interpolate(frame - hit - k * 4, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lines = interpolate(frame - hit, [0, 12], [0, 1], clamp);
  const words = parseWords(v.text);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const slow = interpolate(frame, [hit, durationInFrames], [1, 1.06]);
  const cy = height * Number(v.imageY ?? 0.44);
  const longest = Math.max(...words.map((w) => w.word.length), 1);
  const wordSize = fitSize(Number(v.fontSize ?? 120) * u, longest, width * 0.8, 0.72);
  const badge = spring({ frame: frame - hit - 10 - words.length * 4, fps, config: { damping: 8 } });

  return (
    <Background v={v}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${slow * (1 + out * 0.3)})`, opacity: 1 - out }}>
        {/* linhas radiais */}
        {frame >= hit
          ? Array.from({ length: 28 }).map((_, i) => {
              const a = (i / 28) * 360 + noise("ra", i) * 8;
              const len = m * (0.25 + noise("rl", i) * 0.3);
              return <div key={i} style={{ position: "absolute", left: width / 2, top: cy, width: len, height: (3 + noise("rw", i) * 6) * u, background: v.accentColor, transformOrigin: "0 50%", transform: `rotate(${a}deg) translateX(${size * 0.35 + lines * m * 0.35}px) scaleX(${1 - lines})`, opacity: 1 - lines }} />;
            })
          : null}
        {/* ondas de choque */}
        {[0, 1].map((k) => {
          const w = wave(k);
          if (frame < hit + k * 4) return null;
          const r = size * (0.3 + w * 1.2);
          return <div key={k} style={{ position: "absolute", left: width / 2 - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${(1 - w) * 22 * u}px solid ${v.accentColor}`, opacity: 1 - w }} />;
        })}
        {/* produto */}
        <div style={{ position: "absolute", left: width / 2 - size / 2, top: cy - size / 2, transform: `scale(${scale})`, filter: `blur(${(1 - fall) * 30 * u}px)`, opacity: Math.min(1, fall * 3) }}>
          <ProductImg src={v.image} size={size} shadow={`0 ${26 * u}px ${30 * u}px rgba(0,0,0,.35)`} />
        </div>
        {/* texto martelado */}
        <div style={{ position: "absolute", left: 0, right: 0, top: cy + size * 0.52, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${wordSize * 0.25}px`, padding: `0 ${60 * u}px` }}>
          {words.map((w, i) => {
            const tw = frame - hit - 6 - i * 4;
            if (tw < 0) return null;
            const s = interpolate(tw, [0, 4], [2.6, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            return <span key={i} style={{ display: "inline-block", fontFamily: font(v.font), fontWeight: 900, fontSize: wordSize, lineHeight: 1.05, color: w.accent ? v.accentColor : v.textColor, textTransform: "uppercase", transform: `scale(${s})`, filter: `blur(${interpolate(tw, [0, 4], [16 * u, 0], clamp)}px)`, whiteSpace: "nowrap" }}>{w.word}</span>;
          })}
        </div>
        {String(v.badge ?? "").trim() ? (
          <div style={{ position: "absolute", left: width / 2 + size * 0.2, top: cy - size * 0.58, padding: `${16 * u}px ${30 * u}px`, background: v.accentColor, color: v.badgeTextColor, fontFamily: font(v.font), fontWeight: 900, fontSize: 52 * u, transform: `scale(${badge}) rotate(-8deg)`, whiteSpace: "nowrap", boxShadow: `${8 * u}px ${8 * u}px 0 ${v.textColor}` }}>
            {v.badge}
          </div>
        ) : null}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: v.flashColor ?? "#fff", opacity: flash }} /> : null}
    </Background>
  );
};
