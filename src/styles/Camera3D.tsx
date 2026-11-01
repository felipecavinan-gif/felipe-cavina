import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, fitSize } from "./common";
import { font } from "../fonts";

/** Texto em um plano 3D que voa até a câmera, faz um dolly lento e passa pela câmera na saída. */
export const Camera3D: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const u = useUnit();
  const speed = Number(v.speed ?? 1);
  const inEnd = Math.round(32 / speed);
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const pin = interpolate(frame, [0, inEnd], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const drift = interpolate(frame, [inEnd, durationInFrames], [0, 1], clamp);
  const dir = String(v.direction ?? "bottom");
  const rx0 = dir === "bottom" ? 75 : dir === "top" ? -75 : 0;
  const ry0 = dir === "left" ? -80 : dir === "right" ? 80 : 0;
  const persp = 1100 * u;
  const z = interpolate(pin, [0, 1], [-2600 * u, 0]) + drift * 140 * u + out * 700 * u;
  const rx = rx0 * (1 - pin) + interpolate(drift, [0, 1], [6, -4]) * pin;
  const ry = ry0 * (1 - pin) + interpolate(drift, [0, 1], [-8, 8]) * Number(v.orbit ?? 1);
  const blur = (1 - pin) * 18 * u + out * 30 * u;
  const op = Math.min(1, pin * 3) * (1 - out);
  const size = fitSize(Number(v.fontSize ?? 150) * u, String(v.title ?? "").length, width * 0.86, 0.66);
  const plane = (dz: number): React.CSSProperties => ({
    transform: `perspective(${persp}px) translateZ(${z + dz}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
  });
  const glow = v.glow ? `0 0 ${30 * u}px ${v.accentColor}, 0 0 ${80 * u}px ${v.accentColor}88` : "none";

  return (
    <Background v={v}>
      {v.vignette && !v.transparent ? (
        <AbsoluteFill style={{ background: `radial-gradient(circle, ${v.bgColor2 ?? "#1d2233"} 0%, ${v.bgColor} 70%)` }} />
      ) : null}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: op, filter: `blur(${blur}px)` }}>
        <div style={{ ...plane(0), fontFamily: font(v.font), fontWeight: 900, fontSize: size, color: v.textColor, textTransform: v.uppercase ? "uppercase" : "none", letterSpacing: `${v.tracking ?? 0}em`, textAlign: "center", lineHeight: 1, textShadow: glow, whiteSpace: "nowrap" }}>
          {v.title}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: size * 1.6, opacity: op * interpolate(frame, [inEnd - 6, inEnd + 10], [0, 1], clamp) }}>
        <div style={{ ...plane(-120 * u), fontFamily: font(v.subtitleFont ?? "inter"), fontWeight: 600, fontSize: 38 * u, letterSpacing: "0.35em", textTransform: "uppercase", color: v.accentColor, whiteSpace: "nowrap" }}>
          {v.subtitle}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
