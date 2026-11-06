import { renderMediaOnWeb, canRenderMediaOnWeb, renderStillOnWeb } from "@remotion/web-renderer";
import { PresetVideo } from "../remotion/PresetVideo";
import { buildInput, type FormatId, type Preset, type Values } from "../types";
import { makeZip } from "./zip";
import { makeApng } from "./apng";

export type WebExportType = "mp4" | "apng" | "mp4-green" | "png-zip" | "webm-alpha";

export const WEB_EXPORTS: { id: WebExportType; label: string }[] = [
  { id: "mp4", label: "Vídeo MP4 (abre em qualquer aparelho)" },
  { id: "apng", label: "PNG animado sem fundo (um arquivo .png)" },
  { id: "mp4-green", label: "Vídeo MP4 com fundo verde (para chroma key)" },
  { id: "webm-alpha", label: "Vídeo WebM sem fundo (não abre no QuickTime)" },
  { id: "png-zip", label: "Imagens PNG sem fundo (pasta ZIP)" },
];

/** Renderiza o vídeo no próprio navegador (sem servidor) e devolve o arquivo. */
export async function renderInBrowser(
  preset: Preset, values: Values, format: FormatId, type: WebExportType,
  onProgress: (p: number) => void, signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  // MP4 com fundo verde: desliga a transparência e pinta o fundo de verde puro (para chroma key)
  const vals = type === "mp4-green" ? { ...values, transparent: false, bgColor: "#00ff00" } : (type === "png-zip" || type === "apng") ? { ...values, transparent: true } : type === "mp4" ? { ...values, transparent: false } : values;
  const input = buildInput(preset, vals, format);
  const isMp4 = type === "mp4" || type === "mp4-green";
  const container = isMp4 ? "mp4" : "webm";
  const capture = type === "png-zip" || type === "apng";
  const transparent = type === "webm-alpha" || capture;
  const videoCodec: "h264" | "vp8" | "vp9" = isMp4 ? "h264" : "vp9";
  const composition = {
    id: "Preset", component: PresetVideo, durationInFrames: input.durationInFrames,
    fps: input.fps, width: input.width, height: input.height,
  };
  const check = await canRenderMediaOnWeb({ container, videoCodec, width: input.width, height: input.height, transparent, muted: true }).catch(() => null);
  if (check && !check.canRender) {
    const msg = check.issues.filter((i) => i.severity === "error").map((i) => i.message).join(" ");
    throw new Error(`Este navegador não consegue gerar ${type.toUpperCase()}. ${msg} Tente outro formato.`);
  }
  // Sequência PNG: guarda cada quadro (com transparência) enquanto o navegador renderiza
  const pngs: Blob[] = [];
  let canvas: OffscreenCanvas | null = null;
  const onFrame = capture
    ? async (frame: VideoFrame) => {
        canvas ??= new OffscreenCanvas(frame.displayWidth, frame.displayHeight);
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, 0, 0);
        pngs.push(await canvas.convertToBlob({ type: "image/png" }));
        return frame;
      }
    : null;
  const result = await renderMediaOnWeb({
    onFrame,
    composition, inputProps: input, container, videoCodec, transparent, muted: true,
    videoBitrate: "very-high",
    onProgress: ({ progress }: { progress: number }) => onProgress(progress),
    signal: signal ?? null,
    licenseKey: "free-license",
  } as never);
  const base = `${preset.id}-${format.replace(":", "x")}`;
  if (type === "apng") {
    return { blob: await makeApng(pngs, input.fps), filename: `${base}-sem-fundo.png` };
  }
  if (type === "png-zip") {
    const pad = String(pngs.length).length < 4 ? 4 : String(pngs.length).length;
    const readme = [
      "Sequência PNG com fundo transparente",
      `${pngs.length} quadros · ${input.fps} quadros por segundo · ${input.width}x${input.height}`,
      "",
      "Como usar:",
      "- Premiere Pro: Importar > selecione o primeiro PNG > marque 'Sequência de imagens'.",
      "- After Effects: Importar > primeiro PNG > 'Sequência PNG'.",
      "- DaVinci Resolve: arraste a pasta para o Media Pool (ele junta a sequência sozinho).",
      "- Final Cut Pro: importe a pasta; ou use o Motion/Compressor para virar ProRes 4444.",
      `Se o programa perguntar a taxa de quadros, use ${input.fps}.`,
    ].join("\n");
    const blob = await makeZip([
      ...pngs.map((b, i) => ({ name: `${base}/${base}_${String(i + 1).padStart(pad, "0")}.png`, data: b })),
      { name: `${base}/LEIA-ME.txt`, data: readme },
    ]);
    return { blob, filename: `${base}-sem-fundo.zip` };
  }
  const blob = await result.getBlob();
  return { blob, filename: `${base}${type === "mp4-green" ? "-fundo-verde" : transparent ? "-sem-fundo" : ""}.${container}` };
}

/** Renderiza um quadro como PNG com fundo transparente. */
export async function renderPngInBrowser(preset: Preset, values: Values, format: FormatId, frame: number): Promise<Blob> {
  const input = buildInput(preset, values, format);
  const composition = {
    id: "Preset", component: PresetVideo, durationInFrames: input.durationInFrames,
    fps: input.fps, width: input.width, height: input.height,
  };
  const result = await renderStillOnWeb({ composition, inputProps: input, frame, licenseKey: "free-license" } as never);
  return (result as { blob: (o: { format: "png" }) => Promise<Blob> }).blob({ format: "png" });
}
