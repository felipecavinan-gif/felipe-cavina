import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { FORMATS, buildInput, defaultValues, type FormatId, type Preset, type Values } from "../src/types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRESETS_DIR = path.join(ROOT, "presets");
const OUT_DIR = path.join(ROOT, "out");
const PORT = Number(process.env.PORT ?? 3001);
const BROWSER = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const CONCURRENCY = process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : null;
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Presets (lidos do disco a cada requisição: basta soltar um JSON novo na pasta) ----------
function loadPresets(): Preset[] {
  const list: Preset[] = [];
  for (const file of fs.readdirSync(PRESETS_DIR).filter((f) => f.endsWith(".json")).sort()) {
    try {
      const p = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, file), "utf8")) as Preset;
      if (!p.id || !p.style || !Array.isArray(p.fields)) throw new Error("faltam id/style/fields");
      list.push(p);
    } catch (e) {
      console.warn(`[presets] ignorando ${file}: ${(e as Error).message}`);
    }
  }
  return list;
}

// ---------- Export formats ----------
const EXPORTS = {
  mp4: { label: "MP4 (H.264)", ext: "mp4", opts: { codec: "h264", crf: 18 } },
  "mov-alpha": { label: "MOV ProRes 4444 (transparente)", ext: "mov", opts: { codec: "prores", proResProfile: "4444", pixelFormat: "yuva444p10le", imageFormat: "png" } },
  "webm-alpha": { label: "WebM VP9 (transparente)", ext: "webm", opts: { codec: "vp9", pixelFormat: "yuva420p", imageFormat: "png" } },
  gif: { label: "GIF", ext: "gif", opts: { codec: "gif", everyNthFrame: 2 } },
} as const;
type ExportId = keyof typeof EXPORTS;

// ---------- Bundle (uma vez) ----------
let bundlePromise: Promise<string> | null = null;
function getBundle() {
  bundlePromise ??= bundle({ entryPoint: path.join(ROOT, "src/remotion/index.ts") }).catch((e) => {
    bundlePromise = null;
    throw e;
  });
  return bundlePromise;
}

// ---------- Jobs ----------
type Job = { id: string; status: "queued" | "rendering" | "done" | "error"; progress: number; file?: string; filename?: string; error?: string; created: number };
const jobs = new Map<string, Job>();
let queue: Promise<unknown> = Promise.resolve();

function sanitize(p: Preset, input: unknown): Values {
  const v = defaultValues(p);
  if (input && typeof input === "object") {
    for (const f of p.fields) {
      const x = (input as Record<string, unknown>)[f.key];
      if (x === undefined) continue;
      if (f.type === "number") {
        const n = Number(x);
        if (Number.isFinite(n)) v[f.key] = Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, n));
      } else if (f.type === "toggle") v[f.key] = Boolean(x);
      else if (f.type === "select" || f.type === "font") {
        if (f.options?.some((o) => o.value === x)) v[f.key] = x;
      } else if (f.type === "color") {
        if (typeof x === "string" && /^#[0-9a-fA-F]{3,8}$/.test(x)) v[f.key] = x;
      } else if (f.type === "image") {
        if (typeof x === "string" && (/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(x) || /^builtin:[a-z]+$/.test(x) || /^https?:\/\//.test(x)) && x.length < 20e6) v[f.key] = x;
      } else if (typeof x === "string") v[f.key] = x.slice(0, f.maxLength ?? 500);
    }
  }
  return v;
}

async function runJob(job: Job, preset: Preset, values: Values, format: FormatId, exp: ExportId) {
  job.status = "rendering";
  try {
    const serveUrl = await getBundle();
    const inputProps = buildInput(preset, values, format);
    const composition = await selectComposition({ serveUrl, id: "Preset", inputProps, browserExecutable: BROWSER });
    const e = EXPORTS[exp];
    const file = path.join(OUT_DIR, `${job.id}.${e.ext}`);
    await renderMedia({
      serveUrl, composition, inputProps, outputLocation: file, browserExecutable: BROWSER,
      concurrency: CONCURRENCY, ...(e.opts as object),
      onProgress: ({ progress }: { progress: number }) => { job.progress = progress; },
    } as unknown as Parameters<typeof renderMedia>[0]);
    job.file = file;
    job.filename = `${preset.id}-${format.replace(":", "x")}.${e.ext}`;
    job.status = "done";
    job.progress = 1;
  } catch (err) {
    console.error(err);
    job.status = "error";
    job.error = (err as Error).message;
  }
}

// Limpa renders com mais de 1h
setInterval(() => {
  for (const [id, j] of jobs) {
    if (Date.now() - j.created > 3600_000) {
      if (j.file) fs.rm(j.file, { force: true }, () => {});
      jobs.delete(id);
    }
  }
}, 600_000).unref();

// ---------- API ----------
const app = express();
app.use(express.json({ limit: "25mb" }));

app.get("/api/presets", (_req, res) => res.json(loadPresets()));
app.get("/api/exports", (_req, res) => res.json(Object.entries(EXPORTS).map(([id, e]) => ({ id, label: e.label }))));

app.post("/api/render", (req, res) => {
  const { presetId, values, format = "16:9", exportType = "mp4" } = req.body ?? {};
  const preset = loadPresets().find((p) => p.id === presetId);
  if (!preset) return res.status(404).json({ error: "Preset não encontrado" });
  if (!(format in FORMATS) || !preset.formats.includes(format)) return res.status(400).json({ error: "Formato inválido" });
  if (!(exportType in EXPORTS)) return res.status(400).json({ error: "Tipo de exportação inválido" });
  const job: Job = { id: crypto.randomUUID(), status: "queued", progress: 0, created: Date.now() };
  jobs.set(job.id, job);
  const clean = sanitize(preset, values);
  queue = queue.then(() => runJob(job, preset, clean, format, exportType));
  res.json({ jobId: job.id });
});

app.post("/api/still", async (req, res) => {
  const { presetId, values, format = "16:9", frame = 0 } = req.body ?? {};
  const preset = loadPresets().find((p) => p.id === presetId);
  if (!preset) return res.status(404).json({ error: "Preset não encontrado" });
  if (!(format in FORMATS)) return res.status(400).json({ error: "Formato inválido" });
  const f = Math.max(0, Math.min(preset.durationInFrames - 1, Math.floor(Number(frame) || 0)));
  const clean = { ...sanitize(preset, values), transparent: true };
  const file = path.join(OUT_DIR, `${crypto.randomUUID()}.png`);
  try {
    const serveUrl = await getBundle();
    const inputProps = buildInput(preset, clean, format);
    const composition = await selectComposition({ serveUrl, id: "Preset", inputProps, browserExecutable: BROWSER });
    await renderStill({ serveUrl, composition, inputProps, output: file, frame: f, imageFormat: "png", browserExecutable: BROWSER });
    res.download(file, `${preset.id}-quadro${f}.png`, () => fs.rm(file, { force: true }, () => {}));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/render/:id", (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ error: "Job não encontrado" });
  res.json({ status: j.status, progress: j.progress, error: j.error });
});

app.get("/api/render/:id/file", (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j?.file || j.status !== "done") return res.status(404).json({ error: "Arquivo não disponível" });
  res.download(j.file, j.filename!);
});

if (process.env.NODE_ENV === "production") {
  const dist = path.join(ROOT, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`API em http://localhost:${PORT}`);
  getBundle().then(() => console.log("Bundle do Remotion pronto")).catch((e) => console.error("Falha no bundle:", e));
});
