import React, { useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { ImageField } from "./ImageField";
import { SrtField } from "./SrtField";
import { FORMATS, defaultValues, type FormatId, type Preset, type PresetField, type Values } from "../types";
import { Preview } from "./Preview";
import { STANDALONE, fetchExports, getJob, startRender, renderStillServer, revealInFinder } from "./api";
import { IN_PREMIERE, getSequence, placeInTimeline, type SequenceInfo } from "./premiere";
import { WEB_EXPORTS, renderInBrowser, renderPngInBrowser, type WebExportType } from "./webExport";

declare global {
  interface Window { claude?: { use: (name: string) => Promise<any> } }
}

const Field: React.FC<{ f: PresetField; value: any; onChange: (v: any) => void }> = ({ f, value, onChange }) => {
  switch (f.type) {
    case "srt":
      return <SrtField id={`f-${f.key}`} value={value} onChange={onChange} />;
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
  const [guides, setGuides] = useState(() => { try { return localStorage.getItem("mp:guides") !== "0"; } catch { return true; } });
  const toggleGuides = (on: boolean) => { setGuides(on); try { localStorage.setItem("mp:guides", on ? "1" : "0"); } catch {} };
  const [png, setPng] = useState<{ busy: boolean; error?: string; done?: string }>({ busy: false });

  useEffect(() => { if (STANDALONE) setExports(WEB_EXPORTS); else fetchExports().then(setExports); }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(values)); } catch {} }, [values, storageKey]);
  // letterings: por padrão saem sem fundo (no navegador, PNG animado; no app do computador, MOV)
  useEffect(() => {
    if (values.transparent && !STANDALONE) setExportType("mov-alpha");
    else if (values.transparent && preset.kind === "letterings") setExportType("apng");
    else setExportType("mp4");
  }, [values.transparent, preset.kind]);
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

  // ---------- Premiere (extensão Anakin) ----------
  const isCaptions = preset.fields.some((f) => f.type === "srt");
  const [seq, setSeq] = useState<SequenceInfo | null>(null);
  const [placeAt, setPlaceAt] = useState<"playhead" | "start">(isCaptions ? "start" : "playhead");
  const [track, setTrack] = useState(2);
  const [pp, setPp] = useState<{ busy: boolean; msg?: string; error?: string; progress?: number }>({ busy: false });
  useEffect(() => { if (IN_PREMIERE) getSequence().then(setSeq).catch((e) => setPp({ busy: false, error: e.message })); }, []);

  const addToTimeline = async () => {
    setPp({ busy: true, msg: "Lendo a sequência…" });
    try {
      const s = await getSequence();
      if (!s) throw new Error("Abra uma sequência no Premiere primeiro.");
      setSeq(s);
      const at = placeAt === "start" ? 0 : s.playhead;
      setPp({ busy: true, msg: "Gerando o gráfico…", progress: 0 });
      // sempre sem fundo, no tamanho e fps da sequência
      const jobId = await startRender(preset.id, { ...values, transparent: true }, format, "mov-alpha", { width: s.width, height: s.height, fps: s.fps });
      let j = await getJob(jobId);
      while (j.status === "queued" || j.status === "rendering") {
        await new Promise((r) => setTimeout(r, 700));
        j = await getJob(jobId);
        setPp({ busy: true, msg: "Gerando o gráfico…", progress: j.progress });
      }
      if (j.status !== "done" || !j.path) throw new Error(j.error ?? "Falha ao gerar o gráfico.");
      setPp({ busy: true, msg: "Colocando na timeline…" });
      await placeInTimeline(j.path, at, track);
      setPp({ busy: false, msg: `Adicionado na faixa V${track} em ${at.toFixed(2)}s.` });
    } catch (e) {
      setPp({ busy: false, error: (e as Error).message });
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
          {!preset.fields.some((f) => f.type === "srt") ? (
          <label className="dur">
            Duração
            <input id="duration" type="range" min={1} max={15} step={0.5} value={Number(values._duration) || preset.durationInFrames / preset.fps} onChange={(e) => set("_duration", Number(e.target.value))} />
            <span>{(Number(values._duration) || preset.durationInFrames / preset.fps).toFixed(1)}s</span>
          </label>
          ) : <span className="muted">Duração: igual à legenda</span>}
          {format === "9:16" ? (
            <span className="safe-toggles">
              <label><input id="safe-area" type="checkbox" checked={values._safe !== false} onChange={(e) => set("_safe", e.target.checked)} /> Área segura do Instagram</label>
              <label><input id="safe-guides" type="checkbox" checked={guides} disabled={values._safe === false} onChange={(e) => toggleGuides(e.target.checked)} /> Mostrar guias</label>
            </span>
          ) : null}
          <span className="muted">{FORMATS[format].width}×{FORMATS[format].height} · {preset.fps}fps</span>
        </div>
        <div className={`stage-preview fmt-${format.replace(":", "x")}`}>
          <Preview ref={player} preset={preset} values={values} format={format} guides={guides && values._safe !== false} />
        </div>
        {IN_PREMIERE ? (
          <div className="premiere">
            <div className="premiere-head">
              <b>Premiere</b>
              <span className="muted">{seq ? `${seq.name} · ${seq.width}×${seq.height} · ${seq.fps.toFixed(2)} fps` : "Nenhuma sequência aberta"}</span>
            </div>
            <div className="premiere-row">
              <select id="pp-at" value={placeAt} onChange={(e) => setPlaceAt(e.target.value as "playhead" | "start")}>
                <option value="playhead">No ponto de reprodução</option>
                <option value="start">No início da sequência</option>
              </select>
              <select id="pp-track" value={track} onChange={(e) => setTrack(Number(e.target.value))}>
                {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Faixa V{n}</option>)}
              </select>
              <button className="primary" disabled={pp.busy} onClick={addToTimeline}>
                {pp.busy ? `${pp.msg ?? ""} ${pp.progress != null ? Math.round(pp.progress * 100) + "%" : ""}` : "Adicionar à timeline"}
              </button>
            </div>
            {pp.error && <span className="err">{pp.error}</span>}
            {!pp.busy && pp.msg && <span className="muted">{pp.msg}</span>}
          </div>
        ) : null}
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
          {render?.status === "done" && !STANDALONE && (
            <>
              <button className="ghost" onClick={() => revealInFinder(render.jobId)}>Mostrar no Finder</button>
              <a className="muted" href={`/api/render/${render.jobId}/file`}>Baixar de novo</a>
            </>
          )}
          {STANDALONE && saved && render?.status !== "rendering" && (
            <button className="ghost" onClick={() => saveFile(saved)}>Salvar {saved.filename} ({(saved.blob.size / 1e6).toFixed(1)} MB)</button>
          )}
          {render?.status === "error" && <span className="err">Erro: {render.error}</span>}
          {png.error && <span className="err">PNG: {png.error}</span>}
          {png.done && !png.busy && <span className="muted">{png.done} Pause o preview no momento que quiser antes de baixar.</span>}
          {values.transparent && exportType === "mp4" && <span className="muted">{STANDALONE ? "O MP4 sai com a cor de fundo. Para vídeo sem fundo (.mov), use o app Anakin no computador." : "O MP4 sai com a cor de fundo. Para vídeo sem fundo, escolha MOV."}</span>}
          {exportType === "png-zip" && <span className="muted">Baixa uma pasta ZIP com uma imagem por quadro (não é vídeo).</span>}
          {exportType === "apng" && <span className="muted">Um único .png animado com fundo transparente.</span>}
          {exportType === "webm-alpha" && <span className="warn">WebM não abre no QuickTime do Mac. Para algo universal, use MP4 ou a sequência PNG.</span>}
        </div>
      </section>
    </main>
  );
};
