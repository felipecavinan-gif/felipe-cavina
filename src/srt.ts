/** Leitura de legendas .srt (e .vtt simples). Tempos em segundos. */
export type Cue = { start: number; end: number; text: string };

function toSec(t: string) {
  const m = t.trim().replace(",", ".").match(/(?:(\d+):)?(\d+):(\d+)(?:\.(\d+))?/);
  if (!m) return NaN;
  const [, h = "0", mi, s, ms = "0"] = m;
  return Number(h) * 3600 + Number(mi) * 60 + Number(s) + Number(`0.${ms}`);
}

export function parseSrt(src: unknown): Cue[] {
  const text = String(src ?? "").replace(/\r/g, "").replace(/^﻿/, "").replace(/^WEBVTT[^\n]*\n/, "");
  const cues: Cue[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const ti = lines.findIndex((l) => l.includes("-->"));
    if (ti < 0) continue;
    const [a, b] = lines[ti].split("-->");
    const start = toSec(a), end = toSec(b);
    const body = lines.slice(ti + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && body) cues.push({ start, end, text: body });
  }
  return cues.sort((x, y) => x.start - y.start);
}

export function srtDuration(src: unknown): number {
  const c = parseSrt(src);
  return c.length ? c[c.length - 1].end + 0.6 : 0;
}
