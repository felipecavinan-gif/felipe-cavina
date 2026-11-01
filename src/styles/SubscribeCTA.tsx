import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp } from "./common";
import { font } from "../fonts";

export const SubscribeCTA: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  const chars = String(v.channelName ?? "").length + String(v.buttonText ?? "").length;
  const u = Math.min(useUnit(), (width * 0.92) / (chars * 26 + 380 + (v.showBell ? 80 : 0)));
  const clickAt = 38;
  const inS = spring({ frame, fps, config: { damping: 13 } });
  const outS = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.back(2)) });
  const clicked = frame >= clickAt;
  const press = frame >= clickAt - 2 && frame < clickAt + 4 ? 0.92 : 1;
  const cur = interpolate(frame, [12, clickAt - 2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cursorOut = interpolate(frame, [clickAt + 10, clickAt + 22], [0, 1], clamp);
  const bell = clicked ? Math.sin((frame - clickAt) * 1.2) * 20 * Math.max(0, 1 - (frame - clickAt) / 25) : 0;
  const bellIn = spring({ frame: frame - clickAt, fps, config: { damping: 10 } });

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${inS * (1 - outS)})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 * u, background: v.cardColor, padding: `${22 * u}px ${28 * u}px`, borderRadius: 999, boxShadow: `0 ${10 * u}px ${40 * u}px rgba(0,0,0,.35)` }}>
          <div style={{ width: 90 * u, height: 90 * u, borderRadius: 99, background: v.accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font(v.font), fontWeight: 900, fontSize: 44 * u, color: "#fff" }}>
            {String(v.channelName ?? "").replace(/^[@#\s]+/, "").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ fontFamily: font(v.font), fontWeight: 800, fontSize: 44 * u, color: v.textColor, whiteSpace: "nowrap" }}>{v.channelName}</div>
          <div style={{ position: "relative", fontFamily: font(v.font), fontWeight: 800, fontSize: 36 * u, color: "#fff", background: clicked ? "#6b6b6b" : v.accentColor, padding: `${18 * u}px ${36 * u}px`, borderRadius: 999, transform: `scale(${press})`, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {clicked ? v.doneText : v.buttonText}
            <div style={{ position: "absolute", left: `${interpolate(cur, [0, 1], [180, 50])}%`, top: `${interpolate(cur, [0, 1], [220, 55])}%`, opacity: (cur > 0 ? 1 : 0) * (1 - cursorOut), width: 0, height: 0 }}>
              <svg width={48 * u} height={48 * u} viewBox="0 0 24 24" style={{ transform: `scale(${press})` }}>
                <path d="M4 2l16 10-7 1.5L10 21z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {v.showBell ? (
            <div style={{ transform: `scale(${clicked ? bellIn : 0}) rotate(${bell}deg)`, transformOrigin: "50% 10%" }}>
              <svg width={56 * u} height={56 * u} viewBox="0 0 24 24">
                <path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3a1.5 1.5 0 0 0-3 0v1.2A7 7 0 0 0 5 11v5l-2 2v1h18v-1z" fill={v.textColor} />
              </svg>
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
