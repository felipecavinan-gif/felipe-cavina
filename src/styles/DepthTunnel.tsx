import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, splitList, fitSize } from "./common";
import { font } from "../fonts";

/** Câmera atravessa um túnel; cada palavra fica em uma profundidade com desfoque de foco (depth of field). */
export const DepthTunnel: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const u = useUnit();
  const words = splitList(v.words);
  const n = Math.max(1, words.length);
  const D = 1400 * u;
  const persp = 900 * u;
  const cam = interpolate(frame, [4, durationInFrames * 0.82], [-D * 0.9, (n - 1) * D], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], clamp);
  const camZ = cam + exit * D * 0.7;
  const longest = Math.max(...words.map((w) => w.length), 1);
  const size = fitSize(Number(v.fontSize ?? 160) * u, longest, width * 0.8, 0.7);
  const ringCount = n * 3 + 6;
  const ringStep = D / 2.5;
  const rw = width * 0.92, rh = height * 0.86;

  const project = (zWorld: number) => {
    const z = zWorld + camZ;
    return { z, visible: z < persp * 0.85 && z > -D * 5 };
  };

  return (
    <Background v={v}>
      <AbsoluteFill>
        {Array.from({ length: ringCount }).map((_, j) => {
          const k = ringCount - 1 - j; // longe primeiro, perto por cima
          const { z, visible } = project(-k * ringStep + D * 0.9);
          if (!visible) return null;
          const fade = interpolate(z, [-D * 5, -D * 2, 0, persp * 0.8], [0, 0.9, 0.9, 0], clamp);
          return (
            <div key={k} style={{ position: "absolute", left: (width - rw) / 2, top: (height - rh) / 2, width: rw, height: rh, border: `${3 * u}px solid ${k % 3 === 0 ? v.accentColor : v.ringColor}`, borderRadius: Number(v.ringRadius ?? 0) * u, opacity: fade, transform: `perspective(${persp}px) translateZ(${z}px) rotateZ(${k * Number(v.twist ?? 0)}deg)` }} />
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {words.map((_, j) => {
          const i = n - 1 - j; // longe primeiro, perto por cima
          const w = words[i];
          const { z, visible } = project(-i * D);
          if (!visible) return null;
          const op = interpolate(z, [-D * 3, -D * 0.8, 0, persp * 0.6], [0, 1, 1, 0], clamp);
          const blur = Math.min(40, (Math.abs(z) / D) * 14) * u;
          return (
            <div key={i} style={{ position: "absolute", fontFamily: font(v.font), fontWeight: 900, fontSize: size, color: i === n - 1 ? v.accentColor : v.textColor, textTransform: v.uppercase ? "uppercase" : "none", whiteSpace: "nowrap", opacity: op, filter: `blur(${blur}px)`, transform: `perspective(${persp}px) translateZ(${z}px)`, textShadow: `0 0 ${24 * u}px ${v.accentColor}66` }}>
              {w}
            </div>
          );
        })}
      </AbsoluteFill>
    </Background>
  );
};
