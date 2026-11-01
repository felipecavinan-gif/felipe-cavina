import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing, random } from "remotion";
import { StyleProps, useUnit, clamp, noise, fitSize } from "./common";
import { LightLeaks } from "./LightLeaks";
import { font } from "../fonts";

type BgProps = { v: any; frame: number; u: number };

const Blobs: React.FC<BgProps> = ({ v }) => <LightLeaks colors={[v.color1, v.color2, v.color3, v.color1]} strength={1} flick={0} seed="blob" />;

/** Bokeh / partículas subindo em várias profundidades (as mais próximas mais desfocadas). */
const Particles: React.FC<BgProps> = ({ v, frame, u }) => {
  const { width, height, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {Array.from({ length: 34 }).map((_, i) => {
        const depth = random(`pd${i}`);
        const r = (6 + depth * 46) * u;
        const speed = (20 + depth * 90) * u;
        const y = ((random(`py${i}`) * (height + 200 * u) - (frame / fps) * speed) % (height + 200 * u) + height + 200 * u) % (height + 200 * u) - 100 * u;
        const x = random(`px${i}`) * width + Math.sin(frame / 30 + i) * 20 * u;
        const c = [v.color1, v.color2, v.color3][i % 3];
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: "50%", background: c, opacity: 0.25 + (1 - Math.abs(depth - 0.4)) * 0.5, filter: `blur(${Math.abs(depth - 0.35) * 22 * u}px)` }} />;
      })}
    </AbsoluteFill>
  );
};

/** Formas geométricas flutuando e girando com profundidade. */
const Shapes: React.FC<BgProps> = ({ v, frame, u }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const depth = random(`sd${i}`);
        const s = (50 + depth * 170) * u;
        const kind = i % 3;
        const c = [v.color1, v.color2, v.color3][i % 3];
        const pop = spring({ frame: frame - i * 2, fps: 30, config: { damping: 12 } });
        const x = random(`sx${i}`) * width + Math.sin(frame / (40 + i * 3) + i) * 40 * u * (1 + depth);
        const y = random(`sy${i}`) * height + Math.cos(frame / (50 + i * 2) + i) * 50 * u * (1 + depth);
        const rot = frame * (0.4 + depth) * (i % 2 ? 1 : -1);
        const style: React.CSSProperties = { position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, transform: `perspective(${800 * u}px) rotate(${rot}deg) rotateX(${rot * 0.7}deg) scale(${pop})`, filter: `blur(${depth > 0.7 ? (depth - 0.7) * 30 * u : 0}px)`, opacity: 0.85 };
        if (kind === 0) return <div key={i} style={{ ...style, borderRadius: "50%", border: `${10 * u}px solid ${c}` }} />;
        if (kind === 1) return <div key={i} style={{ ...style, background: c, borderRadius: 14 * u }} />;
        return <div key={i} style={{ ...style, width: s * 1.4, height: s * 0.28, background: c, borderRadius: 999 }} />;
      })}
    </AbsoluteFill>
  );
};

/** Grade tech com linha de varredura e cantoneiras de HUD. */
const Grid: React.FC<BgProps> = ({ v, frame, u }) => {
  const { width, height, durationInFrames } = useVideoConfig();
  const step = 90 * u;
  const off = (frame * 0.8 * u) % step;
  const scan = ((frame / durationInFrames) * 1.6 % 1) * height;
  const cols = Math.ceil(width / step) + 2, rows = Math.ceil(height / step) + 2;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {Array.from({ length: cols }).map((_, i) => <div key={`c${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: i * step - off, width: 1.5 * u, background: v.color1, opacity: 0.18 }} />)}
      {Array.from({ length: rows }).map((_, i) => <div key={`r${i}`} style={{ position: "absolute", left: 0, right: 0, top: i * step - off, height: 1.5 * u, background: v.color1, opacity: 0.18 }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, top: scan - 80 * u, height: 80 * u, background: `linear-gradient(180deg, transparent, ${v.color2}55)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: scan, height: 3 * u, background: v.color2, boxShadow: `0 0 ${20 * u}px ${v.color2}` }} />
      {Array.from({ length: 8 }).map((_, i) => {
        const on = noise(`gb${i}`, Math.floor(frame / 6)) > 0.5;
        return <div key={`b${i}`} style={{ position: "absolute", left: Math.floor(random(`gx${i}`) * cols) * step - off, top: Math.floor(random(`gy${i}`) * rows) * step - off, width: step, height: step, background: v.color3, opacity: on ? 0.25 : 0 }} />;
      })}
    </AbsoluteFill>
  );
};

