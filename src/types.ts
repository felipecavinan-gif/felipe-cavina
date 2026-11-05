export type FieldType = "text" | "textarea" | "color" | "number" | "select" | "toggle" | "font" | "image";

export interface PresetField {
  key: string;
  label: string;
  type: FieldType;
  default: string | number | boolean;
  options?: { value: string; label: string }[];
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
  /** Campo de imagem: permite ficar vazio (ex.: "sem foto, usar inicial"). */
  allowEmpty?: boolean;
}

export type FormatId = "16:9" | "9:16" | "1:1" | "4:5";

export interface Preset {
  id: string;
  name: string;
  category: string;
  description?: string;
  tags?: string[];
  /** Id do estilo (componente React em src/styles) */
  style: string;
  fps: number;
  durationInFrames: number;
  formats: FormatId[];
  fields: PresetField[];
  /** Aba da galeria: "templates" (padrão) ou "letterings" */
  kind?: "templates" | "letterings";
  /** Valores fixos passados ao estilo, que o usuário não edita */
  props?: Record<string, unknown>;
}

export type Values = Record<string, any>;

export interface RenderInput {
  [key: string]: unknown;
  style: string;
  values: Values;
  fps: number;
  durationInFrames: number;
  width: number;
  height: number;
}

export const FORMATS: Record<FormatId, { width: number; height: number; label: string }> = {
  "16:9": { width: 1920, height: 1080, label: "Horizontal 16:9 (YouTube)" },
  "9:16": { width: 1080, height: 1920, label: "Vertical 9:16 (Reels/TikTok/Shorts)" },
  "1:1": { width: 1080, height: 1080, label: "Quadrado 1:1" },
  "4:5": { width: 1080, height: 1350, label: "Retrato 4:5 (Feed)" },
};

export function defaultValues(p: Preset): Values {
  const v: Values = { ...(p.props ?? {}) };
  for (const f of p.fields) v[f.key] = f.default;
  return v;
}

export function buildInput(p: Preset, values: Values, format: FormatId): RenderInput {
  const dim = FORMATS[format];
  return {
    style: p.style,
    values: { ...(p.props ?? {}), ...values },
    fps: p.fps,
    durationInFrames: p.durationInFrames,
    width: dim.width,
    height: dim.height,
  };
}
