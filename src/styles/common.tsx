import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import type { Values } from "../types";

export type StyleProps = { v: Values };

/** Escala de 1 = 1080px no menor lado; deixa todo template responsivo a 16:9, 9:16, 1:1… */
export function useUnit() {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
}

export function useIsPortrait() {
  const { width, height } = useVideoConfig();
  return height > width;
}

/** 0 → 1 nos últimos `frames` frames (para animação de saída). */
export function useExit(frames = 12) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - frames, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
}

export const Background: React.FC<{ v: Values; children?: React.ReactNode }> = ({ v, children }) => (
  <AbsoluteFill style={{ backgroundColor: v.transparent ? "transparent" : v.bgColor ?? "#0b0b0f" }}>
    {children}
  </AbsoluteFill>
);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** Divide texto em palavras; palavras entre *asteriscos* ficam em destaque. */
export function parseWords(text: string) {
  return String(text ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const m = w.match(/^\*(.+)\*([.,!?:;]*)$/);
      return m ? { word: m[1] + m[2], accent: true } : { word: w, accent: false };
    });
}

/** Reduz o tamanho da fonte para que uma linha de `chars` caracteres caiba em `maxWidth`. */
export function fitSize(base: number, chars: number, maxWidth: number, charRatio = 0.62) {
  if (chars <= 0) return base;
  return Math.min(base, maxWidth / (chars * charRatio));
}
