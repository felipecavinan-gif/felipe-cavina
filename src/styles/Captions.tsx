import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp } from "./common";
import { Lettering } from "./Lettering";
import { parseSrt, type Cue } from "../srt";
import { font } from "../fonts";

type Kind = "cascata" | "blur" | "escala" | "flick";

/** Visual de cada estilo: tipografia das palavras + como fica o lettering ocasional. */
const LOOK: Record<Kind, { font: string; weight: number; upper: boolean; italic: boolean; size: number; hiFont: string; hiItalic: boolean; hiWeight: number; lettering: Record<string, unknown> }> = {
  cascata: { font: "montserrat", weight: 600, upper: false, italic: false, size: 62, hiFont: "playfair", hiItalic: true, hiWeight: 700,
    lettering: { motion: "rise", stagger: true, staggerFrames: 4, font: "montserrat", smallFont: "montserrat", bigWeight: 900, smallWeight: 700, smallRatio: 0.24, uppercase: true, bigSize: 240 } },
  blur: { font: "playfair", weight: 500, upper: false, italic: false, size: 64, hiFont: "playfair", hiItalic: true, hiWeight: 700,
    lettering: { motion: "shrink", font: "playfair", smallFont: "playfair", bigWeight: 700, smallWeight: 700, smallItalic: true, smallRatio: 0.32, bigSize: 230, blurAmount: 1.3 } },
  escala: { font: "poppins", weight: 600, upper: false, italic: false, size: 62, hiFont: "bebas", hiItalic: false, hiWeight: 400,
    lettering: { motion: "pullback", flick: true, flickOut: false, font: "poppins", smallFont: "poppins", bigWeight: 800, smallWeight: 700, smallRatio: 0.28, bigSize: 240 } },
  flick: { font: "spacegrotesk", weight: 500, upper: true, italic: false, size: 54, hiFont: "jetbrains", hiItalic: false, hiWeight: 700,
    lettering: { motion: "zoom", flick: true, font: "bebas", smallFont: "spacegrotesk", bigWeight: 400, smallWeight: 700, smallUppercase: true, smallTracking: 0.2, smallRatio: 0.16, charRatio: 0.45, uppercase: true, bigSize: 300 } },
};
const LEGACY: Record<string, Kind> = { clean: "cascata", karaoke: "escala", editorial: "blur", impact: "flick" };

/** Divide uma fala em lettering: a palavra *marcada* (ou a mais longa) fica grande, o resto vira as duas linhas pequenas. */
function toLettering(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  let bi = words.findIndex((w) => /^\*.+\*[.,!?:;]*$/.test(w));
  if (bi < 0) bi = words.reduce((best, w, i) => (w.replace(/[^\p{L}\p{N}%]/gu, "").length > words[best].replace(/[^\p{L}\p{N}%]/gu, "").length ? i : best), 0);
  const clean = (w: string) => w.replace(/\*/g, "");
  const rest = words.filter((_, i) => i !== bi).map(clean);
  const half = Math.ceil(rest.length / 2);
  return { big: clean(words[bi] ?? ""), small1: rest.slice(0, half).join(" "), small2: rest.slice(half).join(" ") };
}

/** Escolhe quais falas viram lettering. */
function pickLetterings(cues: Cue[], mode: string, maxWords: number, every: number) {
  const set = new Set<number>();
  let last = -999;
  cues.forEach((c, i) => {
    const words = c.text.split(/\s+/).filter(Boolean).length;
    const marked = /\*[^*]+\*/.test(c.text);
    if (mode === "off") return;
    if (marked) { set.add(i); last = i; return; }
    if (mode === "auto" && words <= maxWords && i - last >= every) { set.add(i); last = i; }
  });
  return set;
}

