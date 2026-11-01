import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing, random } from "remotion";
import { Background, StyleProps, useUnit, clamp, shake, fitSize } from "./common";
import { ProductImg } from "./product";
import { font } from "../fonts";

type Shard = { pts: [number, number][]; cx: number; cy: number };

/** Gera cacos: fatias radiais a partir do ponto de impacto, cortadas em anéis com jitter. */
function makeShards(ix: number, iy: number, slices: number, rings: number): Shard[] {
  const shards: Shard[] = [];
  const radii = Array.from({ length: rings + 1 }, (_, r) => (r === rings ? 160 : (r / rings) ** 1.4 * 110 + (r ? random(`rr${r}`) * 6 : 0)));
  const angles = Array.from({ length: slices }, (_, s) => ((s + random(`sa${s}`) * 0.6) / slices) * Math.PI * 2);
  const pt = (a: number, r: number): [number, number] => [ix + Math.cos(a) * r, iy + Math.sin(a) * r];
  for (let s = 0; s < slices; s++) {
    const a0 = angles[s], a1 = angles[(s + 1) % slices] + (s === slices - 1 ? Math.PI * 2 : 0);
    for (let r = 0; r < rings; r++) {
      const pts = [pt(a0, radii[r]), pt(a1, radii[r]), pt(a1, radii[r + 1]), pt(a0, radii[r + 1])];
      const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
      shards.push({ pts, cx, cy });
    }
  }
  return shards;
}

/** Vidro trinca e estilhaça em 3D revelando o produto e o texto. */
export const GlassShatter: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const m = Math.min(width, height);
  const crackAt = Number(v.crackFrame ?? 8);
  const breakAt = crackAt + Number(v.crackHold ?? 10);
  const shards = React.useMemo(() => makeShards(50, 45, 9, 3), []);
  const persp = 1200 * u;
  const tb = frame - breakAt;
  const sh = shake(frame, frame < breakAt ? crackAt : breakAt, (frame < breakAt ? 8 : 26) * u * Number(v.shake ?? 1), 10);
  const flash = interpolate(tb, [0, 4], [0.8, 0], clamp) * (tb >= 0 ? 1 : 0);
  const crack = interpolate(frame - crackAt, [0, 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const reveal = spring({ frame: tb, fps, config: { damping: 12 } });
  const size = m * Number(v.imageScale ?? 0.55);
  const titleSize = fitSize(Number(v.fontSize ?? 120) * u, String(v.title ?? "").length, width * 0.86, 0.7);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], clamp);
  const glassBg = `linear-gradient(135deg, ${v.glassColor}e6 0%, ${v.glassColor}80 40%, ${v.glassColor}cc 60%, ${v.glassColor}66 100%)`;

  return (
    <Background v={v}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)`, opacity: 1 - out }}>
        {/* o que está atrás do vidro */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 20 * u }}>
          <div style={{ transform: `scale(${tb < 0 ? 0.85 : 0.85 + 0.15 * reveal}) translateY(${Math.sin(frame / 15) * 8 * u}px)` }}>
            <ProductImg src={v.image} size={size} shadow={`0 ${24 * u}px ${30 * u}px rgba(0,0,0,.35)`} />
          </div>
          <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: titleSize, color: v.textColor, textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1, opacity: tb < 0 ? 0 : Math.min(1, reveal * 1.5), transform: `scale(${tb < 0 ? 2 : interpolate(tb, [0, 6], [1.8, 1], { ...clamp, easing: Easing.out(Easing.cubic) })})`, filter: `blur(${interpolate(tb, [0, 6], [14 * u, 0], clamp)}px)` }}>
            {v.title}
          </div>
          {String(v.subtitle ?? "").trim() ? <div style={{ fontFamily: font("inter"), fontWeight: 600, fontSize: 38 * u, color: v.accentColor, letterSpacing: "0.15em", textTransform: "uppercase", opacity: interpolate(tb, [8, 18], [0, 1], clamp) }}>{v.subtitle}</div> : null}
        </AbsoluteFill>
        {/* vidro inteiro antes de quebrar (uma camada só: leve para renderizar) */}
        {tb < 0 ? <AbsoluteFill style={{ background: glassBg }} /> : null}
        {/* cacos: cada um ocupa só a própria área, para o render ficar rápido */}
        {tb >= 0
          ? shards.map((s, i) => {
              const dir = Math.atan2(s.cy - 45, s.cx - 50);
              const dist = Math.hypot(s.cx - 50, s.cy - 45);
              const delay = dist * 0.04;
              const p = interpolate(tb - delay, [0, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
              if (p >= 1) return null;
              const xs = s.pts.map((q) => q[0]), ys = s.pts.map((q) => q[1]);
              const x0 = Math.max(0, Math.min(...xs)), x1 = Math.min(100, Math.max(...xs));
              const y0 = Math.max(0, Math.min(...ys)), y1 = Math.min(100, Math.max(...ys));
              if (x1 <= x0 || y1 <= y0) return null;
              const bw = x1 - x0, bh = y1 - y0;
              const poly = s.pts.map(([x, y]) => `${((x - x0) / bw) * 100}% ${((y - y0) / bh) * 100}%`).join(", ");
              const sp = (0.6 + random(`sv${i}`) * 0.8) * Number(v.force ?? 1);
              const dx = Math.cos(dir) * p * width * 0.7 * sp;
              const dy = Math.sin(dir) * p * height * 0.6 * sp + p * p * height * 0.5;
              const dz = p * (200 + random(`sz${i}`) * 900) * u;
              const rot = p * (random(`sr${i}`) - 0.5) * 540;
              const light = 0.55 + random(`sl${i}`) * 0.4;
              return (
                <div key={i} style={{ position: "absolute", left: `${x0}%`, top: `${y0}%`, width: `${bw}%`, height: `${bh}%`, clipPath: `polygon(${poly})`, background: `linear-gradient(${Math.round(random(`sg${i}`) * 180)}deg, ${v.glassColor}${Math.round(light * 255).toString(16).padStart(2, "0")}, ${v.glassColor}55)`, transform: `translate(${dx}px, ${dy}px) scale(${persp / Math.max(persp - dz, persp * 0.2)}) rotate(${rot * 0.5}deg) scale(${Math.cos((rot * Math.PI) / 180)}, ${Math.cos((rot * 0.7 * Math.PI) / 180)})`, opacity: 1 - p * 0.6 }} />
              );
            })
          : null}
        {/* trincas antes de quebrar */}
        {tb < 0 && frame >= crackAt
          ? Array.from({ length: 11 }).map((_, i) => {
              const a = (i / 11) * 360 + random(`ca${i}`) * 20;
              const len = m * (0.3 + random(`cl${i}`) * 0.6) * crack;
              return <div key={`c${i}`} style={{ position: "absolute", left: width * 0.5, top: height * 0.45, width: len, height: 3 * u, background: v.crackColor, transformOrigin: "0 50%", transform: `rotate(${a}deg)`, boxShadow: `0 0 ${6 * u}px ${v.crackColor}` }} />;
            })
          : null}
        {tb < 0 && frame >= crackAt ? <div style={{ position: "absolute", left: width * 0.5 - 30 * u, top: height * 0.45 - 30 * u, width: 60 * u, height: 60 * u, borderRadius: "50%", border: `${4 * u}px solid ${v.crackColor}`, transform: `scale(${crack})` }} /> : null}
        {tb < 0 && v.teaser ? (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontFamily: font(v.font), fontWeight: 800, fontSize: 60 * u, color: v.teaserColor ?? "#111", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: m * 0.6 }}>{v.teaser}</div>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
    </Background>
  );
};
