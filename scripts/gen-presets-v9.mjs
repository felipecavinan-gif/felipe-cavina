import fs from "fs";
const out = process.argv[2];
const FONT_OPTS = [["inter","Inter"],["montserrat","Montserrat"],["poppins","Poppins"],["bebas","Bebas Neue"],["playfair","Playfair Display"],["spacegrotesk","Space Grotesk"],["jetbrains","JetBrains Mono"]].map(([value,label])=>({value,label}));
const ALL = ["16:9","9:16","1:1","4:5"];
const t = (key,label,def,extra={}) => ({key,label,type:"text",default:def,...extra});
const ta = (key,label,def,extra={}) => ({key,label,type:"textarea",default:def,...extra});
const c = (key,label,def) => ({key,label,type:"color",default:def});
const n = (key,label,def,min,max,step=1) => ({key,label,type:"number",default:def,min,max,step});
const tog = (key,label,def,help) => ({key,label,type:"toggle",default:def,...(help?{help}:{})});
const f = (def, key="font", label="Fonte") => ({key,label,type:"font",default:def,options:FONT_OPTS});
const sel = (key,label,def,options) => ({key,label,type:"select",default:def,options:options.map(([value,label])=>({value,label}))});
const bg = (color, transparent=false) => [c("bgColor","Cor de fundo",color), tog("transparent","Fundo transparente",transparent,"Exporte em MOV/WebM para manter a transparência")];

// Legendas a partir de .srt (aba "Legendas"): 4 estilos para o dia a dia, fundo transparente.
const SAMPLE = `1
00:00:00,300 --> 00:00:02,400
Hoje eu vou te mostrar como editar mais rápido

2
00:00:02,400 --> 00:00:04,000
sem perder *qualidade*

3
00:00:04,100 --> 00:00:06,600
O segredo está em usar modelos prontos

4
00:00:06,600 --> 00:00:08,200
e repetir o que *funciona*

5
00:00:08,300 --> 00:00:10,900
Você troca o texto, exporta e coloca no vídeo

6
00:00:10,900 --> 00:00:12,400
simples assim

7
00:00:12,500 --> 00:00:15,000
Então salva esse vídeo para não esquecer

8
00:00:15,000 --> 00:00:16,800
e bora *editar*
`;
const V = ["9:16","16:9","1:1","4:5"];
const styleSel = (d) => sel("captionStyle","Estilo da legenda",d,[["clean","Clean"],["karaoke","Palavra destacada"],["editorial","Editorial"],["impact","Impacto"]]);
const C = (id, name, description, o) => ({
  id: `leg-${id}`, name, category: "Legendas", kind: "legendas", description, style: "captions", fps: 30, durationInFrames: 510, formats: V,
  fields: [
    { key: "srt", label: "Legenda (.srt do seu vídeo)", type: "srt", default: SAMPLE },
    styleSel(o.style),
    sel("letteringMode","Letterings","auto",[["auto","Automático (falas curtas e *marcadas*)"],["marked","Só as falas com *palavra marcada*"],["off","Sem letterings"]]),
    n("letteringMaxWords","Automático: falas com até quantas palavras",o.maxw ?? 4,1,10),
    n("letteringEvery","Automático: intervalo mínimo entre letterings (falas)",o.every ?? 3,1,10),
    f(o.font,"font","Fonte da legenda"), n("fontSize","Tamanho da legenda",o.size,30,120), n("bottom","Altura da legenda (% de baixo)",o.bottom ?? 18,2,60),
    n("letteringY","Posição vertical do lettering (%)",o.ly ?? -8,-40,40),
    c("textColor","Cor da legenda",o.text ?? "#ffffff"), c("accentColor","Cor de destaque",o.accent),
    ...(o.style === "karaoke" ? [c("highlightText","Cor do texto destacado",o.hl ?? "#111111")] : []),
    c("letteringColor","Cor da palavra grande do lettering",o.lcolor ?? "#ffffff"), c("letteringSmallColor","Cor das pequenas do lettering",o.lsmall ?? o.accent),
    c("bgColor","Cor de fundo (só se desligar transparente)","#111111"), tog("transparent","Fundo transparente",true),
  ],
  props: {},
});
const presets = [
  C("clean","Legenda Clean","Legenda branca e limpa embaixo; falas curtas viram lettering com blur e escala diminuindo.",{style:"clean",font:"montserrat",size:70,accent:"#ffd400"}),
  C("destaque","Palavra Destacada","A palavra falada ganha uma caixa colorida (estilo karaokê); letterings crescendo.",{style:"karaoke",font:"poppins",size:72,accent:"#7cf5c4",lsmall:"#7cf5c4"}),
  C("editorial","Legenda Editorial","Serifada em itálico com fade e blur suave; letterings com câmera se afastando.",{style:"editorial",font:"playfair",size:66,accent:"#e8c37d",text:"#fff8ec",lcolor:"#fff8ec",bottom:16}),
  C("impacto","Legenda Impacto","Caixa alta, cada palavra aparece com um pulo; letterings com zoom e flick.",{style:"impact",font:"montserrat",size:76,accent:"#ffd400",bottom:20}),
];
for (const p of presets) fs.writeFileSync(`${out}/${p.id}.json`, JSON.stringify(p, null, 2) + "\n");
console.log(presets.length, "presets");
