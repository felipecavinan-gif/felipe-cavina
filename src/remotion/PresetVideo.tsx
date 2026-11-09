import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { STYLES } from "../styles";
import type { RenderInput } from "../types";
import { loadFonts } from "../fonts";
import { isFullScene, safeRect, usesSafeArea } from "../safeArea";

loadFonts();

export const PresetVideo: React.FC<RenderInput> = ({ style, values }) => {
  const { width, height, durationInFrames } = useVideoConfig();
  const Comp = STYLES[style];
  if (!Comp) {
    return (
      <AbsoluteFill style={{ background: "#300", color: "#fff", justifyContent: "center", alignItems: "center", fontSize: 48 }}>
        Estilo "{style}" não encontrado
      </AbsoluteFill>
    );
  }
  if (!usesSafeArea(width, height, values) || isFullScene(style, values)) return <Comp v={values} />;

  // Área segura do Instagram: o fundo ocupa a tela toda, o conteúdo fica dentro da área segura.
  // A Sequence com width/height faz o estilo "enxergar" só a área segura como se fosse a tela.
  const r = safeRect(width, height);
  return (
    <AbsoluteFill style={{ background: values.transparent ? "transparent" : (values.bgColor as string) ?? "#0b0b0f" }}>
      <div style={{ position: "absolute", left: r.left, top: r.top, width: r.width, height: r.height }}>
        <Sequence width={r.width} height={r.height} durationInFrames={durationInFrames} layout="none">
          <Comp v={values} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
