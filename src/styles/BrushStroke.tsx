import React from "react";

type Curve = (t: number) => [number, number];

/** Formas como curvas paramétricas no quadro 0..100. Cada forma pode ter mais de um traço. */
const wobble = (a: number, k: number) => 1 + 0.025 * Math.sin(a * 3 + k) + 0.015 * Math.sin(a * 5 + k * 2);
const SHAPES: Record<string, Curve[]> = {
  // Volta completa e um pouco mais (o fim passa do começo), como um círculo feito à mão
  ellipse: [(t) => { const a = -Math.PI * 0.62 + t * Math.PI * 2.16; const g = 1 + t * 0.07; return [50 + 49 * g * Math.cos(a) * wobble(a, 1), 50 + 47 * g * Math.sin(a) * wobble(a, 2)]; }],
  double: [(t) => { const a = -Math.PI * 0.6 + t * Math.PI * 4.1; const g = 1.04 - t * 0.12; return [50 + 49 * g * Math.cos(a) * wobble(a, 3), 50 + 47 * g * Math.sin(a) * wobble(a, 4)]; }],
  box: [(t) => {
    const P: [number, number][] = [[3, 6], [97, 3], [98, 96], [2, 97], [3, 4], [40, 5]];
    const s = t * (P.length - 1), i = Math.min(P.length - 2, Math.floor(s)), f = s - i;
    return [P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f];
  }],
  underline: [
    (t) => [t * 100, 94 + Math.sin(t * Math.PI) * -3 + t * -2],
    (t) => [12 + t * 80, 101 + Math.sin(t * Math.PI) * -2],
  ],
  brackets: [
    (t) => { const P: [number, number][] = [[16, 0], [1, 0], [1, 100], [16, 100]]; const s = t * 3, i = Math.min(2, Math.floor(s)), f = s - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f]; },
    (t) => { const P: [number, number][] = [[84, 0], [99, 0], [99, 100], [84, 100]]; const s = t * 3, i = Math.min(2, Math.floor(s)), f = s - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f]; },
  ],
};

/**
 * Traço de pincel: fino no começo, um pouco mais grosso no meio e fino no fim,
 * desenhado até `progress` (0..1), com blur suave.
 */
export const BrushStroke: React.FC<{ shape: string; progress: number; width: number; color: string; blur: number; opacity?: number }> = ({ shape, progress, width, color, blur, opacity = 0.9 }) => {
  const curves = SHAPES[shape] ?? SHAPES.ellipse;
  const N = 70; // segmentos por traço
  const segs: React.ReactNode[] = [];
  curves.forEach((curve, ci) => {
    // cada traço ocupa uma fatia do progresso total
    const p = Math.max(0, Math.min(1, progress * curves.length - ci));
    const last = Math.floor(p * N);
    for (let i = 0; i < last; i++) {
      const t0 = i / N, t1 = (i + 1) / N, tm = (t0 + t1) / 2;
      const [x0, y0] = curve(t0), [x1, y1] = curve(t1);
      const taper = Math.max(0.08, Math.pow(Math.sin(Math.PI * tm), 0.8)); // começa e termina fino
      const head = p < 1 ? Math.max(0.15, Math.min(1, (p - tm) / 0.08)) : 1; // a ponta que está sendo riscada também é fina
      segs.push(<line key={`${ci}-${i}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={width * taper * head} strokeLinecap="round" vectorEffect="non-scaling-stroke" />);
    }
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", opacity, filter: blur > 0 ? `blur(${blur}px)` : undefined }}>
      {segs}
    </svg>
  );
};
