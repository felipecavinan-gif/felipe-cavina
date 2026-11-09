import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { FORMATS, buildInput, defaultValues, type CustomFrame, type FormatId, type Preset, type Values } from "../src/types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRESETS_DIR = path.join(ROOT, "presets");
const OUT_DIR = path.join(ROOT, "out");
/** Pasta onde todo vídeo exportado fica salvo (Filmes/Anakin no Mac, Vídeos/Anakin no Windows). */
const LIBRARY_DIR = process.env.MOTION_LIBRARY_DIR || path.join(os.homedir(), process.platform === "darwin" ? "Movies" : "Videos", "Anakin");
const PORT = Number(process.env.PORT ?? 3001);
const BROWSER = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const CONCURRENCY = process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : null;
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(LIBRARY_DIR, { recursive: true });

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
  mp4: { label: "MP4 (abre em qualquer aparelho)", ext: "mp4", opts: { codec: "h264", crf: 18, pixelFormat: "yuv420p" } },
  "mov-alpha": { label: "MOV sem fundo (ProRes 4444: abre no Finder, QuickTime e Premiere)", ext: "mov", opts: { codec: "prores", proResProfile: "4444", pixelFormat: "yuva444p10le", imageFormat: "png" } },
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
type Job = { id: string; status: "queued" | "rendering" | "done" | "error"; progress: number; file?: string; filename?: string; error?: string; created: number; seconds?: number };
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
        if (f.allowEmpty && x === "") v[f.key] = "";
        else if (typeof x === "string" && (/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(x) || /^builtin:[a-z]+$/.test(x) || /^https?:\/\//.test(x)) && x.length < 20e6) v[f.key] = x;
      } else if (f.type === "srt") {
        if (typeof x === "string") v[f.key] = x.slice(0, 400_000);
      } else if (typeof x === "string") v[f.key] = x.slice(0, f.maxLength ?? 500);
    }
  }
  const dur = Number((input as Record<string, unknown> | undefined)?._duration);
  if (Number.isFinite(dur) && dur >= 1 && dur <= 30) v._duration = dur;
  if ((input as Record<string, unknown> | undefined)?._safe === false) v._safe = false;
  return v;
}

async function runJob(job: Job, preset: Preset, values: Values, format: FormatId, exp: ExportId, custom?: CustomFrame) {
  job.status = "rendering";
  try {
    const serveUrl = await getBundle();
    const inputProps = buildInput(preset, values, format, custom);
    const composition = await selectComposition({ serveUrl, id: "Preset", inputProps, browserExecutable: BROWSER });
    const e = EXPORTS[exp];
    // nome legível e único, salvo na pasta da biblioteca (fica no Finder)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const size = custom ? `${inputProps.width}x${inputProps.height}` : format.replace(":", "x");
    const filename = `${preset.id}-${size}-${stamp}.${e.ext}`;
    const file = path.join(LIBRARY_DIR, filename);
    job.seconds = inputProps.durationInFrames / inputProps.fps;
    await renderMedia({
      serveUrl, composition, inputProps, outputLocation: file, browserExecutable: BROWSER,
      concurrency: CONCURRENCY, ...(e.opts as object),
      onProgress: ({ progress }: { progress: number }) => { job.progress = progress; },
    } as unknown as Parameters<typeof renderMedia>[0]);
    job.file = file;
    job.filename = filename;
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
  const { presetId, values, format = "16:9", exportType = "mp4", custom } = req.body ?? {};
  const preset = loadPresets().find((p) => p.id === presetId);
  if (!preset) return res.status(404).json({ error: "Preset não encontrado" });
  let frame: CustomFrame | undefined;
  if (custom) {
    const w = Number(custom.width), h = Number(custom.height), f = Number(custom.fps);
    if (!(w >= 16 && w <= 7680 && h >= 16 && h <= 7680 && f >= 1 && f <= 120)) return res.status(400).json({ error: "Tamanho ou fps inválido" });
    frame = { width: w, height: h, fps: f };
  } else if (!(format in FORMATS) || !preset.formats.includes(format)) return res.status(400).json({ error: "Formato inválido" });
  if (!(exportType in EXPORTS)) return res.status(400).json({ error: "Tipo de exportação inválido" });
  const job: Job = { id: crypto.randomUUID(), status: "queued", progress: 0, created: Date.now() };
  jobs.set(job.id, job);
  const clean = sanitize(preset, values);
  queue = queue.then(() => runJob(job, preset, clean, format, exportType, frame));
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
  res.json({ status: j.status, progress: j.progress, error: j.error, path: j.status === "done" ? j.file : undefined, filename: j.filename, seconds: j.seconds });
});

/** Abre a pasta do arquivo no Finder (Mac) ou no Explorer (Windows), com o arquivo selecionado. */
app.post("/api/render/:id/reveal", (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j?.file || j.status !== "done") return res.status(404).json({ error: "Arquivo não disponível" });
  const cmd = process.platform === "darwin" ? ["open", ["-R", j.file]] : process.platform === "win32" ? ["explorer", [`/select,${j.file}`]] : ["xdg-open", [path.dirname(j.file)]];
  const child = spawn(cmd[0] as string, cmd[1] as string[], { detached: true, stdio: "ignore" });
  child.on("error", () => {}); // sem gerenciador de arquivos (ex.: servidor sem tela): ignora
  child.unref();
  res.json({ ok: true });
});

app.get("/api/library", (_req, res) => res.json({ dir: LIBRARY_DIR }));

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
