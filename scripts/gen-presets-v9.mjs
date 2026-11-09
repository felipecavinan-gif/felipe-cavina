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
const styleSel = (d) => sel("captionStyle","Estilo da legenda",d,[["cascata","Cascata (palavras subindo)"],["blur","Blur (palavras saindo do desfoque)"],["escala","Escala (palavras diminuindo)"],["flick","Flick (palavras piscando)"]]);
const C = (id, name, description, o) => ({
  id: `leg-${id}`, name, category: "Legendas", kind: "legendas", description, style: "captions", fps: 30, durationInFrames: 510, formats: V,
  fields: [
    { key: "srt", label: "Legenda (.srt do seu vídeo)", type: "srt", default: SAMPLE },
    styleSel(o.style),
    n("wordsPerBlock","Palavras por vez na tela",o.wpb ?? 3,1,8),
    n("wordSpeed","Velocidade das palavras",1,0.4,3,0.1),

    f(o.font,"font","Fonte da legenda"), f(o.hifont,"emphasisFont","Fonte da palavra em destaque"),
    tog("emphasis","Destacar a palavra principal de cada bloco",true), n("emphasisScale","Tamanho do destaque",o.hs ?? 1.25,1,2,0.05),
    n("fontSize","Tamanho da legenda",o.size,30,120), n("bottom","Altura da legenda (% de baixo)",o.bottom ?? 26,2,60),

    c("textColor","Cor da legenda",o.text ?? "#ffffff"), c("accentColor","Cor da palavra em destaque",o.accent ?? "#ffffff"),

    tog("shadow","Sombra suave",true),
    c("bgColor","Cor de fundo (só se desligar transparente)","#111111"), tog("transparent","Fundo transparente",true),
  ],
  props: { letteringMode: "off", ...(o.props ?? {}) },
});
const presets = [
  C("clean","Cascata","Minimalista: as palavras sobem uma a uma com blur; o destaque troca para serifa itálica.",{style:"cascata",font:"montserrat",hifont:"playfair",size:62}),
  C("editorial","Blur","Serifada e leve: cada palavra sai do desfoque.",{style:"blur",font:"playfair",hifont:"playfair",size:64,text:"#fff8ec",accent:"#fff8ec",lcolor:"#fff8ec",lsmall:"#e8c37d"}),
  C("destaque","Escala","Cada palavra chega maior e assenta; o destaque vira uma palavra condensada.",{style:"escala",font:"poppins",hifont:"bebas",size:62,hs:1.45,lsmall:"#cfe8ff"}),
  C("impacto","Flick","Caixa alta fina, palavras piscando ao entrar.",{style:"flick",font:"spacegrotesk",hifont:"jetbrains",size:54,wpb:2,lsmall:"#7cf5c4"}),
  C("flick-serifado","Flick Serifado","Serifada, palavras piscando ao entrar com um glitch leve de cor; destaque em itálico.",{style:"flick",font:"playfair",hifont:"playfair",size:66,wpb:2,hs:1.2,props:{uppercase:false,rgbGlitch:true}}),
];
for (const p of presets) fs.writeFileSync(`${out}/${p.id}.json`, JSON.stringify(p, null, 2) + "\n");
console.log(presets.length, "presets");
