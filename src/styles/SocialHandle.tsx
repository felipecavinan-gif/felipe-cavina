import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, StyleProps, useUnit, useExit, clamp } from "./common";
import { font } from "../fonts";

const PLATFORM_COLOR: Record<string, string> = {
  instagram: "#E1306C", youtube: "#FF0000", tiktok: "#111111", x: "#000000", linkedin: "#0A66C2", twitch: "#9146FF",
};
const PLATFORM_LABEL: Record<string, string> = {
  instagram: "IG", youtube: "YT", tiktok: "TT", x: "X", linkedin: "in", twitch: "TV",
};

export const SocialHandle: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const exit = useExit(12);
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const widen = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const txt = interpolate(frame, [14, 24], [0, 1], clamp);
  const pos: Record<string, React.CSSProperties> = {
    center: { justifyContent: "center", alignItems: "center" },
    "bottom-left": { justifyContent: "flex-end", alignItems: "flex-start" },
    "bottom-right": { justifyContent: "flex-end", alignItems: "flex-end" },
    "top-left": { justifyContent: "flex-start", alignItems: "flex-start" },
  };
  const color = v.useBrandColor ? PLATFORM_COLOR[v.platform] ?? v.accentColor : v.accentColor;

  return (
    <Background v={v}>
      <AbsoluteFill style={{ ...(pos[v.position] ?? pos.center), padding: 80 * u }}>
        <div style={{ display: "flex", alignItems: "center", background: v.cardColor, borderRadius: 999, padding: 12 * u, paddingRight: 12 * u + widen * 30 * u, transform: `scale(${pop * (1 - exit)})`, boxShadow: `0 ${8 * u}px ${30 * u}px rgba(0,0,0,.3)` }}>
          <div style={{ width: 90 * u, height: 90 * u, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: font("montserrat"), fontWeight: 900, fontSize: 36 * u }}>
            {PLATFORM_LABEL[v.platform] ?? "@"}
          </div>
          <div style={{ maxWidth: `${widen * 900 * u}px`, overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: font(v.font), fontWeight: 800, fontSize: 48 * u, color: v.textColor, paddingLeft: 24 * u, opacity: txt }}>{v.handle}</div>
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
