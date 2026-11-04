import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, noise, fitSize } from "./common";
import { font } from "../fonts";

type Phrase = { small: string; big: string };

/**
 * Só texto: cada frase entra em "flick" (pisca, pula, sai do desfoque), a câmera 3D se move
 * em volta do texto e a troca de frase é um zoom que atravessa a tela.
 */
export const TextFlick3D: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames, fps } = useVideoConfig();
  const u = useUnit();
  const phrases: Phrase[] = [1, 2, 3, 4]
    .map((i) => ({ small: String(v[`small${i}`] ?? "").trim(), big: String(v[`big${i}`] ?? "").trim() }))
    .filter((p) => p.small || p.big);
  const n = Math.max(1, phrases.length);
  const seg = durationInFrames / n;
  const E = 8; // frames de entrada
  const X = Math.max(3, Number(v.zoomFrames ?? 7)); // frames do zoom atravessando a tela
  const flickAmt = Number(v.flickAmount ?? 1);
  const camAmt = Number(v.cameraAmount ?? 1);
  const zoomTo = Number(v.zoomScale ?? 7);
  const pattern = [1, 0, 1, 1, 0, 1, 0, 1];

  /** Estado de uma frase num certo quadro (usado também para o rastro). */
  const state = (f: number) => {
    const i = Math.min(n - 1, Math.max(0, Math.floor(f / seg)));
    const t = f - i * seg;
    const segLen = seg;
    const enter = interpolate(t, [0, E], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const through = interpolate(t, [segLen - X, segLen - 0.001], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    const flickOff = flickAmt > 0 && t < pattern.length && pattern[Math.floor(t)] === 0 && noise("fk", Math.floor(t) + i * 10) < flickAmt;
    const scale = interpolate(enter, [0, 1], [0.3, 1]) * interpolate(t, [E, segLen - X], [1, 1.06], clamp) * interpolate(through, [0, 1], [1, zoomTo]);
    const blur = (1 - enter) * 16 * u + through * 34 * u;
    const op = (flickOff ? 0 : 1) * Math.min(1, enter * 2) * interpolate(through, [0, 0.6, 1], [1, 0.9, 0]);
    const jitter = t < pattern.length ? (noise("jx", Math.floor(t) + i * 10) - 0.5) * 30 * u * flickAmt : 0;
    return { i, t, enter, through, scale, blur, op, jitter };
  };

  // Câmera 3D
  const sec = frame / fps;
  const mode = String(v.cameraMode ?? "orbit");
  const cur = state(frame);
  const side = cur.i % 2 ? 1 : -1;
  let rx = 0, ry = 0, rz = 0;
  if (mode === "orbit") { ry = Math.sin(sec * 0.9) * 24; rx = 8 + Math.cos(sec * 0.7) * 4; }
  else if (mode === "tilt") { rx = Math.sin(sec * 1.1) * 22; ry = Math.cos(sec * 0.8) * 8; }
  else if (mode === "dolly") { rx = 14; ry = -12 + Math.sin(sec * 0.6) * 6; rz = -2; }
  let whipBlur = 0;
  if (mode === "whip") {
    // vira rápido para a frase, passa um pouquinho e volta sutil; depois só uma deriva leve
    const sp = (f: number) => spring({ frame: f - cur.i * seg, fps, config: { damping: 12, stiffness: 160, mass: 0.7 } });
    const s0 = sp(frame), s1 = sp(frame - 1);
    ry = side * 38 * (1 - s0) + Math.sin(sec * 0.7) * 2;
    rx = 6 * (1 - s0) + Math.cos(sec * 0.5) * 1.5;
    rz = -side * 3 * (1 - s0);
    whipBlur = Math.min(12, Math.abs(s0 - s1) * 38 * 1.6) * u * Number(v.motionBlur ?? 1);
  } else {
    ry += side * (1 - cur.enter) * 40; // cada frase entra girando de um lado
  }
  rx *= camAmt; ry *= camAmt; rz *= camAmt;
  const persp = 1100 * u;
  const flash = v.flash && cur.t < 2 ? interpolate(cur.t, [0, 2], [0.7, 0]) : 0;

  const renderPhrase = (s: ReturnType<typeof state>, ghost = 0) => {
    const p = phrases[s.i] ?? { small: "", big: "" };
    const bigSize = fitSize(Number(v.fontSize ?? 170) * u, p.big.length, width * 0.86, Number(v.charRatio ?? 0.62));
    const smallSize = bigSize * Number(v.smallRatio ?? 0.32);
    const align = v.align === "left" ? "flex-start" : "center";
    return (
      <AbsoluteFill key={`g${ghost}`} style={{ justifyContent: "center", alignItems: "center", opacity: s.op * (ghost ? 0.28 / ghost : 1) }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: align, transform: `perspective(${persp}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) translateX(${s.jitter}px) scale(${s.scale})`, filter: `blur(${s.blur + whipBlur + ghost * 4 * u}px)` }}>
          {p.small ? (
            <div style={{ fontFamily: font(v.smallFont ?? v.font), fontWeight: Number(v.smallWeight ?? 700), fontSize: smallSize, color: v.smallColor ?? v.textColor, lineHeight: 1, marginBottom: smallSize * 0.1, marginLeft: v.align === "left" ? bigSize * 0.08 : 0, whiteSpace: "nowrap", letterSpacing: v.smallTracking ? `${v.smallTracking}em` : undefined, textTransform: v.smallUppercase ? "uppercase" : "none" }}>
              {p.small}
            </div>
          ) : null}
          {p.big ? (
            <div style={{ fontFamily: font(v.font), fontWeight: Number(v.bigWeight ?? 900), fontSize: bigSize, color: v.textColor, lineHeight: 0.95, letterSpacing: "-0.02em", whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none", textShadow: v.glow ? `0 0 ${24 * u}px ${v.glowColor}, 0 0 ${60 * u}px ${v.glowColor}88` : "none" }}>
              {p.big}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  };

  const ghosts = v.echo ? [3, 2].map((k) => ({ k, s: state(Math.max(0, frame - k * 2)) })).filter((g) => g.s.i === cur.i) : [];

  return (
    <Background v={v}>
      {ghosts.map((g) => renderPhrase(g.s, g.k))}
      {renderPhrase(cur)}
      {flash > 0 ? <AbsoluteFill style={{ background: v.flashColor ?? "#fff", opacity: flash }} /> : null}
    </Background>
  );
};
