import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, fitSize, noise } from "./common";
import { font } from "../fonts";

/**
 * Lettering só de texto (fundo transparente por padrão): duas palavras pequenas e uma grande.
 * Entra com blur, a escala diminui de leve o tempo todo e sai voltando o blur.
 */
export const Lettering: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames: D } = useVideoConfig();
  const u = useUnit();
  const inLen = Math.max(4, Number(v.introFrames ?? 18));
  const outLen = Math.max(4, Number(v.outroFrames ?? 18));
  const blurMax = Number(v.blurAmount ?? 1) * 22 * u;
  const stagger = v.stagger ? Number(v.staggerFrames ?? 4) : 0;

  /** Estado de uma camada (com atraso para o efeito em cascata). */
  const motion = String(v.motion ?? "shrink");
  const flick = !!v.flick;
  const flickPattern = [0, 1, 0, 0, 1, 0, 1, 1, 0, 1];
  const layer = (delay: number) => {
    const f = frame - delay;
    const a = interpolate(f, [0, inLen], [0, 1], { ...clamp, easing: Easing.bezier(0.25, 0.8, 0.3, 1) });
    const outStart = D - outLen - (stagger * 2 - delay);
    const b = interpolate(frame, [outStart, D - 1 - (stagger * 2 - delay)], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    // flicks: pisca ao aparecer e ao desaparecer
    let fk = 1;
    if (flick) {
      if (f >= 0 && f < flickPattern.length) fk = flickPattern[Math.floor(f)] ? 1 : 0.05;
      const g = frame - outStart;
      if (g >= 0 && g < flickPattern.length) fk = noise(`lo${delay}`, frame) > 0.45 ? 1 : 0.05;
    }
    const rise = motion === "rise" ? (1 - a) * 50 * u - b * 40 * u : 0;
    return { blur: (1 - a) * blurMax + b * blurMax, opacity: (flick ? Math.min(1, a * 3) : a) * (1 - b) * fk, rise };
  };
  // curva de escala de cada tipo de movimento
  const sFrom = Number(v.scaleFrom ?? (motion === "grow" ? 0.7 : motion === "zoom" ? 2.4 : 1.12));
  const sTo = Number(v.scaleTo ?? (motion === "grow" ? 1.06 : 0.97));
  let scale: number;
  if (motion === "zoom") {
    const zin = interpolate(frame, [0, inLen + 6], [sFrom, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const zout = interpolate(frame, [D - outLen, D - 1], [1, Number(v.zoomOut ?? 2.6)], { ...clamp, easing: Easing.in(Easing.cubic) });
    scale = zin * zout * interpolate(frame, [0, D], [1, 0.97]);
  } else if (motion === "grow") {
    scale = interpolate(frame, [0, D], [sFrom, sTo], { easing: Easing.out(Easing.cubic) });
  } else {
    scale = interpolate(frame, [0, D], [sFrom, sTo], { easing: Easing.out(Easing.quad) });
  }
  const trackOpen = motion === "tracking" ? interpolate(frame, [0, D], [Number(v.trackFrom ?? 0.35), -0.02], { easing: Easing.out(Easing.cubic) }) : null;

  const big = String(v.big ?? "");
  const s1 = String(v.small1 ?? ""), s2 = String(v.small2 ?? "");
  const layout = String(v.layout ?? "top");
  // no modo "letras se abrindo" a palavra começa mais espaçada: o tamanho já considera isso para não cortar
  const bigSize = fitSize(Number(v.bigSize ?? 200) * u, big.length, width * 0.82, Number(v.charRatio ?? 0.6) + (motion === "tracking" ? Number(v.trackFrom ?? 0.35) : 0));
  const smallSize = bigSize * Number(v.smallRatio ?? 0.3);
  const smallStyle: React.CSSProperties = {
    fontFamily: font(v.smallFont ?? v.font), fontWeight: Number(v.smallWeight ?? 600), fontSize: smallSize, color: v.smallColor ?? v.bigColor,
    fontStyle: v.smallItalic ? "italic" : "normal", letterSpacing: `${Number(v.smallTracking ?? 0)}em`, textTransform: v.smallUppercase ? "uppercase" : "none",
    lineHeight: 1, whiteSpace: "nowrap",
  };
  const bigStyle: React.CSSProperties = {
    fontFamily: font(v.font), fontWeight: Number(v.bigWeight ?? 800), fontSize: bigSize, color: v.bigColor, lineHeight: 0.9,
    letterSpacing: `${trackOpen ?? Number(v.bigTracking ?? -0.02)}em`, textTransform: v.uppercase ? "uppercase" : "none", whiteSpace: "nowrap",
    fontStyle: v.bigItalic ? "italic" : "normal", textShadow: v.glow ? `0 0 ${20 * u}px ${v.glowColor}, 0 0 ${50 * u}px ${v.glowColor}88` : "none",
  };
  const L0 = layer(0), L1 = layer(stagger), L2 = layer(stagger * 2);
  const fx = (l: { blur: number; opacity: number; rise: number }): React.CSSProperties => ({ filter: `blur(${l.blur}px)`, opacity: l.opacity, transform: l.rise ? `translateY(${l.rise}px)` : undefined });
  const gap = smallSize * 0.28;
  const align = v.align === "left" ? "flex-start" : v.align === "right" ? "flex-end" : "center";

  let content: React.ReactNode;
  if (layout === "split") {
    // pequena em cima à esquerda, grande no meio, pequena embaixo à direita
    content = (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ ...smallStyle, ...fx(L0), alignSelf: "flex-start", marginLeft: bigSize * 0.05, marginBottom: -smallSize * 0.05 }}>{s1}</div>
        <div style={{ ...bigStyle, ...fx(L1) }}>{big}</div>
        <div style={{ ...smallStyle, ...fx(L2), alignSelf: "flex-end", marginRight: bigSize * 0.05, marginTop: smallSize * 0.15 }}>{s2}</div>
      </div>
    );
  } else {
    const smalls = (
      <div style={{ display: "flex", gap, alignSelf: align, marginLeft: align === "flex-start" ? bigSize * 0.04 : 0 }}>
        <span style={{ ...smallStyle, ...fx(L0) }}>{s1}</span>
        <span style={{ ...smallStyle, ...fx(layout === "top" ? L0 : L2) }}>{s2}</span>
      </div>
    );
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: align }}>
        {layout === "top" ? smalls : null}
        <div style={{ ...bigStyle, ...fx(L1), marginTop: layout === "top" ? smallSize * 0.3 : 0, marginBottom: layout === "bottom" ? smallSize * 0.2 : 0 }}>{big}</div>
        {layout === "bottom" ? smalls : null}
      </div>
    );
  }

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ transform: `scale(${scale}) translateY(${interpolate(frame, [0, D], [10 * u, -10 * u])}px)` }}>{content}</div>
      </AbsoluteFill>
    </Background>
  );
};
