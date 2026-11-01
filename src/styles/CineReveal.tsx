import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, flicker, fitSize } from "./common";
import { LightLeaks } from "./LightLeaks";
import { font } from "../fonts";

/** Abertura de cinema: letterbox, letras saindo do desfoque, flare anamórfico e push-in lento. */
export const CineReveal: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const title = String(v.title ?? "");
  const letters = [...title];
  const stagger = Number(v.stagger ?? 2.5);
  const start = 14;
  const revealEnd = start + letters.length * stagger + 16;
  const push = interpolate(frame, [0, durationInFrames], [1.0, Number(v.push ?? 1.1)]);
  const out = interpolate(frame, [durationInFrames - 20, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const bars = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const barH = v.letterbox ? height * 0.12 * bars : 0;
  const flareT = interpolate(frame, [start, revealEnd + 6], [-0.3, 1.3], clamp);
  const flareOp = interpolate(flareT, [-0.3, 0.4, 1.3], [0, 1, 0], clamp);
  const size = fitSize(Number(v.fontSize ?? 130) * u, letters.length * (1 + Number(v.tracking ?? 0.25)), width * 0.86, 0.7);
  const sub = interpolate(frame, [revealEnd - 6, revealEnd + 14], [0, 1], clamp);
  const exposure = flicker(frame, Number(v.flicker ?? 0), "cine");

  return (
    <Background v={v}>
      {v.leaks && !v.transparent ? <LightLeaks colors={[v.leakA, v.leakB, v.leakA]} strength={0.45} flick={0.3} /> : null}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${push})`, opacity: (1 - out) * exposure, filter: `blur(${out * 16 * u}px)` }}>
        <div style={{ display: "flex", whiteSpace: "nowrap" }}>
          {letters.map((ch, i) => {
            const t = frame - start - i * stagger;
            const p = interpolate(t, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            return (
              <span key={i} style={{ fontFamily: font(v.font), fontWeight: Number(v.weight ?? 700), fontSize: size, color: v.textColor, letterSpacing: `${v.tracking ?? 0.25}em`, textTransform: v.uppercase ? "uppercase" : "none", opacity: p, filter: `blur(${(1 - p) * 22 * u}px)`, transform: `translateY(${(1 - p) * 20 * u}px) scale(${1 + (1 - p) * 0.3})`, display: "inline-block", whiteSpace: "pre", textShadow: `0 0 ${20 * u}px ${v.glowColor ?? "transparent"}` }}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{ fontFamily: font(v.subtitleFont ?? "inter"), fontWeight: 400, fontSize: 32 * u, letterSpacing: "0.45em", textTransform: "uppercase", color: v.accentColor, marginTop: 34 * u, opacity: sub, filter: `blur(${(1 - sub) * 10 * u}px)`, whiteSpace: "nowrap" }}>
          {v.subtitle}
        </div>
      </AbsoluteFill>
      {v.flare ? (
        <AbsoluteFill style={{ justifyContent: "center", opacity: flareOp * (1 - out) }}>
          <div style={{ position: "absolute", left: -width * 0.2, width: width * 1.4, top: height / 2 - 3 * u, height: 6 * u, background: `linear-gradient(90deg, transparent, ${v.flareColor}, transparent)`, filter: `blur(${3 * u}px)`, transform: `translateX(${(flareT - 0.5) * width * 0.3}px)` }} />
          <div style={{ position: "absolute", left: flareT * width - 90 * u, top: height / 2 - 90 * u, width: 180 * u, height: 180 * u, borderRadius: "50%", background: v.flareColor, filter: `blur(${50 * u}px)`, opacity: 0.8 }} />
        </AbsoluteFill>
      ) : null}
      {barH > 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: barH, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: barH, background: "#000" }} />
        </>
      ) : null}
    </Background>
  );
};
