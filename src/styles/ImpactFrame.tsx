import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, shake, noise, fitSize } from "./common";
import { ProductImg } from "./product";
import { font } from "../fonts";

/** Quadro de impacto estilo mangá: linhas de velocidade radiais, frames invertidos e soco de texto. */
export const ImpactFrame: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const hit = 4;
  const D = Math.hypot(width, height);
  const inverted = v.invert && frame >= hit && frame < hit + 4 && Math.floor((frame - hit) / 2) % 2 === 0;
  const bg = inverted ? v.textColor : v.bgColor;
  const lineCol = inverted ? v.bgColor : v.lineColor;
  const txtCol = inverted ? v.bgColor : v.textColor;
  const sh = shake(frame, hit, Number(v.shake ?? 24) * u, 14);
  const punch = interpolate(frame - hit, [0, 5], [1.6, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const blur = interpolate(frame - hit, [0, 4], [20 * u, 0], clamp);
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [0, 1], clamp);
  const lines = Number(v.lineCount ?? 60);
  const inner = Math.min(width, height) * Number(v.innerRadius ?? 0.28);
  const size = fitSize(Number(v.fontSize ?? 190) * u, String(v.title ?? "").length, width * 0.86, 0.72);
  const showImg = v.showImage;

  return (
    <AbsoluteFill style={{ background: v.transparent ? "transparent" : bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)`, opacity: 1 - out }}>
        {frame >= hit
          ? Array.from({ length: lines }).map((_, i) => {
              const j = Math.floor(frame / 2);
              const a = (i / lines) * 360 + (noise(`la${i}`, j) - 0.5) * 4;
              const w = (4 + noise(`lw${i}`, j) * 18) * u;
              const start = inner * (0.8 + noise(`ls${i}`, j) * 0.6);
              return (
                <div key={i} style={{ position: "absolute", left: width / 2, top: height / 2, width: D, height: w, transformOrigin: "0 50%", transform: `rotate(${a}deg) translateX(${start}px)`, clipPath: "polygon(0 50%, 100% 0, 100% 100%)", background: lineCol }} />
              );
            })
          : null}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
          {showImg && frame >= hit ? (
            <div style={{ transform: `scale(${punch})`, filter: `blur(${blur}px)`, marginBottom: 10 * u }}>
              <ProductImg src={v.image} size={Math.min(width, height) * 0.5} />
            </div>
          ) : null}
          {frame >= hit ? (
            <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: showImg ? size * 0.7 : size, color: txtCol, textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1, transform: `scale(${punch}) rotate(${Number(v.tilt ?? -6)}deg)`, filter: `blur(${blur}px)`, textShadow: `${10 * u}px ${10 * u}px 0 ${inverted ? v.textColor : v.accentColor}` }}>
              {v.title}
            </div>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
