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
  // Velocidade: entradas/saídas mais rápidas e mais movimento no mesmo tempo
  const speed = Math.max(0.2, Number(v.speed ?? 1));
  const inLen = Math.max(3, Number(v.introFrames ?? 18) / speed);
  const outLen = Math.max(3, Number(v.outroFrames ?? 18) / speed);
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
      if (v.flickOut !== false && g >= 0 && g < flickPattern.length) fk = noise(`lo${delay}`, frame) > 0.45 ? 1 : 0.05;
    }
    const rise = motion === "rise" ? ((1 - a) * 50 * u - b * 40 * u) * speed : 0;
    return { blur: (1 - a) * blurMax + b * blurMax, opacity: (flick ? Math.min(1, a * 3) : a) * (1 - b) * fk, rise };
  };
  // curva de escala de cada tipo de movimento
  const sTo = Number(v.scaleTo ?? (motion === "grow" ? 1.06 : 0.97));
  const sFrom = sTo + (Number(v.scaleFrom ?? (motion === "grow" ? 0.7 : motion === "zoom" ? 2.4 : 1.12)) - sTo) * speed;
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
  // "pullback": câmera 3D se afastando — o texto começa perto e inclinado e vai para trás (escala diminuindo pela perspectiva)
  let cam3d = "";
  if (motion === "pullback") {
    const pb = interpolate(frame, [0, D], [0, 1], { easing: Easing.bezier(0.2, 0.7, 0.3, 1) });
    const z = interpolate(pb, [0, 1], [Number(v.camNear ?? 420) * speed, Number(v.camFar ?? -160) * speed]) * u;
    const ry = interpolate(pb, [0, 1], [Number(v.camTurn ?? -16), Number(v.camTurn ?? -16) * -0.2]);
    const rx = interpolate(pb, [0, 1], [Number(v.camTilt ?? 10), 0]);
    cam3d = `perspective(${1200 * u}px) translateZ(${z}px) rotateY(${ry}deg) rotateX(${rx}deg) `;
    scale = 1;
  }
  const trackOpen = motion === "tracking" ? interpolate(frame, [0, D], [Number(v.trackFrom ?? 0.35) * speed, -0.02], { easing: Easing.out(Easing.cubic) }) : null;

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
  const lineGap = bigSize * Number(v.lineGap ?? -0.04);
  const align = v.align === "left" ? "flex-start" : v.align === "right" ? "flex-end" : "center";

  let content: React.ReactNode;
  if (layout === "split") {
    // pequena em cima à esquerda, grande no meio, pequena embaixo à direita
    content = (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ ...smallStyle, ...fx(L0), alignSelf: "flex-start", marginLeft: bigSize * 0.05, marginBottom: lineGap }}>{s1}</div>
        <div style={{ ...bigStyle, ...fx(L1) }}>{big}</div>
        <div style={{ ...smallStyle, ...fx(L2), alignSelf: "flex-end", marginRight: bigSize * 0.05, marginTop: lineGap + bigSize * 0.04 }}>{s2}</div>
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
        <div style={{ ...bigStyle, ...fx(L1), marginTop: layout === "top" ? lineGap : 0, marginBottom: layout === "bottom" ? lineGap + bigSize * 0.04 : 0 }}>{big}</div>
        {layout === "bottom" ? smalls : null}
      </div>
    );
  }

  return (
    <Background v={v}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${(Number(v.posX ?? 0) / 100) * width}px, ${(Number(v.posY ?? 0) / 100) * useVideoConfig().height}px)` }}>
        <div style={{ transform: `${cam3d}scale(${scale}) translateY(${interpolate(frame, [0, D], [10 * u, -10 * u])}px)` }}>{content}</div>
      </AbsoluteFill>
    </Background>
  );
};
