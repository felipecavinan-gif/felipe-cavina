import perfume from "./assets/products/perfume.svg";
import headphones from "./assets/products/headphones.svg";
import bag from "./assets/products/bag.svg";

/** Imagens de exemplo embutidas. Um preset pode usar "builtin:perfume" como valor padrão de um campo de imagem. */
export const BUILTIN_IMAGES: Record<string, string> = { perfume, headphones, bag };

export function resolveImage(value: unknown): string {
  const s = String(value ?? "");
  if (s.startsWith("builtin:")) return BUILTIN_IMAGES[s.slice(8)] ?? BUILTIN_IMAGES.perfume;
  return s || BUILTIN_IMAGES.perfume;
}
