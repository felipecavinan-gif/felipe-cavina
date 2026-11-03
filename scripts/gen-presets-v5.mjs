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

// Câmera 3D viajando por 3 pontos com textos em locais diferentes (estilo "camera-3-points").
const CAT = "Câmera 3D · 3 pontos";
const V = ["16:9","9:16","1:1","4:5"];
const pts = (a) => a.flatMap(([l, tx], i) => [t(`label${i+1}`,`Ponto ${i+1} · rótulo`,l,{maxLength:30}), t(`text${i+1}`,`Ponto ${i+1} · texto`,tx,{maxLength:24})]);
const layout = (d) => sel("layout","Caminho da câmera",d,[["zigzag","Zigue-zague"],["corredor","Corredor (paredes)"],["escada","Escada (descendo)"],["orbita","Órbita (girando)"]]);
const common = (o) => [
  layout(o.layout), f(o.font), n("fontSize","Tamanho do texto",o.size ?? 150,50,280),
  n("travelFrames","Duração de cada viagem (frames)",o.travel ?? 18,6,60), n("depth","Distância entre os pontos",o.depth ?? 1,0.4,2,0.1),
  n("bank","Inclinação da câmera nas curvas",o.bank ?? 6,0,25), n("motionBlur","Desfoque de movimento",o.mb ?? 1,0,3,0.1),
  n("focusBlur","Desfoque de profundidade",o.dof ?? 6,0,20), tog("flick","Flick ao chegar em cada ponto",o.flick ?? true),
  tog("showIndex","Mostrar números 01 02 03",o.index ?? true), tog("underline","Sublinhado",o.underline ?? false),
  c("textColor","Cor do texto",o.text), c("accentColor","Cor de destaque",o.accent), c("bgColor","Cor de fundo",o.bg), tog("transparent","Fundo transparente",false),
];
const P = (id,name,description,dur,points,o,props={}) => ({id,name,category:CAT,description,style:"camera-3-points",fps:30,durationInFrames:dur,formats:V,fields:[...pts(points),...common(o)],props});
const presets = [
  P("3pontos-zigzag","3 Pontos Zigue-zague","A câmera voa em zigue-zague entre três textos espalhados no espaço.",210,
    [["passo um","PLANEJE"],["passo dois","CRIE"],["passo três","PUBLIQUE"]],
    {layout:"zigzag",font:"montserrat",text:"#ffffff",accent:"#ffd400",bg:"#0b0b0f"},{uppercase:true}),
  P("3pontos-corredor","Corredor 3D","Os textos ficam nas paredes de um corredor; a câmera vira para cada um e segue em frente.",220,
    [["capítulo 1","A ideia"],["capítulo 2","O processo"],["capítulo 3","O resultado"]],
    {layout:"corredor",font:"playfair",size:140,travel:22,flick:false,index:false,underline:true,text:"#f5efe0",accent:"#c9a45c",bg:"#0a0907",dof:8},{weight:700,labelFont:"inter"}),
  P("3pontos-escada","Escada 3D","A câmera desce em diagonal passando por três níveis, ótimo para listas e etapas.",200,
    [["nível 1","Iniciante"],["nível 2","Avançado"],["nível 3","Mestre"]],
    {layout:"escada",font:"poppins",size:140,travel:16,text:"#111111",accent:"#2f6bff",bg:"#f3efe6",dof:5,bank:4},{weight:800}),
  P("3pontos-orbita","Órbita 3 Pontos","A câmera gira em volta da cena enquanto passa pelos três textos, com brilho neon.",220,
    [["dia 1","ABERTURA"],["dia 2","WORKSHOPS"],["dia 3","FESTA"]],
    {layout:"orbita",font:"spacegrotesk",size:150,travel:24,bank:10,mb:1.4,text:"#e9fdff",accent:"#ff2bd6",bg:"#07040f"},{uppercase:true,glow:true}),
];
for (const p of presets) fs.writeFileSync(`${out}/${p.id}.json`, JSON.stringify(p, null, 2) + "\n");
console.log(presets.length, "presets");
