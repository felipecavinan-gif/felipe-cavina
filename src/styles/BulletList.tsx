import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, StyleProps, useUnit, useExit, clamp, easeOut } from "./common";
import { font } from "../fonts";

export const BulletList: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const exit = useExit(12);
  const items = [v.item1, v.item2, v.item3, v.item4, v.item5].filter((x) => String(x ?? "").trim());
  const title = interpolate(frame, [0, 15], [0, 1], { ...clamp, easing: easeOut });
  const stagger = Number(v.stagger ?? 12);

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", padding: 120 * u, opacity: 1 - exit }}>
        <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: 84 * u, color: v.textColor, marginBottom: 50 * u, opacity: title, transform: `translateX(${(1 - title) * -60 * u}px)` }}>
          {v.title}
          <div style={{ height: 8 * u, width: `${title * 160 * u}px`, background: v.accentColor, marginTop: 16 * u }} />
        </div>
        {items.map((it, i) => {
          const s = spring({ frame: frame - 14 - i * stagger, fps, config: { damping: 16 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28 * u, marginBottom: 28 * u, opacity: s, transform: `translateX(${(1 - s) * 120 * u}px)` }}>
              <div style={{ flex: "none", width: 56 * u, height: 56 * u, borderRadius: v.numbered ? 12 * u : 99, background: v.accentColor, color: v.bulletTextColor ?? "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font(v.font), fontWeight: 800, fontSize: 30 * u, transform: `scale(${s})` }}>
                {v.numbered ? i + 1 : "✓"}
              </div>
              <div style={{ fontFamily: font(v.font), fontWeight: 600, fontSize: 54 * u, color: v.textColor }}>{it}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Background>
  );
};
