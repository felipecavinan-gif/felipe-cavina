import { renderMediaOnWeb, canRenderMediaOnWeb, renderStillOnWeb } from "@remotion/web-renderer";
import { PresetVideo } from "../remotion/PresetVideo";
import { buildInput, type FormatId, type Preset, type Values } from "../types";

export type WebExportType = "mp4" | "webm" | "webm-alpha";

export const WEB_EXPORTS: { id: WebExportType; label: string }[] = [
  { id: "mp4", label: "MP4 (H.264)" },
  { id: "webm", label: "WebM (VP8)" },
  { id: "webm-alpha", label: "WebM transparente" },
];

/** Renderiza o vídeo no próprio navegador (sem servidor) e devolve o arquivo. */
export async function renderInBrowser(
  preset: Preset, values: Values, format: FormatId, type: WebExportType,
  onProgress: (p: number) => void, signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const input = buildInput(preset, values, format);
  const container = type === "mp4" ? "mp4" : "webm";
  const transparent = type === "webm-alpha";
  const videoCodec: "h264" | "vp8" | "vp9" = type === "mp4" ? "h264" : transparent ? "vp9" : "vp8";
  const composition = {
    id: "Preset", component: PresetVideo, durationInFrames: input.durationInFrames,
    fps: input.fps, width: input.width, height: input.height,
  };
  const check = await canRenderMediaOnWeb({ container, videoCodec, width: input.width, height: input.height, transparent, muted: true }).catch(() => null);
  if (check && !check.canRender) {
    const msg = check.issues.filter((i) => i.severity === "error").map((i) => i.message).join(" ");
    throw new Error(`Este navegador não consegue gerar ${type.toUpperCase()}. ${msg} Tente outro formato.`);
  }
  const result = await renderMediaOnWeb({
    composition, inputProps: input, container, videoCodec, transparent, muted: true,
    videoBitrate: "very-high",
    onProgress: ({ progress }: { progress: number }) => onProgress(progress),
    signal: signal ?? null,
    licenseKey: "free-license",
  } as never);
  const blob = await result.getBlob();
  return { blob, filename: `${preset.id}-${format.replace(":", "x")}${transparent ? "-alpha" : ""}.${container}` };
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