/** Um bloco curto de palavras: cada palavra entra no seu tempo com o efeito do estilo. */
const Chunk: React.FC<{ words: string[]; len: number; kind: Kind; v: any }> = ({ words, len, kind, v }) => {
  const frame = useCurrentFrame(); // relativo ao começo do bloco
  const { width } = useVideoConfig();
  const u = useUnit();
  const look = LOOK[kind];
  const size = Number(v.fontSize ?? look.size) * u;
  const clean = words.map((w) => w.replace(/\*/g, ""));
  // tempo de cada palavra proporcional ao tamanho (como a fala), todas visíveis até ~70% do bloco
  const total = clean.reduce((a, w) => a + w.length + 1, 0);
  let acc = 0;
  const reveal = Math.max(4, len * 0.7) / Math.max(0.3, Number(v.wordSpeed ?? 1));
  const starts = clean.map((w) => { const st = (acc / total) * reveal; acc += w.length + 1; return st; });
  // destaque: a palavra mais longa (ou *marcada*) fica maior e na cor de destaque
  let hi = words.findIndex((w) => /^\*.+\*/.test(w));
  if (hi < 0 && v.emphasis !== false) hi = clean.reduce((b, w, i) => (w.replace(/[^\p{L}\p{N}%]/gu, "").length > clean[b].replace(/[^\p{L}\p{N}%]/gu, "").length ? i : b), 0);
  if (hi >= 0 && clean[hi].replace(/[^\p{L}\p{N}%]/gu, "").length < 4) hi = -1;
  const drift = interpolate(frame, [0, len], [1.05, 0.98], { easing: Easing.out(Easing.quad) });
  const out = interpolate(frame, [len - 5, len], [0, 1], clamp);
  const shadow = v.shadow === false ? "none" : `0 ${2 * u}px ${10 * u}px rgba(0,0,0,.35)`;
  const D = 8; // duração da entrada de cada palavra

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: `${Number(v.bottom ?? 28)}%` }}>
      <div style={{ maxWidth: width * 0.84, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: size * 0.26, rowGap: size * 0.02,
        transform: `scale(${drift})`, opacity: 1 - out, filter: `blur(${out * 10 * u}px)` }}>
        {clean.map((w, i) => {
          const t = frame - starts[i];
          const p = interpolate(t, [0, D], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          let tr = "", blur = 0, op = p;
          if (kind === "cascata") { tr = `translateY(${(1 - p) * 0.55 * size}px)`; blur = (1 - p) * 10 * u; }
          else if (kind === "blur") { tr = `scale(${1 + (1 - p) * 0.08})`; blur = (1 - p) * 18 * u; }
          else if (kind === "escala") { tr = `scale(${1 + (1 - p) * 0.7})`; blur = (1 - p) * 12 * u; }
          else { const pat = [1, 0, 1, 0, 0, 1, 1]; op = t < 0 ? 0 : t < pat.length ? pat[Math.floor(t)] : 1; blur = t < 4 ? 6 * u : 0; }
          const isHi = i === hi;
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "nowrap", opacity: op, transform: tr, filter: blur ? `blur(${blur}px)` : undefined,
              // destaque minimalista: só troca a fonte (como um lettering), com leve aumento
              fontFamily: font(isHi ? v.emphasisFont ?? look.hiFont : v.font ?? look.font), fontWeight: isHi ? look.hiWeight : look.weight,
              fontStyle: (isHi ? look.hiItalic : look.italic) ? "italic" : "normal",
              fontSize: isHi ? size * Number(v.emphasisScale ?? 1.25) : size, lineHeight: 1.05,
              color: isHi ? v.accentColor ?? "#ffffff" : v.textColor ?? "#ffffff",
              textTransform: (v.uppercase ?? look.upper) && !(isHi && look.hiItalic) ? "uppercase" : "none", textShadow: shadow }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Quebra uma fala em blocos de até N palavras, dividindo o tempo pelo tamanho de cada bloco. */
function chunkCue(c: Cue, maxWords: number, fps: number) {
  const words = c.text.split(/\s+/).filter(Boolean);
  const groups: string[][] = [];
  for (let i = 0; i < words.length; i += maxWords) groups.push(words.slice(i, i + maxWords));
  // evita sobrar uma palavra sozinha no fim
  if (groups.length > 1 && groups[groups.length - 1].length === 1) groups[groups.length - 2].push(...groups.pop()!);
  const total = words.reduce((a, w) => a + w.length + 1, 0);
  const startF = Math.round(c.start * fps), endF = Math.round(c.end * fps);
  let at = startF;
  return groups.map((g, gi) => {
    const share = g.reduce((a, w) => a + w.length + 1, 0) / total;
    const len = gi === groups.length - 1 ? endF - at : Math.max(4, Math.round((endF - startF) * share));
    const r = { words: g, from: at, len: Math.max(4, len) };
    at += len;
    return r;
  });
}

/** Legendas a partir de um .srt: falas no estilo padrão e algumas falas viram lettering. Fundo transparente. */
export const Captions: React.FC<StyleProps> = ({ v }) => {
  const { fps } = useVideoConfig();
  const raw = String(v.captionStyle ?? "cascata");
  const kind: Kind = (raw in LOOK ? raw : LEGACY[raw] ?? "cascata") as Kind;
  const cues = React.useMemo(() => parseSrt(v.srt), [v.srt]);
  const letterings = React.useMemo(() => pickLetterings(cues, String(v.letteringMode ?? "off"), Number(v.letteringMaxWords ?? 4), Number(v.letteringEvery ?? 3)), [cues, v.letteringMode, v.letteringMaxWords, v.letteringEvery]);
  const look = LOOK[kind];

  return (
    <Background v={v}>
      {cues.map((c, i) => {
        const from = Math.round(c.start * fps);
        const dur = Math.max(4, Math.round((c.end - c.start) * fps));
        if (letterings.has(i)) {
          const parts = toLettering(c.text);
          const lv = {
            ...look.lettering, ...parts, _seqDur: dur, transparent: true,
            bigColor: v.letteringColor ?? v.textColor ?? "#ffffff", smallColor: v.letteringSmallColor ?? v.accentColor ?? "#ffd400",
            posY: Number(v.letteringY ?? -8), introFrames: Math.min(14, Math.floor(dur / 3)), outroFrames: Math.min(12, Math.floor(dur / 3)),
            lineGap: -0.04, speed: 1,
          };
          return <Sequence key={i} from={from} durationInFrames={dur} layout="none"><Lettering v={lv} /></Sequence>;
        }
        return chunkCue(c, Math.max(1, Number(v.wordsPerBlock ?? 4)), fps).map((ch, k) => (
          <Sequence key={`${i}-${k}`} from={ch.from} durationInFrames={ch.len} layout="none"><Chunk words={ch.words} len={ch.len} kind={kind} v={v} /></Sequence>
        ));
      })}
    </Background>
  );
};
