/**
 * Renderiza um quadro de um preset com valores personalizados (para testar ajustes).
 * Uso: npx tsx scripts/still-with-values.ts <presetId> <formato> <quadro> <saida.png> '<json de valores>'
 */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { buildInput, defaultValues, type FormatId, type Preset } from "../src/types";

const [id, fmt, frame, out, json] = process.argv.slice(2);
const preset: Preset = JSON.parse(fs.readFileSync(path.join("presets", `${id}.json`), "utf8"));
const values = { ...defaultValues(preset), transparent: false, ...(json ? JSON.parse(json) : {}) };
const serveUrl = await bundle({ entryPoint: path.resolve("src/remotion/index.ts") });
const inputProps = buildInput(preset, values, fmt as FormatId);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const composition = await selectComposition({ serveUrl, id: "Preset", inputProps, browserExecutable });
await renderStill({ serveUrl, composition, inputProps, output: out, frame: Number(frame), browserExecutable });
console.log("ok", out);
