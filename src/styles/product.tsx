import React from "react";
import { Img } from "remotion";
import { resolveImage } from "../images";

/** Imagem do usuário (produto/elemento), sempre inteira dentro da caixa. */
export const ProductImg: React.FC<{ src: unknown; size: number; style?: React.CSSProperties; shadow?: string }> = ({ src, size, style, shadow }) => (
  <Img
    src={resolveImage(src)}
    style={{ width: size, height: size, objectFit: "contain", display: "block", filter: shadow ? `drop-shadow(${shadow})` : undefined, ...style }}
  />
);
