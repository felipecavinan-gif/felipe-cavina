import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, useExit, clamp, fitSize } from "./common";
import { font } from "../fonts";

const Line: React.FC<{ text: string; delay: number; v: any; size: number; color: string }> = ({ text, delay, v, size: base, color }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const size = fitSize(base, String(text ?? "").length, width * 0.82, v.uppercase ? 0.72 : 0.6);
  const ease = Easing.bezier(0.77, 0, 0.18, 1);
  const a = interpolate(frame - delay, [0, 14], [0, 1], { ...clamp, easing: ease });
  const b = interpolate(frame - delay, [14, 28], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ position: "relative", display: "inline-block", alignSelf: v.align === "left" ? "flex-start" : "center" }}>
      <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: size, lineHeight: 1.05, color, opacity: b > 0 ? 1 : 0, textTransform: v.uppercase ? "uppercase" : "none", padding: "0 0.08em", whiteSpace: "nowrap" }}>
        {text}
      </div>
      <div style={{ position: "absolute", inset: 0, background: v.accentColor, transformOrigin: b > 0 ? "right" : "left", transform: `scaleX(${b > 0 ? 1 - b : a})` }} />
    </div>
  );
};

export const BlockReveal: React.FC<StyleProps> = ({ v }) => {
  const u = useUnit();
  const exit = useExit(12);
  const size = Number(v.fontSize ?? 130) * u;
  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: v.align === "left" ? "flex-start" : "center", flexDirection: "column", padding: 110 * u, gap: 14 * u, opacity: 1 - exit, transform: `translateY(${exit * -40 * u}px)` }}>
        <Line text={v.line1} delay={0} v={v} size={size} color={v.textColor} />
        {String(v.line2 ?? "").trim() ? <Line text={v.line2} delay={8} v={v} size={size} color={v.secondColor ?? v.textColor} /> : null}
        {String(v.line3 ?? "").trim() ? <Line text={v.line3} delay={16} v={v} size={size * 0.45} color={v.textColor} /> : null}
      </AbsoluteFill>
    </Background>
  );
};
