import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, noise, fitSize } from "./common";
import { font } from "../fonts";

type Pt = { x: number; y: number; z: number; ry: number; rz: number };

/** Posições dos 3 pontos no espaço (x/y em px de referência 1920x1080, z em profundidade, ry/rz em graus). */
const LAYOUTS: Record<string, Pt[]> = {
  zigzag: [
    { x: -650, y: -260, z: 0, ry: 28, rz: -3 },
    { x: 700, y: 180, z: -1500, ry: -32, rz: 3 },
    { x: 0, y: -40, z: -3000, ry: 0, rz: 0 },
  ],
  corredor: [
    { x: -900, y: 0, z: 0, ry: 58, rz: 0 },
    { x: 900, y: 0, z: -1700, ry: -58, rz: 0 },
    { x: 0, y: 0, z: -3400, ry: 0, rz: 0 },
  ],
  escada: [
    { x: -380, y: -760, z: 0, ry: 14, rz: -6 },
    { x: 380, y: 0, z: -1300, ry: -14, rz: 6 },
    { x: 0, y: 760, z: -2600, ry: 0, rz: 0 },
  ],
  orbita: [
    { x: 0, y: 0, z: 0, ry: 0, rz: 0 },
    { x: 1500, y: -120, z: -1500, ry: -75, rz: 0 },
    { x: 300, y: 80, z: -3100, ry: -150, rz: 0 },
  ],
};

