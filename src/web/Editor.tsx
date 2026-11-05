import React, { useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { ImageField } from "./ImageField";
import { FORMATS, defaultValues, type FormatId, type Preset, type PresetField, type Values } from "../types";
import { Preview } from "./Preview";
import { STANDALONE, fetchExports, getJob, startRender, renderStillServer } from "./api";
import { WEB_EXPORTS, renderInBrowser, renderPngInBrowser, type WebExportType } from "./webExport";

declare global {
  interface Window { claude?: { use: (name: string) => Promise<any> } }
}

const Field: React.FC<{ f: PresetField; value: any; onChange: (v: any) => void }> = ({ f, value, onChange }) => {
  switch (f.type) {
    case "image":
      return <ImageField id={`f-${f.key}`} value={value} onChange={onChange} samples={f.options} allowEmpty={f.allowEmpty} emptyLabel={f.help ? undefined : "Sem foto (usar inicial)"} />;
    case "textarea":
      return <textarea id={`f-${f.key}`} rows={3} maxLength={f.maxLength} value={value} onChange={(e) => onChange(e.target.value)} />;
    case "color":
      return (
        <div className="color">
          <input id={`f-${f.key}`} type="color" value={String(value).slice(0, 7)} onChange={(e) => onChange(e.target.value)} />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "number":
      return <input id={`f-${f.key}`} type="number" min={f.min} max={f.max} step={f.step ?? 1} value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    case "toggle":
      return (
        <label className="toggle">
          <input id={`f-${f.key}`} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{value ? "Sim" : "Não"}</span>
        </label>
      );
    case "select":
    case "font":
      return (
        <select id={`f-${f.key}`} value={value} onChange={(e) => onChange(e.target.value)}>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    default:
      return <input id={`f-${f.key}`} type="text" maxLength={f.maxLength} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
};

type RenderState = { jobId: string; status: string; progress: number; error?: string } | null;

export const Editor: React.FC<{ preset: Preset }> = ({ preset }) => {
  const storageKey = `mp:${preset.id}`;
  const [values, setValues] = useState<Values>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...defaultValues(preset), ...JSON.parse(saved) };
    } catch {}
    return defaultValues(preset);
  });
  const [format, setFormat] = useState<FormatId>(preset.formats[0]);
  const [exports, setExports] = useState<{ id: string; label: string }[]>([]);
  const [exportType, setExportType] = useState("mp4");
  const [render, setRender] = useState<RenderState>(null);
  const poll = useRef<number | undefined>(undefined);
  const player = useRef<PlayerRef>(null);
  const [png, setPng] = useState<{ busy: boolean; error?: string; done?: string }>({ busy: false });

  useEffect(() => { if (STANDALONE) setExports(WEB_EXPORTS); else fetchExports().then(setExports); }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(values)); } catch {} }, [values, storageKey]);
  useEffect(() => { setExportType(values.transparent ? (STANDALONE ? "png-zip" : "mov-alpha") : "mp4"); }, [values.transparent]);
  useEffect(() => () => window.clearInterval(poll.current), []);

  const set = (k: string, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const [saved, setSaved] = useState<{ blob: Blob; filename: string } | null>(null);

  const saveFile = async (file: { blob: Blob; filename: string }) => {
    const downloads = await window.claude?.use("downloads").catch(() => null);
    if (downloads) {
      try {
        await downloads.save({ filename: file.filename, data: file.blob });
        setRender((r) => r && { ...r, status: "done" });
      } catch (e: any) {
        if (e?.code !== "declined") setRender((r) => r && { ...r, status: "error", error: e?.message ?? "Não foi possível salvar o arquivo." });
      }
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file.blob);
    a.download = file.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  };

  const doExport = async () => {
    if (STANDALONE) {
      setSaved(null);
      setRender({ jobId: "web", status: "rendering", progress: 0 });
      try {
        const file = await renderInBrowser(preset, values, format, exportType as WebExportType, (p) =>
          setRender((r) => r && { ...r, progress: p }));
        setSaved(file);
        setRender({ jobId: "web", status: "ready", progress: 1 });
        await saveFile(file);
      } catch (e) {
        setRender({ jobId: "web", status: "error", progress: 0, error: (e as Error).message });
      }
      return;
    }
    try {
      const jobId = await startRender(preset.id, values, format, exportType);
      setRender({ jobId, status: "queued", progress: 0 });
      window.clearInterval(poll.current);
      poll.current = window.setInterval(async () => {
        const j = await getJob(jobId);
        setRender({ jobId, ...j });
        if (j.status === "done" || j.status === "error") {
          window.clearInterval(poll.current);
          if (j.status === "done") location.href = `/api/render/${jobId}/file`;
        }
      }, 700);
    } catch (e) {
      setRender({ jobId: "", status: "error", progress: 0, error: (e as Error).message });
    }
  };

  const doPng = async () => {
    const frame = player.current?.getCurrentFrame() ?? Math.floor(preset.durationInFrames * 0.6);
    player.current?.pause();
    setPng({ busy: true });
    try {
      const pngValues = { ...values, transparent: true };
      const filename = `${preset.id}-${format.replace(":", "x")}-quadro${frame}.png`;
      if (STANDALONE) {
        const blob = await renderPngInBrowser(preset, pngValues, format, frame);
        await saveFile({ blob, filename });
      } else {
        const blob = await renderStillServer(preset.id, pngValues, format, frame);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
      }
      setPng({ busy: false, done: `Quadro ${frame} exportado sem fundo.` });
    } catch (e) {
      setPng({ busy: false, error: (e as Error).message });
    }
  };

  const busy = render && (render.status === "queued" || render.status === "rendering");

  return (
    <main className="editor">
      <aside className="panel">
        <a href="#" className="back">← Todos os templates</a>
        <div className="card-cat">{preset.category}</div>
        <h1>{preset.name}</h1>
        {preset.description && <p className="muted">{preset.description}</p>}
        <div className="fields">
          {preset.fields.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`f-${f.key}`}>{f.label}</label>
              <Field f={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
              {f.help && <small className="muted">{f.help}</small>}
            </div>
          ))}
        </div>
        <button className="ghost" onClick={() => setValues(defaultValues(preset))}>Restaurar padrão</button>
      </aside>

      <section className="stage">
        <div className="stage-bar">
          <div className="seg">
            {preset.formats.map((f) => (
              <button key={f} title={FORMATS[f].label} className={f === format ? "on" : ""} onClick={() => setFormat(f)}>{f}</button>
            ))}
          </div>
          <label className="dur">
            Duração
            <input id="duration" type="range" min={1} max={15} step={0.5} value={Number(values._duration) || preset.durationInFrames / preset.fps} onChange={(e) => set("_duration", Number(e.target.value))} />
            <span>{(Number(values._duration) || preset.durationInFrames / preset.fps).toFixed(1)}s</span>
          </label>
          <span className="muted">{FORMATS[format].width}×{FORMATS[format].height} · {preset.fps}fps</span>
        </div>
        <div className={`stage-preview fmt-${format.replace(":", "x")}`}>
          <Preview ref={player} preset={preset} values={values} format={format} />
        </div>
        <div className="export">
          <select value={exportType} onChange={(e) => setExportType(e.target.value)}>
            {exports.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          <button className="primary" disabled={!!busy} onClick={doExport}>
            {busy ? `Renderizando… ${Math.round((render!.progress ?? 0) * 100)}%` : "Exportar vídeo"}
          </button>
          <button className="ghost" disabled={png.busy} onClick={doPng} title="Exporta o quadro atual do preview como PNG transparente, com todos os elementos e textos">
            {png.busy ? "Gerando PNG…" : "Baixar PNG sem fundo"}
          </button>
          {busy && <div className="bar"><div style={{ width: `${(render!.progress ?? 0) * 100}%` }} /></div>}
          {render?.status === "done" && !STANDALONE && <a className="muted" href={`/api/render/${render.jobId}/file`}>Download iniciado. Clique aqui se não começou.</a>}
          {STANDALONE && saved && render?.status !== "rendering" && (
            <button className="ghost" onClick={() => saveFile(saved)}>Salvar {saved.filename} ({(saved.blob.size / 1e6).toFixed(1)} MB)</button>
          )}
          {render?.status === "error" && <span className="err">Erro: {render.error}</span>}
          {png.error && <span className="err">PNG: {png.error}</span>}
          {png.done && !png.busy && <span className="muted">{png.done} Pause o preview no momento que quiser antes de baixar.</span>}
          {values.transparent && exportType === "mp4" && <span className="warn">MP4 não tem transparência: o fundo sai preto. Para sem fundo, use a sequência PNG (ZIP).</span>}
          {exportType === "png-zip" && <span className="muted">Abre em Mac, Windows e celular. Importe no editor como sequência de imagens.</span>}
          {exportType === "webm-alpha" && <span className="warn">WebM não abre no QuickTime do Mac. Para algo universal, use MP4 ou a sequência PNG.</span>}
        </div>
      </section>
    </main>
  );
};
