import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Background, StyleProps, useUnit, useExit, parseWords, clamp } from "./common";
import { font } from "../fonts";

export const KineticWords: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const exit = useExit(10);
  const words = parseWords(v.text);
  const gap = Number(v.wordDelay ?? 5);
  const size = Number(v.fontSize ?? 120) * u;

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 90 * u }}>
        <div
          style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${0.1 * size}px ${0.28 * size}px`,
            fontFamily: font(v.font), fontWeight: 900, fontSize: size, lineHeight: 1,
            textTransform: v.uppercase ? "uppercase" : "none", textAlign: "center",
            transform: `scale(${1 - exit * 0.15})`, opacity: 1 - exit,
          }}
        >
          {words.map((w, i) => {
            const s = spring({ frame: frame - i * gap, fps, config: { damping: 12, stiffness: 180 } });
            const y = interpolate(s, [0, 1], [0.6 * size, 0]);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  color: w.accent ? v.accentColor : v.textColor,
                  transform: `translateY(${y}px) scale(${interpolate(s, [0, 1], [0.6, 1])})`,
                  opacity: interpolate(frame - i * gap, [0, 4], [0, 1], clamp),
                  background: w.accent && v.accentBox ? v.accentBoxColor : undefined,
                  padding: w.accent && v.accentBox ? `0 ${0.12 * size}px` : undefined,
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
