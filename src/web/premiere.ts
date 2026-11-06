/**
 * Ponte com a extensão Anakin do Premiere Pro.
 * O painel do Premiere abre esta página num iframe (?premiere=1) e conversa por postMessage:
 * - pede as informações da sequência ativa (tamanho, fps, ponto de reprodução);
 * - recebe o caminho do .mov renderizado e o coloca na timeline.
 */
export type SequenceInfo = { name: string; width: number; height: number; fps: number; playhead: number; videoTracks: number };

export const IN_PREMIERE = typeof window !== "undefined" && window.parent !== window && new URLSearchParams(location.search).has("premiere");

let seq: SequenceInfo | null = null;
const waiters: Record<string, ((d: any) => void)[]> = {};

if (IN_PREMIERE) {
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || typeof d !== "object" || typeof d.type !== "string" || !d.type.startsWith("anakin:")) return;
    if (d.type === "anakin:sequence") seq = d.seq ?? null;
    (waiters[d.type] ?? []).splice(0).forEach((fn) => fn(d));
  });
}

function ask<T>(msg: Record<string, unknown>, reply: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("O Premiere não respondeu. Verifique se há uma sequência aberta.")), timeoutMs);
    (waiters[reply] ??= []).push((d) => { clearTimeout(t); resolve(d as T); });
    window.parent.postMessage(msg, "*");
  });
}

export async function getSequence(): Promise<SequenceInfo | null> {
  if (!IN_PREMIERE) return null;
  const d = await ask<{ seq: SequenceInfo | null; error?: string }>({ type: "anakin:getSequence" }, "anakin:sequence");
  if (d.error) throw new Error(d.error);
  return d.seq;
}

export function lastSequence() { return seq; }

export async function placeInTimeline(path: string, atSeconds: number, track: number): Promise<void> {
  const d = await ask<{ ok: boolean; error?: string }>({ type: "anakin:place", path, at: atSeconds, track }, "anakin:placed", 60000);
  if (!d.ok) throw new Error(d.error ?? "Não foi possível colocar na timeline.");
}
