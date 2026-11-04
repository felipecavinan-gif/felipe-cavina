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

// Texto chega forte atravessando a tela, escala diminuindo suave, contorno na palavra-chave e saída em blur (estilo "outline-flick").
const CAT = "Contorno + blur";
const V = ["9:16","16:9","1:1","4:5"];
const shape = (d) => sel("outlineShape","Forma do contorno",d,[["ellipse","Círculo à mão"],["double","Círculo duplo"],["box","Caixa"],["underline","Sublinhado à mão"],["brackets","Colchetes"]]);
const common = (o) => [
  ta("text","Texto (a *palavra* entre asteriscos recebe o contorno)",o.text), f(o.font), n("fontSize","Tamanho do texto",o.size ?? 130,50,260),
  shape(o.shape), n("outlineWidth","Espessura do risco",o.ow ?? 3.5,1,12,0.5), n("outlineBlur","Blur do risco",o.ob ?? 1.2,0,6,0.1), n("outlineOpacity","Opacidade do risco",o.oo ?? 0.85,0.2,1,0.05), n("outlineAt","Início do contorno (0 a 1 do vídeo)",o.oat ?? 0.32,0.05,0.8,0.01),
  n("outlineFrames","Duração do risco (frames)",o.of ?? 24,8,60),
  n("scaleFrom","Escala na chegada (atravessando a tela)",o.sf ?? 3.2,1,6,0.1), n("introFrames","Duração da chegada forte (frames)",o.intro ?? 24,6,60),
  n("scaleTo","Escala final (diminuição sutil)",o.st ?? 0.9,0.6,1.2,0.01), n("outroFrames","Duração da saída em blur (frames)",o.outro ?? 16,6,40),
  n("cinemaBlur","Blur de cinema (0 = desligado)",o.cb ?? 0,0,2,0.1),
  c("textColor","Cor do texto",o.text_c), c("keyColor","Cor da palavra contornada",o.key ?? o.text_c), c("outlineColor","Cor do contorno",o.outline),
  c("bgColor","Cor de fundo",o.bg), tog("transparent","Fundo transparente",false),
];
const P = (id,name,description,dur,o,props={}) => ({id,name,category:CAT,description,style:"outline-flick",fps:30,durationInFrames:dur,formats:V,fields:common(o),props});
const presets = [
  P("contorno-caneta","Caneta Vermelha","O texto chega atravessando a tela, desacelera e a palavra-chave é circulada à mão.",120,
    {text:"o segredo é *consistência*",font:"playfair",size:120,shape:"ellipse",outline:"#e8112d",text_c:"#111111",bg:"#f4f1ea",flash:0.3,f2:"#e8112d"},{weight:700}),
  P("contorno-neon","Contorno Neon","Caixa neon desenhada em volta da palavra enquanto o texto encolhe devagar.",110,
    {text:"ative o modo *turbo*",font:"spacegrotesk",size:130,shape:"box",outline:"#00e5ff",text_c:"#ffffff",key:"#00e5ff",bg:"#05060a",f1:"#ff2bd6",f2:"#00e5ff",flash:0.45,invert:false},{uppercase:true,weight:700}),
  P("contorno-duplo","Círculo Duplo","Chegada forte e círculo duplo rabiscado na palavra-chave.",100,
    {text:"isso muda *tudo*",font:"montserrat",size:150,shape:"double",outline:"#ff3d00",text_c:"#111111",bg:"#ffffff",flash:0.5,invert:true,f2:"#ff3d00"},{uppercase:true,weight:900}),
  P("contorno-sublinhado","Sublinhado à Mão","Sublinhado duplo feito à mão, movimento suave do começo ao fim.",120,
    {text:"menos é *mais*",font:"poppins",size:150,shape:"underline",outline:"#2f6bff",text_c:"#111111",bg:"#ffffff",flash:0.2,fat:0.75},{weight:800}),
  P("contorno-colchetes","Colchetes","Colchetes se fecham em volta da palavra, estilo editorial escuro.",120,
    {text:"o design é *silencioso*",font:"playfair",size:120,shape:"brackets",outline:"#c9a45c",text_c:"#f5efe0",key:"#c9a45c",bg:"#0a0907",flash:0.25,f2:"#c9a45c"},{weight:700}),
  P("contorno-oferta","Contorno Oferta","Promoção: duas palavras circuladas com chegada de impacto.",100,
    {text:"*50%* off só *hoje*",font:"montserrat",size:150,shape:"ellipse",outline:"#111111",text_c:"#111111",key:"#e8112d",bg:"#ffd400",flash:0.55,f1:"#ffffff",f2:"#111111",invert:true},{uppercase:true,weight:900}),
];
// Variação "Cinema": os mesmos 6, com blur de cinema (entrada desfocada, bloom e blur nos flicks)
const CINE = "Contorno + blur · cinema";
const cine = presets.map((p) => ({
  ...p,
  id: p.id.replace("contorno-", "contorno-cinema-"),
  name: `${p.name} Cinema`,
  category: CINE,
  description: p.description.replace(/\.$/, "") + ", com blur de cinema e brilho.",
  fields: p.fields.map((f) => (f.key === "cinemaBlur" ? { ...f, default: 1.3 } : f)),
}));
presets.push(...cine);
for (const p of presets) fs.writeFileSync(`${out}/${p.id}.json`, JSON.stringify(p, null, 2) + "\n");
console.log(presets.length, "presets");
