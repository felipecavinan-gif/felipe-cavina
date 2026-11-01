import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background, StyleProps, useUnit, useExit } from "./common";
import { font } from "../fonts";

export const Typewriter: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const exit = useExit(10);
  const text = String(v.text ?? "");
  const cps = Math.max(0.2, Number(v.speed ?? 1)); // caracteres por frame
  const shown = Math.min(text.length, Math.floor(Math.max(0, frame - 6) * cps));
  const typing = shown < text.length;
  const cursorOn = typing || Math.floor(frame / 15) % 2 === 0;

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: v.align === "left" ? "flex-start" : "center", padding: 110 * u, opacity: 1 - exit }}>
        {v.prompt ? (
          <div style={{ fontFamily: font(v.font), fontSize: 36 * u, color: v.accentColor, marginBottom: 20 * u }}>{v.prompt}</div>
        ) : null}
        <div style={{ fontFamily: font(v.font), fontWeight: 700, fontSize: Number(v.fontSize ?? 90) * u, color: v.textColor, whiteSpace: "pre-wrap", textAlign: v.align === "left" ? "left" : "center", lineHeight: 1.2 }}>
          {text.slice(0, shown)}
          <span style={{ display: "inline-block", width: "0.08em", height: "1em", marginLeft: "0.06em", verticalAlign: "-0.12em", background: v.accentColor, opacity: cursorOn ? 1 : 0 }} />
        </div>
      </AbsoluteFill>
    </Background>
  );
};
