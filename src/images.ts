import perfume from "./assets/products/perfume.svg";
import headphones from "./assets/products/headphones.svg";
import bag from "./assets/products/bag.svg";
import avatar from "./assets/products/avatar.svg";

/** Imagens de exemplo embutidas. Um preset pode usar "builtin:perfume" como valor padrão de um campo de imagem. */
export const BUILTIN_IMAGES: Record<string, string> = { perfume, headphones, bag, avatar };

export function resolveImage(value: unknown): string {
  const s = String(value ?? "");
  if (s.startsWith("builtin:")) return BUILTIN_IMAGES[s.slice(8)] ?? BUILTIN_IMAGES.perfume;
  return s || BUILTIN_IMAGES.perfume;
}

/** Igual a resolveImage, mas devolve "" quando o campo está vazio (ex.: "sem foto"). */
export function resolveOptionalImage(value: unknown): string {
  const s = String(value ?? "");
  return s ? resolveImage(s) : "";
}
