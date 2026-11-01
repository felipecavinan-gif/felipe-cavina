import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { StyleProps, useUnit, clamp, flicker, splitList, fitSize } from "./common";
import { LightLeaks } from "./LightLeaks";
import { font } from "../fonts";

/** Trailer: frases curtas entre cortes no preto, flashes, push-in e título final com luz. */
export const Trailer: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const cards = [...splitList(v.lines), String(v.finalTitle ?? "")].filter(Boolean);
  const n = cards.length;
  const finalLen = Math.round(durationInFrames * 0.36);
  const segLen = (durationInFrames - finalLen) / Math.max(1, n - 1);
  const idx = frame >= durationInFrames - finalLen ? n - 1 : Math.min(n - 2, Math.floor(frame / segLen));
  const segStart = idx === n - 1 ? durationInFrames - finalLen : idx * segLen;
  const segEnd = idx === n - 1 ? durationInFrames : segStart + segLen;
  const t = frame - segStart;
  const isFinal = idx === n - 1;
  const fadeIn = interpolate(t, [0, isFinal ? 14 : 8], [0, 1], clamp);
  const fadeOut = interpolate(frame, [segEnd - (isFinal ? 14 : 7), segEnd - 2], [1, 0], clamp);
  const flick = t < 6 ? flicker(frame, 0.8, `tr${idx}`) : flicker(frame, Number(v.flicker ?? 0.06), "trh");
  const push = interpolate(t, [0, segEnd - segStart], [1, isFinal ? 1.08 : 1.12], { easing: Easing.out(Easing.quad) });
  const flash = v.flash && t >= 0 && t < 3 ? interpolate(t, [0, 3], [0.9, 0]) : 0;
  const text = cards[idx] ?? "";
  const size = fitSize(Number(isFinal ? v.finalSize ?? 160 : v.fontSize ?? 70) * u, text.length * (isFinal ? 1.2 : 1.3), width * 0.86, 0.66);

  return (
    <AbsoluteFill style={{ background: v.bgColor }}>
      {isFinal && v.leaks ? <LightLeaks colors={[v.leakA, v.leakB]} strength={0.55 * fadeIn * fadeOut} flick={0.35} /> : null}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fadeIn * fadeOut * flick, transform: `scale(${push})` }}>
        <div style={{ fontFamily: font(isFinal ? v.font : v.lineFont ?? v.font), fontWeight: isFinal ? 700 : 400, fontSize: size, color: isFinal ? v.finalColor : v.textColor, letterSpacing: isFinal ? "0.2em" : "0.3em", textTransform: "uppercase", textAlign: "center", whiteSpace: "nowrap", filter: `blur(${(1 - fadeIn) * 14 * u}px)`, textShadow: isFinal ? `0 0 ${40 * u}px ${v.leakA}aa` : "none" }}>
          {text}
        </div>
        {isFinal && v.date ? (
          <div style={{ fontFamily: font("inter"), fontSize: 30 * u, letterSpacing: "0.6em", color: v.textColor, marginTop: 30 * u, opacity: interpolate(t, [16, 30], [0, 1], clamp), textTransform: "uppercase" }}>{v.date}</div>
        ) : null}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};
