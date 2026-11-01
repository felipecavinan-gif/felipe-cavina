import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { flicker, noise } from "./common";

/** Normaliza #rgb/#rrggbbaa para #rrggbb (para poder anexar alfa). */
function solid(c: string) {
  const h = String(c).replace("#", "");
  if (h.length === 3) return "#" + h.split("").map((x) => x + x).join("");
  return "#" + h.slice(0, 6);
}

/** Vazamentos de luz: orbes coloridas muito desfocadas, derivando e piscando de leve. */
export const LightLeaks: React.FC<{ colors: string[]; strength?: number; flick?: number; seed?: string }> = ({ colors, strength = 0.7, flick = 0.25, seed = "leak" }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const m = Math.max(width, height);
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: strength * flicker(frame / 2, flick, seed) }}>
      {colors.map((c, i) => {
        const t = frame / fps;
        const sx = noise(`${seed}x`, i), sy = noise(`${seed}y`, i);
        const x = (sx + Math.sin(t * (0.3 + sx * 0.4) + i) * 0.25) * width;
        const y = (sy + Math.cos(t * (0.25 + sy * 0.3) + i * 2) * 0.2) * height;
        const r = m * (0.25 + noise(`${seed}r`, i) * 0.2);
        // Gradiente radial em vez de blur: mesmo visual suave e bem mais leve para renderizar.
        return <div key={i} style={{ position: "absolute", left: x - r * 1.4, top: y - r * 1.4, width: r * 2.8, height: r * 2.8, background: `radial-gradient(circle, ${solid(c)} 0%, ${solid(c)}99 25%, ${solid(c)}00 60%)`, opacity: 0.85 }} />;
      })}
    </AbsoluteFill>
  );
};
