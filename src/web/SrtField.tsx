import React, { useRef, useState } from "react";
import { parseSrt } from "../srt";

/** Campo de legenda: carregar o arquivo .srt do vídeo ou colar o texto. */
export const SrtField: React.FC<{ id: string; value: string; onChange: (v: string) => void }> = ({ id, value, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const cues = parseSrt(value);
  const dur = cues.length ? cues[cues.length - 1].end : 0;
  const marked = cues.filter((c) => /\*[^*]+\*/.test(c.text)).length;
  const load = async (f?: File) => {
    if (!f) return;
    setErr(null);
    const text = await f.text();
    if (!parseSrt(text).length) { setErr("Não encontrei legendas nesse arquivo. Ele precisa ser .srt (ou .vtt) com tempos no formato 00:00:01,000 --> 00:00:03,000."); return; }
    onChange(text);
  };
  return (
    <div className="srtfield">
      <button type="button" className="primary small" onClick={() => input.current?.click()}>Carregar arquivo .srt</button>
      <input ref={input} type="file" accept=".srt,.vtt,text/plain" hidden onChange={(e) => load(e.target.files?.[0])} />
      <textarea id={id} rows={9} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      <small className={cues.length ? "muted" : "err"}>
        {cues.length ? `${cues.length} falas · ${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, "0")} de vídeo${marked ? ` · ${marked} palavras destacadas` : ""}` : "Nenhuma fala reconhecida ainda."}
      </small>
      <small className="muted">Dica: coloque *asteriscos* numa palavra para escolher qual palavra fica em destaque.</small>
      {err && <small className="err">{err}</small>}
    </div>
  );
};
