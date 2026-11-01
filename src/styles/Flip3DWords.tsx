import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, splitList, fitSize } from "./common";
import { font } from "../fonts";

/** Palavras trocando como faces de um cubo 3D girando. */
export const Flip3DWords: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const u = useUnit();
  const words = splitList(v.words);
  const n = Math.max(1, words.length);
  const seg = (durationInFrames - 10) / n;
  const turn = Math.min(14, seg * 0.45);
  const ease = Easing.bezier(0.7, 0, 0.2, 1);
  const longest = Math.max(...words.map((w) => w.length), 1);
  const size = fitSize(Number(v.fontSize ?? 150) * u, longest + String(v.prefix ?? "").length * 0.6, width * 0.85, 0.7);
  const h = size * 1.25;
  const persp = 900 * u;
  const intro = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: v.stacked ? "column" : "row", gap: 0.3 * size, opacity: intro }}>
        {v.prefix ? (
          <div style={{ fontFamily: font(v.font), fontWeight: 800, fontSize: size * (v.stacked ? 0.5 : 1), color: v.textColor, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none" }}>{v.prefix}</div>
        ) : null}
        <div style={{ position: "relative", height: h, minWidth: longest * size * 0.66 }}>
          {words.map((w, i) => {
            const start = i * seg;
            const tin = i === 0 ? 1 : interpolate(frame, [start - turn / 2, start + turn / 2], [0, 1], { ...clamp, easing: ease });
            const tout = i === n - 1 ? 0 : interpolate(frame, [start + seg - turn / 2, start + seg + turn / 2], [0, 1], { ...clamp, easing: ease });
            if (tin <= 0 || tout >= 1) return null;
            const angle = (1 - tin) * -90 + tout * 90;
            const y = (1 - tin) * h * 0.5 - tout * h * 0.5;
            const shade = Math.abs(angle) / 90;
            return (
              <div key={i} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: v.stacked ? "center" : "flex-start", transform: `perspective(${persp}px) translateY(${y}px) translateZ(${-h / 2}px) rotateX(${angle}deg) translateZ(${h / 2}px)`, opacity: 1 - shade * 0.7 }}>
                <span style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: size, lineHeight: 1, color: v.wordColor, background: v.boxColor, padding: `0 ${0.15 * size}px`, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none", filter: `blur(${shade * 6 * u}px)` }}>
                  {w}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
