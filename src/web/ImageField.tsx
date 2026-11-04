import React, { useRef, useState } from "react";
import { BUILTIN_IMAGES, resolveImage } from "../images";
import { STANDALONE } from "./api";

const SAMPLES: { id: string; label: string }[] = [
  { id: "perfume", label: "Perfume" },
  { id: "headphones", label: "Fone" },
  { id: "bag", label: "Bolsa" },
];

/** Reduz a imagem para no máximo `max` px no maior lado, mantendo a transparência (PNG). */
async function fileToDataUrl(file: File, max = 1400): Promise<string> {
  const raw: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Não foi possível ler o arquivo."));
    r.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml") return raw;
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Formato de imagem não suportado. Use PNG, JPG, WebP ou SVG."));
    img.src = raw;
  });
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  if (k === 1 && file.size < 1.5e6) return raw;
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

export const ImageField: React.FC<{ id: string; value: string; onChange: (v: string) => void; samples?: { value: string; label: string }[]; allowEmpty?: boolean; emptyLabel?: string }> = ({ id, value, onChange, samples, allowEmpty, emptyLabel }) => {
  const list = samples?.length ? samples.map((s) => ({ id: s.value.replace(/^builtin:/, ""), label: s.label })) : SAMPLES;
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState(value?.startsWith("http") ? value : "");
  const pick = async (f?: File) => {
    if (!f) return;
    setErr(null);
    try { onChange(await fileToDataUrl(f)); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <div className="imgfield">
      <div className="imgfield-row">
        <div className="imgfield-thumb checker">{value || !allowEmpty ? <img src={resolveImage(value)} alt="" /> : <span className="muted">sem foto</span>}</div>
        <div className="imgfield-actions">
          <button type="button" className="primary small" onClick={() => input.current?.click()}>{allowEmpty ? "Enviar foto" : "Enviar imagem"}</button>
          <input id={id} ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <div className="samples">
            {list.map((s) => (
              <button type="button" key={s.id} className={`chip ${value === `builtin:${s.id}` ? "on" : ""}`} onClick={() => onChange(`builtin:${s.id}`)} title={`Usar exemplo: ${s.label}`}>
                <img src={BUILTIN_IMAGES[s.id]} alt="" /> {s.label}
              </button>
            ))}
            {allowEmpty ? (
              <button type="button" className={`chip ${!value ? "on" : ""}`} onClick={() => onChange("")}>{emptyLabel ?? "Sem imagem"}</button>
            ) : null}
          </div>
        </div>
      </div>
      {!STANDALONE ? (
        <input type="text" placeholder="…ou cole o link de uma imagem (https://…)" value={url} onChange={(e) => { setUrl(e.target.value); if (/^https?:\/\/.+/.test(e.target.value)) onChange(e.target.value); }} />
      ) : null}
      <small className="muted">PNG sem fundo dá o melhor resultado. A animação continua a mesma, só troca a imagem.</small>
      {err && <small className="err">{err}</small>}
    </div>
  );
};
