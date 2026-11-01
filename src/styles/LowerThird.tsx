import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, StyleProps, useUnit, clamp, easeOut, fitSize } from "./common";
import { font } from "../fonts";

export const LowerThird: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const u = useUnit();
  const out = durationInFrames - 18;
  const t = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], { ...clamp, easing: easeOut });
  const bar = t(0, 14) - interpolate(frame, [out + 6, out + 18], [0, 1], clamp);
  const name = t(8, 24) - interpolate(frame, [out, out + 10], [0, 1], clamp);
  const role = t(14, 30) - interpolate(frame, [out, out + 10], [0, 1], clamp);
  const right = v.align === "right";
  const pad = Math.min(width, height) * 0.07;

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: right ? "flex-end" : "flex-start", padding: pad, paddingBottom: height * 0.12 }}>
        <div style={{ display: "flex", flexDirection: right ? "row-reverse" : "row", alignItems: "stretch", gap: 22 * u }}>
          <div style={{ width: 12 * u, background: v.accentColor, transform: `scaleY(${bar})`, transformOrigin: "bottom" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: right ? "flex-end" : "flex-start", gap: 10 * u }}>
            <div style={{ overflow: "hidden", background: v.boxColor, padding: `${8 * u}px ${22 * u}px`, clipPath: `inset(0 ${right ? 0 : (1 - bar) * 100}% 0 ${right ? (1 - bar) * 100 : 0}%)` }}>
              <div style={{ fontFamily: font(v.font), fontWeight: 800, fontSize: fitSize(64 * u, String(v.name ?? "").length, width * 0.75, 0.6), color: v.textColor, transform: `translateY(${(1 - name) * 110}%)`, whiteSpace: "nowrap" }}>
                {v.name}
              </div>
            </div>
            <div style={{ overflow: "hidden", background: v.accentColor, padding: `${6 * u}px ${18 * u}px`, clipPath: `inset(0 ${right ? 0 : (1 - role) * 100}% 0 ${right ? (1 - role) * 100 : 0}%)` }}>
              <div style={{ fontFamily: font(v.font), fontWeight: 600, fontSize: fitSize(34 * u, String(v.role ?? "").length, width * 0.75, 0.66), color: v.roleColor, letterSpacing: "0.04em", textTransform: "uppercase", transform: `translateY(${(1 - role) * 110}%)`, whiteSpace: "nowrap" }}>
                {v.role}
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
