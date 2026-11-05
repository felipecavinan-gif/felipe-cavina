import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Background, StyleProps, useUnit, clamp } from "./common";
import { Lettering } from "./Lettering";
import { parseSrt, type Cue } from "../srt";
import { font } from "../fonts";

type Kind = "clean" | "karaoke" | "editorial" | "impact";

/** Visual de cada estilo: legenda padrão + como fica o lettering. */
const LOOK: Record<Kind, { font: string; weight: number; upper: boolean; italic: boolean; size: number; lettering: Record<string, unknown> }> = {
  clean: { font: "montserrat", weight: 800, upper: false, italic: false, size: 64,
    lettering: { motion: "shrink", font: "montserrat", smallFont: "montserrat", bigWeight: 900, smallWeight: 600, smallUppercase: true, smallTracking: 0.25, smallRatio: 0.2, uppercase: true, bigSize: 230 } },
  karaoke: { font: "poppins", weight: 800, upper: false, italic: false, size: 66,
    lettering: { motion: "grow", font: "poppins", smallFont: "poppins", bigWeight: 800, smallWeight: 700, smallRatio: 0.28, scaleFrom: 0.75, scaleTo: 1.05, bigSize: 230 } },
  editorial: { font: "playfair", weight: 600, upper: false, italic: true, size: 60,
    lettering: { motion: "pullback", font: "playfair", smallFont: "playfair", bigWeight: 700, smallWeight: 700, smallItalic: true, smallRatio: 0.32, align: "left", bigSize: 220, flick: true, flickOut: false } },
  impact: { font: "montserrat", weight: 900, upper: true, italic: false, size: 70,
    lettering: { motion: "zoom", font: "bebas", smallFont: "montserrat", bigWeight: 400, smallWeight: 800, smallUppercase: true, smallRatio: 0.15, charRatio: 0.45, uppercase: true, bigSize: 300, flick: true } },
};

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

const Line: React.FC<{ cue: Cue; kind: Kind; v: any; fps: number; startFrame: number }> = ({ cue, kind, v, fps, startFrame }) => {
  const frame = useCurrentFrame(); // relativo ao começo da fala
  const { width } = useVideoConfig();
  const u = useUnit();
  const look = LOOK[kind];
  const len = Math.round((cue.end - cue.start) * fps);
  const words = cue.text.replace(/\*/g, "").split(/\s+/).filter(Boolean);
  const size = Number(v.fontSize ?? look.size) * u;
  const inn = interpolate(frame, [0, 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [len - 4, len], [0, 1], clamp);
  // tempo estimado de cada palavra (proporcional ao tamanho) para destacar a palavra falada
  const total = words.reduce((a, w) => a + w.length + 1, 0);
  let acc = 0;
  const starts = words.map((w) => { const s = (acc / total) * len; acc += w.length + 1; return s; });
  const active = starts.reduce((ai, s, i) => (frame >= s ? i : ai), 0);
  const color = v.textColor ?? "#ffffff";
  const accent = v.accentColor ?? "#ffd400";
  const shadow = `0 ${3 * u}px ${12 * u}px rgba(0,0,0,.55), 0 0 ${2 * u}px rgba(0,0,0,.6)`;
  void startFrame;

  const wordEl = (w: string, i: number) => {
    const base: React.CSSProperties = { display: "inline-block", marginRight: "0.28em", whiteSpace: "nowrap" };
    if (kind === "karaoke") {
      const on = i === active;
      return <span key={i} style={{ ...base, color: on ? (v.highlightText ?? "#111") : color, background: on ? accent : "transparent", borderRadius: "0.18em", padding: "0 0.12em", textShadow: on ? "none" : shadow }}>{w}</span>;
    }
    if (kind === "impact") {
      const t = frame - starts[i];
      const s = interpolate(t, [0, 3], [1.35, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
      return <span key={i} style={{ ...base, opacity: t >= 0 ? 1 : 0, transform: `scale(${s})`, color: i === active ? accent : color, textShadow: shadow }}>{w}</span>;
    }
    return <span key={i} style={{ ...base, textShadow: shadow }}>{w}</span>;
  };

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: `${Number(v.bottom ?? 18)}%` }}>
      <div style={{
        maxWidth: width * 0.86, textAlign: "center", fontFamily: font(v.font ?? look.font), fontWeight: look.weight, fontStyle: look.italic ? "italic" : "normal",
        fontSize: size, lineHeight: 1.18, color, textTransform: (v.uppercase ?? look.upper) ? "uppercase" : "none",
        opacity: inn * (1 - out),
        transform: `translateY(${(1 - inn) * 14 * u}px) scale(${kind === "editorial" ? 1 : 0.96 + 0.04 * inn})`,
        filter: kind === "editorial" ? `blur(${(1 - inn) * 8 * u + out * 6 * u}px)` : undefined,
      }}>
        {words.map(wordEl)}
      </div>
    </AbsoluteFill>
  );
};

/** Legendas a partir de um .srt: falas no estilo padrão e algumas falas viram lettering. Fundo transparente. */
export const Captions: React.FC<StyleProps> = ({ v }) => {
  const { fps } = useVideoConfig();
  const kind = (String(v.captionStyle ?? "clean") as Kind) in LOOK ? (String(v.captionStyle ?? "clean") as Kind) : "clean";
  const cues = React.useMemo(() => parseSrt(v.srt), [v.srt]);
  const letterings = React.useMemo(() => pickLetterings(cues, String(v.letteringMode ?? "auto"), Number(v.letteringMaxWords ?? 4), Number(v.letteringEvery ?? 3)), [cues, v.letteringMode, v.letteringMaxWords, v.letteringEvery]);
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
        return <Sequence key={i} from={from} durationInFrames={dur} layout="none"><Line cue={c} kind={kind} v={v} fps={fps} startFrame={from} /></Sequence>;
      })}
    </Background>
  );
};
