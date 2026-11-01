/**
 * Gera um frame (still) de cada preset em cada formato, para revisão visual rápida.
 * Uso: npx tsx scripts/preview-all.ts [pasta-saida] [formatos=16:9,9:16]
 */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { buildInput, defaultValues, type FormatId, type Preset } from "../src/types";

const out = path.resolve(process.argv[2] ?? "out/previews");
const formats = (process.argv[3] ?? "16:9,9:16").split(",") as FormatId[];
const only = process.argv[4] ? new RegExp(process.argv[4]) : null;
const at = Number(process.argv[5] ?? 0.62);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
fs.mkdirSync(out, { recursive: true });

const presets: Preset[] = fs
  .readdirSync("presets")
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join("presets", f), "utf8")) as Preset)
  .filter((p) => !only || only.test(p.id));

const serveUrl = await bundle({ entryPoint: path.resolve("src/remotion/index.ts") });
for (const p of presets) {
  for (const fmt of formats) {
    if (!p.formats.includes(fmt)) continue;
    const inputProps = buildInput(p, { ...defaultValues(p), transparent: false }, fmt);
    const composition = await selectComposition({ serveUrl, id: "Preset", inputProps, browserExecutable });
    const file = path.join(out, `${p.id}_${fmt.replace(":", "x")}.png`);
    await renderStill({ serveUrl, composition, inputProps, output: file, frame: Math.floor(p.durationInFrames * at), browserExecutable });
    console.log("✓", path.basename(file));
  }
}
