import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, parseWords, fitSize } from "./common";
import { font } from "../fonts";
import { BrushStroke } from "./BrushStroke";


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
  const shape = String(v.outlineShape ?? "ellipse");
  const textColor = v.textColor;
  const renderText = (bloom: boolean) => (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 * u, opacity: (off ? 0 : fade) * (bloom ? Math.min(0.75, 0.45 * cb) : 1) }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", gap: `${size * 0.12}px ${size * 0.26}px`, maxWidth: width * 0.84, transform: `translate(${drift + jx}px, ${jy}px) rotate(${rot}deg) scale(${scale * pop})`, filter: `blur(${bloom ? fadeBlur + 22 * u * cb : fadeBlur + flickBlur}px)` }}>
          {(() => { let keyIdx = 0; return words.map((w, i) => {
            if (!w.accent) {
              return <span key={i} style={{ fontFamily: font(v.font), fontWeight: Number(v.weight ?? 800), fontSize: size, lineHeight: 1.05, color: textColor, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none" }}>{w.word}</span>;
            }
            const k = keyIdx++;
            const p = interpolate(frame, [outlineStart + k * 8, outlineStart + k * 8 + outlineLen], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
            // Pouca folga: o traço pode passar por cima de parte da palavra, como um risco feito à mão
            const padX = size * 0.16, padY = size * 0.1;
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", fontFamily: font(v.font), fontWeight: Number(v.weight ?? 800), fontSize: size, lineHeight: 1.05, color: p > 0 && v.keyColor ? v.keyColor : textColor, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none" }}>
                {w.word}
                {p > 0 ? (
                  <span style={{ position: "absolute", left: -padX, top: -padY, right: -padX, bottom: -padY }}>
                    <BrushStroke shape={shape} progress={p} width={Number(v.outlineWidth ?? 3) * u} color={v.outlineColor} blur={Number(v.outlineBlur ?? 1.2) * u} opacity={Number(v.outlineOpacity ?? 0.85)} />
                  </span>
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
