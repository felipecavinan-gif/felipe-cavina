import { continueRender, delayRender } from "remotion";
import inter from "./assets/fonts/inter.woff2";
import montserrat from "./assets/fonts/montserrat.woff2";
import playfair from "./assets/fonts/playfair.woff2";
import spacegrotesk from "./assets/fonts/spacegrotesk.woff2";
import jetbrains from "./assets/fonts/jetbrains.woff2";
import bebas from "./assets/fonts/bebas.woff2";
import poppins400 from "./assets/fonts/poppins-400.woff2";
import poppins600 from "./assets/fonts/poppins-600.woff2";
import poppins800 from "./assets/fonts/poppins-800.woff2";

/**
 * Fontes embutidas no projeto (sem depender do Google Fonts na hora do render).
 * Para adicionar uma fonte: coloque o .woff2 em src/assets/fonts, importe aqui e registre abaixo.
 */
type Face = { url: string; weight: string };
const DEFS: Record<string, { family: string; label: string; faces: Face[] }> = {
  inter: { family: "MP Inter", label: "Inter", faces: [{ url: inter, weight: "100 900" }] },
  montserrat: { family: "MP Montserrat", label: "Montserrat", faces: [{ url: montserrat, weight: "100 900" }] },
  poppins: {
    family: "MP Poppins", label: "Poppins",
    faces: [{ url: poppins400, weight: "400" }, { url: poppins600, weight: "600" }, { url: poppins800, weight: "800 900" }],
  },
  bebas: { family: "MP Bebas Neue", label: "Bebas Neue", faces: [{ url: bebas, weight: "100 900" }] },
  playfair: { family: "MP Playfair Display", label: "Playfair Display", faces: [{ url: playfair, weight: "400 900" }] },
  spacegrotesk: { family: "MP Space Grotesk", label: "Space Grotesk", faces: [{ url: spacegrotesk, weight: "300 700" }] },
  jetbrains: { family: "MP JetBrains Mono", label: "JetBrains Mono", faces: [{ url: jetbrains, weight: "100 800" }] },
};

let loaded = false;
export function loadFonts() {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Carregando fontes");
  const all = Object.values(DEFS).flatMap((d) =>
    d.faces.map((f) => {
      const face = new FontFace(d.family, `url(${f.url}) format("woff2")`, { weight: f.weight });
      document.fonts.add(face);
      return face.load();
    }),
  );
  Promise.all(all)
    .catch((e) => console.error("Falha ao carregar fonte", e))
    .finally(() => continueRender(handle));
}

export const FONT_OPTIONS = Object.entries(DEFS).map(([value, d]) => ({ value, label: d.label }));

export function font(id: unknown): string {
  const d = DEFS[String(id)] ?? DEFS.inter;
  return `"${d.family}", system-ui, sans-serif`;
}
