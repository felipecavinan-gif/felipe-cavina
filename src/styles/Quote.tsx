import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, StyleProps, useUnit, useExit, clamp, parseWords } from "./common";
import { font } from "../fonts";

export const Quote: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const exit = useExit(15);
  const words = parseWords(v.quote);
  const mark = spring({ frame, fps, config: { damping: 10 } });
  const authorAt = 10 + words.length * 3;
  const author = interpolate(frame, [authorAt, authorAt + 15], [0, 1], clamp);

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 130 * u, opacity: 1 - exit }}>
        <div style={{ fontFamily: font("playfair"), fontSize: 260 * u, lineHeight: 0.6, height: 120 * u, color: v.accentColor, transform: `scale(${mark}) rotate(${(1 - mark) * -30}deg)` }}>“</div>
        <div style={{ fontFamily: font(v.font), fontStyle: v.italic ? "italic" : "normal", fontSize: Number(v.fontSize ?? 70) * u, color: v.textColor, textAlign: "center", lineHeight: 1.3 }}>
          {words.map((w, i) => {
            const o = interpolate(frame, [10 + i * 3, 20 + i * 3], [0, 1], clamp);
            return (
              <span key={i} style={{ opacity: o, color: w.accent ? v.accentColor : undefined, display: "inline-block", marginRight: "0.25em", filter: `blur(${(1 - o) * 6}px)` }}>
                {w.word}
              </span>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 * u, marginTop: 50 * u, opacity: author }}>
          <div style={{ height: 3 * u, width: 80 * u * author, background: v.accentColor }} />
          <div style={{ fontFamily: font("inter"), fontWeight: 600, fontSize: 40 * u, color: v.authorColor ?? v.textColor, letterSpacing: "0.08em", textTransform: "uppercase" }}>{v.author}</div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
