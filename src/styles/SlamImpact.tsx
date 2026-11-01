import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, parseWords, shake, fitSize } from "./common";
import { font } from "../fonts";

const Stripes: React.FC<{ v: any; frame: number }> = ({ v, frame }) => {
  const { width, height } = useVideoConfig();
  const d = Math.hypot(width, height);
  const w = d / 14;
  const move = (frame * Number(v.stripeSpeed ?? 6)) % (w * 2);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: (width - d * 1.5) / 2, top: (height - d * 1.5) / 2, width: d * 1.5, height: d * 1.5, transform: `rotate(-24deg) translateX(${move}px)` }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: i * w * 2 - w * 2, width: w, background: v.stripeColor }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Palavras batendo na tela: escala gigante com motion blur, flash branco e câmera tremendo a cada impacto. */
export const SlamImpact: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const words = parseWords(v.text);
  const beat = Math.max(3, Number(v.beat ?? 8));
  const stack = v.mode === "stack";
  const current = Math.min(words.length - 1, Math.floor(frame / beat));
  const lastHit = current * beat;
  const sh = shake(frame, lastHit, Number(v.shake ?? 26) * u, 9);
  const flash = v.flash ? interpolate(frame - lastHit, [0, 3], [0.85, 0], clamp) : 0;
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const base = Number(v.fontSize ?? 200) * u;
  const longest = Math.max(...words.map((w) => w.word.length), 1);

  const renderWord = (i: number, size: number) => {
    const t = frame - i * beat;
    if (t < 0) return null;
    const s = interpolate(t, [0, 4], [3.2, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const blur = interpolate(t, [0, 4], [28 * u, 0], clamp);
    const rot = ((i % 2 ? 1 : -1) * Number(v.tiltWords ?? 4));
    return (
      <span key={i} style={{ display: "inline-block", fontFamily: font(v.font), fontWeight: 900, fontSize: size, lineHeight: 0.95, color: words[i].accent ? v.accentColor : v.textColor, transform: `scale(${s}) rotate(${stack ? 0 : rot}deg)`, filter: `blur(${blur}px)`, opacity: interpolate(t, [0, 1], [0.4, 1], clamp), textTransform: "uppercase", whiteSpace: "nowrap", textShadow: v.shadow ? `${8 * u}px ${8 * u}px 0 ${v.shadowColor}` : "none" }}>
        {words[i].word}
      </span>
    );
  };

  return (
    <Background v={v}>
      {v.stripes && !v.transparent ? <Stripes v={v} frame={frame} /> : null}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 * u, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${1 + out * 0.6})`, opacity: 1 - out, filter: `blur(${out * 20 * u}px)` }}>
        {stack ? (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${0.05 * base}px ${0.25 * base}px`, textAlign: "center" }}>
            {words.map((_, i) => renderWord(i, fitSize(base * 0.75, longest, width * 0.86, 0.75)))}
          </div>
        ) : (
          renderWord(current, fitSize(base, words[current]?.word.length ?? 1, width * 0.88, 0.75))
        )}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: v.flashColor ?? "#ffffff", opacity: flash }} /> : null}
    </Background>
  );
};
