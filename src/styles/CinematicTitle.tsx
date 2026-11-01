import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, StyleProps, useUnit, useExit, clamp, easeOut } from "./common";
import { font } from "../fonts";

export const CinematicTitle: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const u = useUnit();
  const exit = useExit(20);
  const p = interpolate(frame, [0, durationInFrames * 0.55], [0, 1], { ...clamp, easing: easeOut });
  const line = interpolate(frame, [10, 40], [0, 1], { ...clamp, easing: easeOut });
  const sub = interpolate(frame, [30, 50], [0, 1], clamp);

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - exit, padding: 80 * u }}>
        <div style={{ width: `${line * 60}%`, height: 2 * u, background: v.accentColor, marginBottom: 40 * u }} />
        <div
          style={{
            fontFamily: font(v.font), fontWeight: 700, fontSize: Number(v.fontSize ?? 110) * u, color: v.textColor,
            letterSpacing: `${interpolate(p, [0, 1], [0.5, 0.12])}em`, textTransform: "uppercase", textAlign: "center",
            opacity: p, filter: `blur(${(1 - p) * 12 * u}px)`, lineHeight: 1.1,
          }}
        >
          {v.title}
        </div>
        <div style={{ width: `${line * 60}%`, height: 2 * u, background: v.accentColor, marginTop: 40 * u }} />
        <div style={{ fontFamily: font(v.subtitleFont ?? "inter"), fontSize: 36 * u, color: v.subtitleColor ?? v.accentColor, marginTop: 30 * u, opacity: sub, letterSpacing: "0.3em", textTransform: "uppercase", textAlign: "center" }}>
          {v.subtitle}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
