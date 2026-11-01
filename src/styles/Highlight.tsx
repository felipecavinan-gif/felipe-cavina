import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, StyleProps, useUnit, useExit, clamp, easeOut } from "./common";
import { font } from "../fonts";

export const Highlight: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const exit = useExit(12);
  const textIn = interpolate(frame, [0, 15], [0, 1], { ...clamp, easing: easeOut });
  const mark = interpolate(frame, [18, 34], [0, 1], { ...clamp, easing: easeOut });
  const size = Number(v.fontSize ?? 96) * u;
  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 110 * u, opacity: (1 - exit) * textIn, transform: `translateY(${(1 - textIn) * 30 * u}px)` }}>
        <div style={{ fontFamily: font(v.font), fontWeight: 800, fontSize: size, color: v.textColor, textAlign: "center", lineHeight: 1.35 }}>
          {v.before}{" "}
          <span style={{ position: "relative", display: "inline-block", color: mark > 0.5 ? v.highlightTextColor : v.textColor }}>
            <span style={{ position: "absolute", left: "-0.1em", right: "-0.1em", top: v.markStyle === "underline" ? "70%" : "8%", bottom: "4%", background: v.accentColor, transform: `scaleX(${mark}) rotate(-1deg)`, transformOrigin: "left", borderRadius: "0.08em", zIndex: 0 }} />
            <span style={{ position: "relative" }}>{v.highlight}</span>
          </span>{" "}
          {v.after}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
