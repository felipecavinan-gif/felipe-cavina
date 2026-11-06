import React, { useEffect, useState } from "react";
import type { Preset } from "../types";
import { fetchPresets } from "./api";
import { Gallery } from "./Gallery";
import { Editor } from "./Editor";

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export const App: React.FC = () => {
  const [presets, setPresets] = useState<Preset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hash = useHash();

  useEffect(() => {
    fetchPresets().then(setPresets).catch((e) => setError(e.message));
  }, []);

  const id = decodeURIComponent(hash.replace(/^#\/?(t\/)?/, ""));
  const current = id ? presets?.find((p) => p.id === id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <a href="#" className="logo">
          <span className="logo-mark">▶</span> <span>Ana<b>kin</b></span>
        </a>
        <span className="topbar-note">Templates de motion para editores. Troque o texto, exporte e use no seu vídeo.</span>
      </header>
      {error && <div className="error">{error}</div>}
      {!presets && !error && <div className="loading">Carregando templates…</div>}
      {presets && (current ? <Editor key={current.id} preset={current} /> : <Gallery presets={presets} />)}
    </div>
  );
};
