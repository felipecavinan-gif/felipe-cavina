import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp } from "./common";
import { ProductImg } from "./product";
import { font } from "../fonts";

/** Produto girando em 3D sobre uma palavra gigante, com sombra no chão, reflexo e selo de preço. */
export const ProductSpin3D: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const m = Math.min(width, height);
  const size = m * Number(v.imageScale ?? 0.6);
  const t = frame / fps;
  const enter = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const spinIn = (1 - enter) * 360;
  const swing = Math.sin(t * Number(v.swingSpeed ?? 1.4)) * Number(v.swing ?? 25);
  const bob = Math.sin(t * 2.2) * 14 * u;
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const persp = 1400 * u;
  const word = String(v.bgWord ?? "");
  const wordSize = Number(v.bgWordSize ?? 420) * u;
  const marquee = -((frame * Number(v.marquee ?? 2) * u) % (wordSize * Math.max(1, word.length) * 0.6 + 80 * u));
  const titleIn = interpolate(frame, [16, 28], [0, 1], clamp);
  const badge = spring({ frame: frame - 24, fps, config: { damping: 9 } });
  const cy = height * 0.47;

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", overflow: "hidden", opacity: 1 - out }}>
        <div style={{ position: "absolute", top: cy - wordSize * 0.6, left: 0, display: "flex", whiteSpace: "nowrap", transform: `translateX(${marquee}px)`, opacity: interpolate(frame, [0, 12], [0, 1], clamp) }}>
          {[0, 1, 2, 3].map((k) => (
            <span key={k} style={{ fontFamily: font(v.bgFont ?? v.font), fontWeight: 900, fontSize: wordSize, color: v.bgWordColor, lineHeight: 1, paddingRight: 80 * u, textTransform: "uppercase", letterSpacing: "-0.03em" }}>{word}</span>
          ))}
        </div>
      </AbsoluteFill>
      {/* sombra no chão */}
      <div style={{ position: "absolute", left: width / 2 - size * 0.4, top: cy + size * 0.48, width: size * 0.8, height: size * 0.12, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(0,0,0,${0.35 * enter}) 0%, rgba(0,0,0,0) 70%)`, transform: `scale(${1 - bob / (100 * u)})`, opacity: 1 - out }} />
      {v.reflection ? (
        <div style={{ position: "absolute", left: width / 2 - size / 2, top: cy + size * 0.5, opacity: 0.1 * enter * (1 - out), transform: `perspective(${persp}px) rotateY(${swing + spinIn}deg) scaleY(-1) scaleX(0.96)`, filter: `blur(${8 * u}px)` }}>
          <ProductImg src={v.image} size={size} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: width / 2 - size / 2, top: cy - size / 2, transform: `perspective(${persp}px) translateY(${bob}px) rotateY(${swing + spinIn}deg) scale(${(0.5 + 0.5 * enter) * (1 - out * 0.4)})`, filter: `blur(${(1 - enter) * 16 * u + out * 20 * u}px)`, opacity: Math.min(1, enter * 2) * (1 - out) }}>
        <ProductImg src={v.image} size={size} shadow={`0 ${20 * u}px ${24 * u}px rgba(0,0,0,.25)`} />
      </div>
      {String(v.badge ?? "").trim() ? (
        <div style={{ position: "absolute", left: width / 2 + size * 0.22, top: cy - size * 0.55, width: 180 * u, height: 180 * u, borderRadius: "50%", background: v.accentColor, color: v.badgeTextColor, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: font(v.font), fontWeight: 900, fontSize: 38 * u, lineHeight: 1, transform: `scale(${badge * (1 - out)}) rotate(${-12 + Math.sin(t * 3) * 6}deg)` }}>
          {v.badge}
        </div>
      ) : null}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.08, opacity: titleIn * (1 - out) }}>
        <div style={{ fontFamily: font(v.font), fontWeight: 800, fontSize: 64 * u, color: v.textColor, transform: `translateY(${(1 - titleIn) * 30 * u}px)`, textAlign: "center" }}>{v.title}</div>
        {String(v.subtitle ?? "").trim() ? <div style={{ fontFamily: font("inter"), fontSize: 34 * u, color: v.textColor, opacity: 0.7, marginTop: 10 * u }}>{v.subtitle}</div> : null}
      </AbsoluteFill>
    </Background>
  );
};
