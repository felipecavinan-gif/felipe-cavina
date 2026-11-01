import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, noise, fitSize } from "./common";
import { ProductImg } from "./product";
import { font } from "../fonts";

/**
 * Editorial de produto: a imagem entra em "flicks" rápidos (corta, pisca, pula de escala)
 * e as frases trocam em cortes secos, com o texto atrás ou na frente do produto.
 */
export const ProductFlick: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const phrases = [1, 2, 3]
    .map((i) => ({ small: String(v[`small${i}`] ?? ""), big: String(v[`big${i}`] ?? "") }))
    .filter((p) => p.small.trim() || p.big.trim());
  const n = Math.max(1, phrases.length);
  const intro = 10;
  const seg = (durationInFrames - intro - 6) / n;
  const idx = Math.min(n - 1, Math.max(0, Math.floor((frame - intro) / seg)));
  const segStart = intro + idx * seg;
  const t = frame - segStart;
  const flickSpeed = Number(v.flickSpeed ?? 1);

  // Flick de entrada do produto: liga/desliga com saltos de escala
  const pattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1];
  const fi = Math.floor(frame * flickSpeed);
  const introOn = fi < pattern.length ? pattern[fi] : 1;
  const introScale = fi < pattern.length ? [1.35, 1.35, 1.18, 1.18, 1.1, 1.1, 1.04, 1.04, 1, 1][fi] : 1;
  const punch = frame >= intro ? interpolate(t, [0, 6], [Number(v.punch ?? 1.07), 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const bob = Math.sin(frame / 18) * 8 * u * (v.float ? 1 : 0);
  const outF = durationInFrames - frame;
  const exitOn = outF > 6 ? 1 : [0, 1, 0, 1, 0, 1][outF] ?? 1;
  const imgSize = Math.min(width, height) * Number(v.imageScale ?? 0.62);
  // Posições relativas à imagem: o layout fica igual em 9:16, 16:9, 1:1 e 4:5.
  const cy = height / 2 + imgSize * (Number(v.imageY ?? 0) / 100);
  const jitter = fi < pattern.length ? (noise("pj", fi) - 0.5) * 30 * u : 0;

  // Texto: corte seco com blur curto e piscada
  const p = phrases[idx] ?? { small: "", big: "" };
  const textOn = frame < intro - 2 ? 0 : t < 2 ? (t === 0 ? 1 : 0) : 1;
  const textBlur = interpolate(t, [0, 4], [12 * u, 0], clamp);
  const textScale = interpolate(t, [0, 5], [1.12, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bigSize = fitSize(Number(v.fontSize ?? 150) * u, p.big.length, width * 0.9, 0.55);
  const smallSize = bigSize * Number(v.smallRatio ?? 0.36);
  const flash = v.flash && frame >= intro && t < 2 ? interpolate(t, [0, 2], [0.6, 0]) : 0;

  const text = (
    <AbsoluteFill style={{ alignItems: "center", top: cy + imgSize * (Number(v.textOffset ?? -28) / 100) - bigSize * 0.9, bottom: "auto", opacity: textOn * exitOn }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: v.align === "left" ? "flex-start" : "center", transform: `scale(${textScale})`, filter: `blur(${textBlur}px)` }}>
        {p.small.trim() ? (
          <div style={{ fontFamily: font(v.smallFont ?? v.font), fontWeight: Number(v.smallWeight ?? 700), fontSize: smallSize, color: v.smallColor ?? v.textColor, lineHeight: 1, marginBottom: -smallSize * 0.05, marginLeft: v.align === "left" ? bigSize * 0.12 : 0, whiteSpace: "nowrap" }}>
            {p.small}
          </div>
        ) : null}
        <div style={{ fontFamily: font(v.font), fontWeight: Number(v.bigWeight ?? 900), fontSize: bigSize, color: v.textColor, lineHeight: 0.92, letterSpacing: "-0.02em", whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none" }}>
          {p.big}
        </div>
      </div>
    </AbsoluteFill>
  );

  const product = (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: width / 2 - imgSize / 2, top: cy - imgSize / 2, opacity: introOn * exitOn, transform: `translate(${jitter}px, ${bob}px) scale(${introScale * punch}) rotate(${fi < pattern.length ? (noise("pr", fi) - 0.5) * 6 : 0}deg)` }}>
        <ProductImg src={v.image} size={imgSize} shadow={v.shadow ? `0 ${24 * u}px ${30 * u}px rgba(0,0,0,.28)` : undefined} />
      </div>
    </AbsoluteFill>
  );

  return (
    <Background v={v}>
      {v.textLayer === "front" ? product : text}
      {v.textLayer === "front" ? text : product}
      {flash > 0 ? <AbsoluteFill style={{ background: v.flashColor ?? "#fff", opacity: flash }} /> : null}
    </Background>
  );
};
