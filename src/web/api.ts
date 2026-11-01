import type { FormatId, Preset, Values } from "../types";

export const STANDALONE = import.meta.env.VITE_STANDALONE === "1";

export async function fetchPresets(): Promise<Preset[]> {
  if (STANDALONE) {
    const mods = import.meta.glob("../../presets/*.json", { eager: true, import: "default" }) as Record<string, Preset>;
    return Object.keys(mods).sort().map((k) => mods[k]);
  }
  const r = await fetch("/api/presets");
  if (!r.ok) throw new Error("Falha ao carregar presets");
  return r.json();
}

export async function fetchExports(): Promise<{ id: string; label: string }[]> {
  return (await fetch("/api/exports")).json();
}

export async function startRender(presetId: string, values: Values, format: FormatId, exportType: string) {
  const r = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presetId, values, format, exportType }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Erro ao iniciar render");
  return data.jobId as string;
}

export async function getJob(id: string): Promise<{ status: string; progress: number; error?: string }> {
  return (await fetch(`/api/render/${id}`)).json();
}
