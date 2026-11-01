import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp, shake, fitSize } from "./common";
import { LightLeaks } from "./LightLeaks";
import { ProductImg } from "./product";
import { font } from "../fonts";

/** Cartão de vidro em 3D com reflexo varrendo; o produto "salta" para fora do vidro. */
export const GlassCard3D: React.FC<StyleProps> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const m = Math.min(width, height);
  const cw = m * 0.6, ch = cw * 1.18;
  const land = spring({ frame, fps, config: { damping: 13, stiffness: 120 } });
  const landFrame = 14;
  const sh = shake(frame, landFrame, Number(v.impact ?? 1) * 14 * u, 8);
  const t = frame / fps;
  const ry = interpolate(land, [0, 1], [-85, 0]) + Math.sin(t * 1.1) * Number(v.sway ?? 12);
  const rx = interpolate(land, [0, 1], [30, 0]) + Math.cos(t * 0.9) * Number(v.sway ?? 12) * 0.5;
  const persp = 1600 * u;
  const popOut = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 140 } });
  const sweep = ((frame - 18) % 70) / 70;
  const sweepX = interpolate(sweep, [0, 1], [-cw, cw * 1.6]);
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const flash = interpolate(frame, [landFrame, landFrame + 4], [Number(v.flash ? 0.5 : 0), 0], clamp);
  const titleIn = interpolate(frame, [18, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const titleSize = fitSize(Number(v.fontSize ?? 90) * u, String(v.title ?? "").length, width * 0.86, 0.6);
  const badgeIn = spring({ frame: frame - 26, fps, config: { damping: 9 } });
  const portrait = height > width;
  const cardTop = height / 2 - ch / 2 - (portrait ? 80 * u : 60 * u);

  return (
    <Background v={v}>
      {!v.transparent && v.blobs ? <LightLeaks colors={[v.color1, v.color2, v.color3]} strength={1} flick={0} seed="glass" /> : null}
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${1 - out * 0.15})`, opacity: 1 - out }}>
        {/* cartão de vidro */}
        <div style={{ position: "absolute", left: width / 2 - cw / 2, top: cardTop, width: cw, height: ch, borderRadius: 48 * u, overflow: "hidden", background: `linear-gradient(140deg, ${v.glassColor}cc 0%, ${v.glassColor}33 45%, ${v.glassColor}66 100%)`, border: `${3 * u}px solid ${v.glassColor}aa`, boxShadow: `0 ${40 * u}px ${80 * u}px rgba(0,0,0,.25)`, transform: `perspective(${persp}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${0.6 + 0.4 * land})`, opacity: Math.min(1, land * 2) }}>
          <div style={{ position: "absolute", top: -ch * 0.2, left: sweepX, width: cw * 0.28, height: ch * 1.4, background: `linear-gradient(90deg, ${v.glassColor}00, ${v.glassColor}aa, ${v.glassColor}00)`, transform: "rotate(20deg)" }} />
          <div style={{ position: "absolute", left: 24 * u, right: 24 * u, top: 18 * u, height: 3 * u, borderRadius: 9, background: `${v.glassColor}cc` }} />
          {v.cardLabel ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 40 * u, textAlign: "center", fontFamily: font(v.labelFont ?? "spacegrotesk"), fontWeight: 700, fontSize: 30 * u, letterSpacing: "0.3em", color: v.labelColor ?? v.textColor, textTransform: "uppercase" }}>{v.cardLabel}</div>
          ) : null}
        </div>
        {/* produto saltando para fora do vidro */}
        <div style={{ position: "absolute", left: width / 2 - (cw * 1.1) / 2, top: cardTop + ch * 0.02, transform: `perspective(${persp}px) rotateY(${ry * 0.5}deg) rotateX(${rx * 0.5}deg) translateY(${(1 - popOut) * 60 * u + Math.sin(t * 2) * 8 * u}px) scale(${0.4 + 0.6 * popOut})`, opacity: Math.min(1, popOut * 1.5) }}>
          <ProductImg src={v.image} size={cw * 1.1} shadow={`0 ${30 * u}px ${30 * u}px rgba(0,0,0,.35)`} />
        </div>
        {/* preço / selo */}
        {String(v.badge ?? "").trim() ? (
          <div style={{ position: "absolute", left: width / 2 + cw / 2 - 120 * u, top: cardTop - 40 * u, width: 190 * u, height: 190 * u, borderRadius: "50%", background: v.badgeColor, color: v.badgeTextColor, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: font(v.font), fontWeight: 900, fontSize: 40 * u, lineHeight: 1, transform: `scale(${badgeIn}) rotate(${(1 - badgeIn) * -90 + 12}deg)`, boxShadow: `0 ${10 * u}px ${30 * u}px rgba(0,0,0,.25)` }}>
            {v.badge}
          </div>
        ) : null}
        {/* título */}
        <div style={{ position: "absolute", left: 0, right: 0, top: cardTop + ch + 40 * u, display: "flex", flexDirection: "column", alignItems: "center", opacity: titleIn, transform: `translateY(${(1 - titleIn) * 40 * u}px)`, filter: `blur(${(1 - titleIn) * 10 * u}px)` }}>
          <div style={{ fontFamily: font(v.font), fontWeight: 900, fontSize: titleSize, color: v.textColor, whiteSpace: "nowrap", textTransform: v.uppercase ? "uppercase" : "none", lineHeight: 1 }}>{v.title}</div>
          {String(v.subtitle ?? "").trim() ? <div style={{ fontFamily: font(v.subtitleFont ?? "inter"), fontWeight: 500, fontSize: 36 * u, color: v.subtitleColor ?? v.textColor, marginTop: 14 * u, opacity: 0.85 }}>{v.subtitle}</div> : null}
        </div>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
    </Background>
  );
};
