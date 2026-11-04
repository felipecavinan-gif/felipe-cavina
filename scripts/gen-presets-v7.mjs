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

// Câmera 3D suave: vira rápido, passa um pouquinho e volta sutil (mola), com blur de movimento leve.
const CAT = "Câmera 3D · suave";
const V = ["16:9","9:16","1:1","4:5"];
const layout = (d) => sel("layout","Caminho da câmera",d,[["zigzag","Zigue-zague"],["corredor","Corredor (paredes)"],["escada","Escada (descendo)"],["orbita","Órbita (girando)"]]);
const pts = (a) => a.flatMap(([l, tx], i) => [t(`label${i+1}`,`Ponto ${i+1} · rótulo`,l,{maxLength:30}), t(`text${i+1}`,`Ponto ${i+1} · texto`,tx,{maxLength:24})]);
const three = (o) => [
  layout(o.layout), f(o.font), n("fontSize","Tamanho do texto",o.size ?? 150,50,280),
  n("travelFrames","Tempo entre os textos (frames)",o.travel ?? 14,6,60), n("depth","Distância entre os pontos",o.depth ?? 1,0.4,2,0.1),
  n("springDamping","Suavidade da volta (mais alto = menos balanço)",o.damp ?? 13,6,30), n("motionBlur","Blur de movimento",o.mb ?? 1,0,3,0.1),
  n("drift","Deriva sutil parada (graus)",o.drift ?? 1.5,0,6,0.1), n("bank","Inclinação da câmera ao virar",o.bank ?? 6,0,20),
  n("focusBlur","Desfoque de profundidade",o.dof ?? 6,0,20), tog("flick","Flick ao chegar",false),
  tog("showIndex","Mostrar números 01 02 03",o.index ?? true), tog("underline","Sublinhado",o.underline ?? false),
  c("textColor","Cor do texto",o.text), c("accentColor","Cor de destaque",o.accent), c("bgColor","Cor de fundo",o.bg), tog("transparent","Fundo transparente",false),
];
const T3 = (id,name,description,dur,points,o,props={}) => ({id,name,category:CAT,description,style:"camera-3-points",fps:30,durationInFrames:dur,formats:V,
  fields:[...pts(points),...three(o)],props:{motion:"whip",springStiffness:170,...props}});
const phr = (i, s, b) => [t(`small${i}`,`Frase ${i} · linha pequena`,s,{maxLength:30}), t(`big${i}`,`Frase ${i} · palavra grande`,b,{maxLength:20})];
const flick = (o) => [
  f(o.font,"font","Fonte da palavra grande"), f(o.smallFont ?? o.font,"smallFont","Fonte da linha pequena"), n("fontSize","Tamanho do texto",o.size ?? 170,50,320),
  n("motionBlur","Blur de movimento",o.mb ?? 1,0,3,0.1), n("zoomScale","Zoom na troca de frase",o.zoom ?? 2.2,1,8,0.1), n("zoomFrames","Duração da troca (frames)",o.zf ?? 10,3,20),
  c("textColor","Cor da palavra grande",o.text), c("smallColor","Cor da linha pequena",o.small ?? o.text), c("bgColor","Cor de fundo",o.bg), tog("transparent","Fundo transparente",false),
];
const TF = (id,name,description,dur,phrases,o,props={}) => ({id,name,category:CAT,description,style:"text-flick-3d",fps:30,durationInFrames:dur,formats:V,
  fields:[...phrases.flatMap(([s,b],i)=>phr(i+1,s,b)),...flick(o)],props:{cameraMode:"whip",cameraAmount:1,flickAmount:0,flash:false,echo:false,uppercase:false,...props}});
const presets = [
  T3("suave-3pontos-zigzag","Zigue-zague Suave","A câmera vira rápido para cada texto e assenta devagar, com blur de movimento leve.",210,
    [["passo um","PLANEJE"],["passo dois","CRIE"],["passo três","PUBLIQUE"]],{layout:"zigzag",font:"montserrat",text:"#ffffff",accent:"#ffd400",bg:"#0b0b0f"},{uppercase:true}),
  T3("suave-3pontos-corredor","Corredor Suave","Viradas rápidas entre as paredes do corredor e volta sutil, estilo editorial.",220,
    [["capítulo 1","A ideia"],["capítulo 2","O processo"],["capítulo 3","O resultado"]],{layout:"corredor",font:"playfair",size:140,index:false,underline:true,text:"#f5efe0",accent:"#c9a45c",bg:"#0a0907",dof:8,damp:15},{weight:700,labelFont:"inter"}),
  T3("suave-3pontos-escada","Escada Suave","A câmera desce rápido de um nível para o outro e assenta com leveza.",200,
    [["nível 1","Iniciante"],["nível 2","Avançado"],["nível 3","Mestre"]],{layout:"escada",font:"poppins",size:140,text:"#111111",accent:"#2f6bff",bg:"#f3efe6",dof:5,bank:4},{weight:800}),
  T3("suave-3pontos-orbita","Órbita Suave","Giro rápido em volta da cena entre os textos, com volta sutil e brilho.",220,
    [["dia 1","ABERTURA"],["dia 2","WORKSHOPS"],["dia 3","FESTA"]],{layout:"orbita",font:"spacegrotesk",size:150,bank:8,mb:1.3,text:"#e9fdff",accent:"#ff2bd6",bg:"#07040f",damp:14},{uppercase:true,glow:true}),
  TF("suave-frases-editorial","Frases com Virada Suave","Cada frase chega com uma virada rápida de câmera e assenta sutil, sem flick.",150,
    [["num ícone","mundial."],["feito para","durar."],["o clássico","atemporal."],["",""]],{font:"playfair",size:170,text:"#111111",bg:"#ffffff"},{bigWeight:700,smallWeight:700,align:"left",smallRatio:0.34}),
  TF("suave-frases-noite","Virada Noturna","Viradas de câmera rápidas e suaves entre frases, em fundo escuro.",140,
    [["o futuro","começa"],["exatamente","aqui."],["",""],["",""]],{font:"montserrat",size:170,text:"#ffffff",small:"#7cf5c4",bg:"#0d0f1a"},{smallRatio:0.3}),
];
for (const p of presets) fs.writeFileSync(`${out}/${p.id}.json`, JSON.stringify(p, null, 2) + "\n");
console.log(presets.length, "presets");
