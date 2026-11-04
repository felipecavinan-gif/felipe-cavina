import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, parseWords, fitSize } from "./common";
import { font } from "../fonts";

/** Formas do contorno, desenhadas num quadro 0..100 com pathLength=100 (para animar o traço). */
const SHAPES: Record<string, string> = {
  ellipse: "M 52 4 C 82 2, 99 22, 98 50 C 97 80, 74 97, 46 96 C 18 95, 2 76, 3 48 C 4 22, 24 6, 58 8",
  double: "M 50 6 C 84 4, 99 26, 97 52 C 95 82, 70 97, 44 95 C 16 93, 2 72, 4 46 C 6 20, 30 4, 62 7 C 88 10, 96 34, 94 56",
  box: "M 2 4 L 98 3 L 97 97 L 3 96 L 2 2",
  underline: "M 1 92 C 25 86, 55 96, 99 88 M 6 99 C 40 93, 70 100, 96 95",
  brackets: "M 14 2 L 2 2 L 2 98 L 14 98 M 86 2 L 98 2 L 98 98 L 86 98",
};

/**
 * Texto chega forte, como se atravessasse a tela (escala grande + muito blur), desacelera
 * e segue diminuindo bem sutil; no meio, um contorno é desenhado na palavra-chave.
 * O final é suave: blur e fade, sem flicks.
 */
export const OutlineFlick: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const words = parseWords(v.text);
  const D = durationInFrames;
  const outlineStart = D * Number(v.outlineAt ?? 0.32);
  const outlineLen = Math.max(6, Number(v.outlineFrames ?? 18));
  const introLen = Math.max(6, Number(v.introFrames ?? 24));
  const outLen = Math.max(6, Number(v.outroFrames ?? 16));

  // 1) Chegada forte: escala grande caindo rápido e desacelerando (curva exponencial)
  const intro = interpolate(frame, [0, introLen], [0, 1], { ...clamp, easing: Easing.bezier(0.25, 0.75, 0.3, 1) });
  const introScale = interpolate(intro, [0, 1], [Number(v.scaleFrom ?? 3.2), 1]);
  // 2) Depois segue diminuindo bem devagar até o fim
  const slowScale = interpolate(frame, [0, D], [1, Number(v.scaleTo ?? 0.9)], { easing: Easing.out(Easing.quad) });
  const scale = introScale * slowScale;
  // 3) Saída suave: blur e fade
  const out = interpolate(frame, [D - outLen, D - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });

  const cb = Number(v.cinemaBlur ?? 0);
  const breathe = cb * 1.4 * u * (0.5 + 0.5 * Math.sin(frame / 10));
  const fadeBlur = (1 - intro) * (28 + 22 * cb) * u + out * (16 + 10 * cb) * u + breathe;
  const fade = interpolate(frame, [0, 3], [0.35, 1], clamp) * (1 - out);
  const drift = interpolate(frame, [0, D], [Number(v.drift ?? 1) * -30 * u, Number(v.drift ?? 1) * 30 * u], { easing: Easing.out(Easing.quad) });
  const rot = interpolate(frame, [0, D], [Number(v.rotate ?? 0) * -1, Number(v.rotate ?? 0)]);
  const off = false, jx = 0, jy = 0, pop = 1, flickBlur = 0; // sem flicks: valores neutros

  const longest = words.reduce((a, w) => a + w.word.length + 1, 0);
  const portrait = useVideoConfig().height > width;
  const lines = Math.max(1, Math.ceil(longest / Number(v.charsPerLine ?? (portrait ? 8 : 16))));
  const size = fitSize(Number(v.fontSize ?? 130) * u, Math.ceil(longest / lines), width * 0.78, Number(v.charRatio ?? 0.6));
  const shape = SHAPES[String(v.outlineShape ?? "ellipse")] ?? SHAPES.ellipse;
  const textColor = v.textColor;
  const renderText = (bloom: boolean) => (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 * u, opacity: (off ? 0 : fade) * (bloom ? Math.min(0.75, 0.45 * cb) : 1) }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", gap: `${size * 0.12}px ${size * 0.26}px`, maxWidth: width * 0.84, transform: `translate(${drift + jx}px, ${jy}px) rotate(${rot}deg) scale(${scale * pop})`, filter: `blur(${bloom ? fadeBlur + 22 * u * cb : fadeBlur + flickBlur}px)` }}>
          {(() => { let keyIdx = 0; return words.map((w, i) => {
            if (!w.accent) {
              return <span key={i} style={{ fontFamily: font(v.font), fontWeight: Number(v.weight ?? 800), fontSize: size, lineHeight: 1.05, color: textColor, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none" }}>{w.word}</span>;
            }
            const k = keyIdx++;
            const p = interpolate(frame, [outlineStart + k * 6, outlineStart + k * 6 + outlineLen], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
            const padX = size * 0.28, padY = size * 0.2;
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", fontFamily: font(v.font), fontWeight: Number(v.weight ?? 800), fontSize: size, lineHeight: 1.05, color: p > 0 && v.keyColor ? v.keyColor : textColor, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none" }}>
                {w.word}
                {p > 0 ? (
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", left: -padX, top: -padY, width: `calc(100% + ${padX * 2}px)`, height: `calc(100% + ${padY * 2}px)`, overflow: "visible" }}>
                    <path d={shape} pathLength={100} fill="none" stroke={v.outlineColor} strokeWidth={Number(v.outlineWidth ?? 7) * u} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100 100" strokeDashoffset={100 - p * 100} />
                  </svg>
                ) : null}
              </span>
            );
          }); })()}
        </div>
      </AbsoluteFill>
  );

  return (
    <Background v={v}>
      {cb > 0 ? renderText(true) : null}
      {renderText(false)}
    </Background>
  );
};