/** Confete explodindo do centro e caindo com rotação 3D. */
const Confetti: React.FC<BgProps> = ({ v, frame, u }) => {
  const { width, height, fps } = useVideoConfig();
  const t = Math.max(0, frame - 6) / fps;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {Array.from({ length: 90 }).map((_, i) => {
        const ang = random(`ca${i}`) * Math.PI * 2;
        const sp = (500 + random(`cs${i}`) * 1300) * u;
        const x = width / 2 + Math.cos(ang) * sp * t * Math.exp(-t * 1.2);
        const y = height * 0.5 + Math.sin(ang) * sp * t * Math.exp(-t * 1.2) - 200 * u * t + 520 * u * t * t;
        const w = (12 + random(`cw${i}`) * 18) * u;
        const c = [v.color1, v.color2, v.color3, "#ffffff"][i % 4];
        const spin = t * 600 * (random(`cr${i}`) - 0.5);
        if (frame < 6) return null;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: w * 0.5, background: c, borderRadius: i % 5 === 0 ? "50%" : 2 * u, transform: `perspective(${600 * u}px) rotate(${spin}deg) rotateX(${spin * 2}deg)` }} />;
      })}
    </AbsoluteFill>
  );
};

/** Faixas diagonais deslizando em loop. */
const Stripes: React.FC<BgProps> = ({ v, frame }) => {
  const { width, height } = useVideoConfig();
  const d = Math.hypot(width, height);
  const w = d / 18;
  const move = (frame * 3) % (w * 3);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: (width - d * 1.6) / 2, top: (height - d * 1.6) / 2, width: d * 1.6, height: d * 1.6, transform: `rotate(35deg) translateX(${move}px)` }}>
        {Array.from({ length: 30 }).map((_, i) => <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: i * w * 3 - w * 3, width: w, background: [v.color1, v.color2, v.color3][i % 3], opacity: 0.9 }} />)}
      </div>
    </AbsoluteFill>
  );
};

const BACKGROUNDS: Record<string, React.FC<BgProps>> = { blobs: Blobs, particles: Particles, shapes: Shapes, grid: Grid, confetti: Confetti, stripes: Stripes };

/** Cena com fundo animado (bolhas, partículas, formas, grade, confete, faixas) e texto por cima. */
export const BackgroundScene: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const Bg = BACKGROUNDS[v.background] ?? Blobs;
  const pop = spring({ frame: frame - 8, fps, config: { damping: 13 } });
  const sub = interpolate(frame, [18, 32], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [0, 1], clamp);
  const size = fitSize(Number(v.fontSize ?? 130) * u, String(v.title ?? "").length, width * (v.card ? 0.72 : 0.86), 0.66);

  return (
    <AbsoluteFill style={{ background: v.bgColor }}>
      <Bg v={v} frame={frame} u={u} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - out, transform: `scale(${1 + out * 0.08})`, filter: `blur(${out * 12 * u}px)` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: v.card ? `${50 * u}px ${70 * u}px` : 0, background: v.card ? v.cardColor : "transparent", borderRadius: 28 * u, border: v.card ? `${2 * u}px solid rgba(255,255,255,.35)` : "none", boxShadow: v.card ? `0 ${20 * u}px ${60 * u}px rgba(0,0,0,.25)` : "none", transform: `scale(${pop})` }}>
          <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: size, color: v.textColor, lineHeight: 1, textAlign: "center", whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none", textShadow: v.card ? "none" : `0 ${4 * u}px ${30 * u}px rgba(0,0,0,.35)` }}>
            {v.title}
          </div>
          {String(v.subtitle ?? "").trim() ? (
            <div style={{ fontFamily: font(v.subtitleFont ?? v.font), fontWeight: 600, fontSize: 40 * u, color: v.subtitleColor ?? v.textColor, marginTop: 22 * u, opacity: sub, transform: `translateY(${(1 - sub) * 20 * u}px)`, textAlign: "center" }}>
              {v.subtitle}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
