import React from "react";
import { AbsoluteFill } from "remotion";
import { STYLES } from "../styles";
import type { RenderInput } from "../types";
import { loadFonts } from "../fonts";

loadFonts();

export const PresetVideo: React.FC<RenderInput> = ({ style, values }) => {
  const Comp = STYLES[style];
  if (!Comp) {
    return (
      <AbsoluteFill style={{ background: "#300", color: "#fff", justifyContent: "center", alignItems: "center", fontSize: 48 }}>
        Estilo "{style}" não encontrado
      </AbsoluteFill>
    );
  }
  return <Comp v={values} />;
};