/** A câmera 3D viaja entre 3 pontos no espaço; em cada um há um texto, os outros ficam visíveis ao fundo. */
export const Camera3Points: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const u = useUnit();
  const sx = width / 1920, sy = height / 1080;
  const texts = [1, 2, 3].map((i) => ({ label: String(v[`label${i}`] ?? ""), text: String(v[`text${i}`] ?? "") }));
  const raw = LAYOUTS[String(v.layout ?? "zigzag")] ?? LAYOUTS.zigzag;
  const depth = Number(v.depth ?? 1);
  const pts = raw.map((p) => ({ ...p, x: p.x * sx * u * (height > width ? 1.6 : 1), y: p.y * sy * u * (height > width ? 0.75 : 1), z: p.z * u * depth }));

  // Linha do tempo: chegada → ponto 1 → viagem → ponto 2 → viagem → ponto 3 → saída atravessando
  const intro = 14, T = Math.max(6, Number(v.travelFrames ?? 18)), outro = 12;
  const hold = Math.max(6, (durationInFrames - intro - 2 * T - outro) / 3);
  const k1 = intro, k2 = k1 + hold + T, k3 = k2 + hold + T, kEnd = k3 + hold;
  const ease = Easing.bezier(0.65, 0, 0.25, 1);
  // Entrada e saída andam na direção em que a câmera olha (normal do texto), mesmo com a câmera girada.
  const along = (pt: Pt, d: number): Pt => {
    const r = (pt.ry * Math.PI) / 180;
    return { ...pt, x: pt.x + Math.sin(r) * d, z: pt.z + Math.cos(r) * d };
  };
  const start: Pt = { ...along(pts[0], 2400 * u), ry: pts[0].ry + 25 };
  const exit: Pt = along(pts[2], -1400 * u);
  const keys: [number, Pt][] = [[0, start], [k1, pts[0]], [k1 + hold, pts[0]], [k2, pts[1]], [k2 + hold, pts[1]], [k3, pts[2]], [kEnd, pts[2]], [durationInFrames, exit]];
  const whip = v.motion === "whip";

  /** Posição da câmera num quadro. "smooth": viagem com ease. "whip": vira rápido, passa um pouco e volta sutil (mola). */
  const camAt = (f: number): Pt => {
    if (!whip) {
      let a = keys[0], b = keys[1];
      for (let i = 0; i < keys.length - 1; i++) if (f >= keys[i][0]) { a = keys[i]; b = keys[i + 1]; }
      const p = interpolate(f, [a[0], Math.max(a[0] + 1, b[0])], [0, 1], { ...clamp, easing: ease });
      const lerp = (x: number, y: number) => x + (y - x) * p;
      return { x: lerp(a[1].x, b[1].x), y: lerp(a[1].y, b[1].y), z: lerp(a[1].z, b[1].z), ry: lerp(a[1].ry, b[1].ry), rz: lerp(a[1].rz, b[1].rz) };
    }
    const cfg = { damping: Number(v.springDamping ?? 13), stiffness: Number(v.springStiffness ?? 170), mass: 0.7 };
    // cada movimento começa no seu instante e soma o deslocamento com uma mola (overshoot pequeno)
    const moves: [number, Pt, Pt][] = [[0, start, pts[0]], [k1 + hold, pts[0], pts[1]], [k2 + hold, pts[1], pts[2]]];
    const c: Pt = { ...start };
    for (const [t0, from, to] of moves) {
      const sp = spring({ frame: f - t0, fps, config: cfg });
      (["x", "y", "z", "ry", "rz"] as const).forEach((k) => { c[k] += (to[k] - from[k]) * sp; });
    }
    // saída atravessando o último texto
    const o = interpolate(f, [kEnd, durationInFrames], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    (["x", "y", "z", "ry", "rz"] as const).forEach((k) => { c[k] += (exit[k] - pts[2][k]) * o; });
    // deriva bem sutil enquanto segura em cada texto
    const sec = f / fps;
    c.ry += Math.sin(sec * 0.7) * Number(v.drift ?? 1.5);
    c.rz += Math.sin(sec * 0.5 + 1) * Number(v.drift ?? 1.5) * 0.3;
    c.z += Math.sin(sec * 0.4) * 30 * u;
    return c;
  };

  const cam = camAt(frame);
  const prev = camAt(Math.max(0, frame - 1));
  // velocidade da câmera → inclinação e blur de movimento (só aparecem enquanto ela se move)
  const speed = Math.hypot(cam.x - prev.x, cam.y - prev.y, cam.z - prev.z) / (40 * u) + Math.abs(cam.ry - prev.ry) * 0.6;
  const moving = whip ? Math.min(1, speed) : 0;
  let bank: number, motionBlur: number;
  if (whip) {
    bank = Math.max(-1, Math.min(1, (cam.x - prev.x) / (60 * u))) * -Number(v.bank ?? 6);
    motionBlur = Math.min(14, speed * 2.2) * Number(v.motionBlur ?? 1) * u;
  } else {
    let a = keys[0], b = keys[1];
    for (let i = 0; i < keys.length - 1; i++) if (frame >= keys[i][0]) { a = keys[i]; b = keys[i + 1]; }
    const p = interpolate(frame, [a[0], Math.max(a[0] + 1, b[0])], [0, 1], { ...clamp, easing: ease });
    const mv = a[1] !== b[1] ? Math.sin(p * Math.PI) : 0;
    bank = mv * Number(v.bank ?? 6) * (b[1].x > a[1].x ? -1 : 1);
    motionBlur = mv * Number(v.motionBlur ?? 1) * 10 * u;
  }
  void moving;
  const persp = 1000 * u;
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames - 1], [1, 0], clamp);

  return (
    <Background v={v}>
      <AbsoluteFill style={{ opacity: out }}>
        {pts
          .map((pt, i) => ({ pt, i, rz: pt.z - cam.z }))
          .sort((m, n) => m.rz - n.rz) // longe primeiro
          .map(({ pt, i, rz }) => {
            if (rz > persp * 0.82) return null; // já passou da câmera
            // De lado para a câmera (quase de perfil) o texto não aparece e só pesa no render
            if (Math.abs(pt.ry - cam.ry) > 78) return null;
            // Fora do campo de visão lateral
            const relX = (pt.x - cam.x) * Math.cos((cam.ry * Math.PI) / 180) - rz * Math.sin((cam.ry * Math.PI) / 180);
            const relZ = rz * Math.cos((cam.ry * Math.PI) / 180) + (pt.x - cam.x) * Math.sin((cam.ry * Math.PI) / 180);
            if (relZ > persp * 0.7 || Math.abs(relX) > (persp - relZ) * 2.2) return null;
            const t = texts[i];
            const size = fitSize(Number(v.fontSize ?? 150) * u, t.text.length, width * 0.82, Number(v.charRatio ?? 0.62));
            const arrive = [k1, k2, k3][i];
            const ta = frame - arrive + 4;
            const flickOff = v.flick && ta >= 0 && ta < 6 && [0, 1, 0, 1, 1, 0][ta] === 0;
            const near = interpolate(Math.abs(rz), [0, 1500 * u * depth, 4000 * u * depth], [1, 0.55, 0.15], clamp);
            const dof = Math.min(30, (Math.abs(rz) / (1000 * u)) * Number(v.focusBlur ?? 6)) * u;
            const jitter = v.flick && ta >= 0 && ta < 6 ? (noise("j", ta + i * 9) - 0.5) * 24 * u : 0;
            return (
              <AbsoluteFill key={i} style={{ justifyContent: "center", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: v.align === "left" ? "flex-start" : "center", opacity: (flickOff ? 0.15 : 1) * near, filter: `blur(${dof + motionBlur}px)`, transform: `perspective(${persp}px) rotateZ(${bank - cam.rz}deg) rotateY(${-cam.ry}deg) translate3d(${pt.x - cam.x + jitter}px, ${pt.y - cam.y}px, ${rz}px) rotateY(${pt.ry}deg) rotateZ(${pt.rz}deg)` }}>
                  {t.label ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 14 * u, marginBottom: 10 * u }}>
                      {v.showIndex ? <span style={{ fontFamily: font("jetbrains"), fontWeight: 700, fontSize: 30 * u, color: v.bgColor, background: v.accentColor, padding: `${2 * u}px ${10 * u}px` }}>{String(i + 1).padStart(2, "0")}</span> : null}
                      <span style={{ fontFamily: font(v.labelFont ?? v.font), fontWeight: 600, fontSize: size * Number(v.labelRatio ?? 0.26), color: v.accentColor, letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{t.label}</span>
                    </div>
                  ) : null}
                  <div style={{ fontFamily: font(v.font), fontWeight: Number(v.weight ?? 900), fontSize: size, lineHeight: 0.95, color: v.textColor, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none", letterSpacing: "-0.02em", textShadow: v.glow ? `0 0 ${18 * u}px ${v.accentColor}` : "none" }}>
                    {t.text}
                  </div>
                  {v.underline ? <div style={{ height: 8 * u, width: "40%", background: v.accentColor, marginTop: 16 * u }} /> : null}
                </div>
              </AbsoluteFill>
            );
          })}
      </AbsoluteFill>
    </Background>
  );
};
