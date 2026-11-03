import React, { useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { defaultValues, type FormatId, type Preset } from "../types";
import { Preview } from "./Preview";

const Card: React.FC<{ preset: Preset; format: FormatId }> = ({ preset, format }) => {
  const ref = useRef<PlayerRef>(null);
  const values = useMemo(() => defaultValues(preset), [preset]);
  const fmt = preset.formats.includes(format) ? format : preset.formats[0];
  return (
    <a
      className="card"
      href={`#${preset.id}`}
      onMouseEnter={() => ref.current?.play()}
      onMouseLeave={() => { ref.current?.pause(); ref.current?.seekTo(Math.floor(preset.durationInFrames * 0.6)); }}
    >
      <div className={`card-media fmt-${fmt.replace(":", "x")}`}>
        <Preview ref={ref} preset={preset} values={values} format={fmt} controls={false} autoPlay={false} initialFrame={Math.floor(preset.durationInFrames * 0.6)} />
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className="card-cat">{preset.category}</span>
          {preset.fields.some((f) => f.type === "image") && <span className="badge">+ sua imagem</span>}
        </div>
        <div className="card-title">{preset.name}</div>
        {preset.description && <div className="card-desc">{preset.description}</div>}
      </div>
    </a>
  );
};

/** Ordem das classes na galeria. Categorias que não estão aqui vão para o final. */
const CLASS_ORDER = [
  "Texto flick", "Texto câmera 3D", "Texto zoom", "Câmera 3D", "Motion agressivo", "Cinematográfico", "Fundo animado",
  "Tipografia animada", "Títulos", "Lower thirds", "Números e dados", "Listas", "Citações", "CTA / Redes sociais",
];
const rank = (c: string) => (CLASS_ORDER.indexOf(c) + 1 || 99);

export const Gallery: React.FC<{ presets: Preset[] }> = ({ presets }) => {
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const [format, setFormat] = useState<FormatId>("16:9");
  const cats = useMemo(() => ["Todos", ...Array.from(new Set(presets.map((p) => p.category))).sort((a, b) => rank(a) - rank(b))], [presets]);
  const list = presets.filter(
    (p) =>
      (cat === "Todos" || p.category === cat) &&
      (!q || `${p.name} ${p.description ?? ""} ${p.category} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <main className="gallery">
      <div className="filters">
        <input className="search" placeholder="Buscar template…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          {cats.map((c) => (
            <button key={c} className={`chip ${c === cat ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="seg">
          {(["16:9", "9:16", "1:1"] as FormatId[]).map((f) => (
            <button key={f} className={f === format ? "on" : ""} onClick={() => setFormat(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="count">{list.length} templates · passe o mouse para ver a animação</div>
      {cat === "Todos" && !q ? (
        cats.slice(1).map((c) => {
          const items = list.filter((p) => p.category === c);
          return (
            <section key={c} className="klass">
              <h2>{c} <span>{items.length}</span></h2>
              <div className={`grid grid-${format.replace(":", "x")}`}>
                {items.map((p) => <Card key={p.id} preset={p} format={format} />)}
              </div>
            </section>
          );
        })
      ) : (
        <div className={`grid grid-${format.replace(":", "x")}`}>
          {list.map((p) => <Card key={p.id} preset={p} format={format} />)}
        </div>
      )}
    </main>
  );
};
