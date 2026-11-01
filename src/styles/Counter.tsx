import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, useExit, clamp, fitSize } from "./common";
import { font } from "../fonts";

export const Counter: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width } = useVideoConfig();
  const u = useUnit();
  const exit = useExit(12);
  const target = Number(v.value) || 0;
  const start = Number(v.startValue ?? 0) || 0;
  const decimals = Math.max(0, Math.min(3, Number(v.decimals ?? 0)));
  const p = interpolate(frame, [5, durationInFrames * 0.6], [0, 1], { ...clamp, easing: Easing.out(Easing.exp) });
  const n = start + (target - start) * p;
  const txt = n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const pop = spring({ frame, fps, config: { damping: 14 } });
  const finalTxt = `${v.prefix ?? ""}${target.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${v.suffix ?? ""}`;
  const size = fitSize(Number(v.fontSize ?? 260) * u, finalTxt.length, width * 0.88, 0.62);
  const label = interpolate(frame, [15, 30], [0, 1], clamp);

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - exit, transform: `scale(${pop * (1 + exit * 0.1)})` }}>
        <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: size, color: v.textColor, fontVariantNumeric: "tabular-nums", lineHeight: 1, whiteSpace: "nowrap" }}>
          <span style={{ color: v.accentColor }}>{v.prefix}</span>
          {txt}
          <span style={{ color: v.accentColor }}>{v.suffix}</span>
        </div>
        <div style={{ height: 10 * u, width: 400 * u, background: `${v.textColor}33`, marginTop: 30 * u, borderRadius: 99 }}>
          <div style={{ height: "100%", width: `${p * 100}%`, background: v.accentColor, borderRadius: 99 }} />
        </div>
        <div style={{ fontFamily: font(v.font), fontWeight: 600, fontSize: 48 * u, color: v.textColor, marginTop: 30 * u, opacity: label, transform: `translateY(${(1 - label) * 20}px)`, textAlign: "center", maxWidth: "85%" }}>
          {v.label}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
