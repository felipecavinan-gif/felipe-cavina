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

// Templates só de texto: flick + câmera 3D + zoom atravessando a tela (estilo "text-flick-3d").
const FL = "Texto flick", C3 = "Texto câmera 3D", ZO = "Texto zoom";
const V = ["9:16","16:9","1:1","4:5"];
const phr = (i, s, b) => [t(`small${i}`,`Frase ${i} · linha pequena`,s,{maxLength:30}), t(`big${i}`,`Frase ${i} · palavra grande`,b,{maxLength:20})];
const cam = (def) => sel("cameraMode","Movimento da câmera 3D",def,[["orbit","Órbita"],["tilt","Inclinação"],["dolly","Dolly lateral"],["flat","Sem câmera 3D"]]);
const common = (o) => [
  f(o.font,"font","Fonte da palavra grande"), f(o.smallFont ?? o.font,"smallFont","Fonte da linha pequena"),
  n("fontSize","Tamanho do texto",o.size ?? 170,50,320), cam(o.cam),
  n("cameraAmount","Intensidade da câmera 3D",o.camAmt ?? 1,0,2.5,0.1),
  n("flickAmount","Intensidade do flick",o.flick ?? 1,0,1,0.05),
  n("zoomScale","Zoom atravessando a tela",o.zoom ?? 7,1,15,0.5),
  n("zoomFrames","Duração do zoom (frames)",o.zoomFrames ?? 7,3,20),
  tog("flash","Flash a cada frase",o.flash ?? false), tog("echo","Rastro no zoom",o.echo ?? false),
  c("textColor","Cor da palavra grande",o.text), c("smallColor","Cor da linha pequena",o.small ?? o.text),
  ...(o.glow ? [tog("glow","Brilho",true), c("glowColor","Cor do brilho",o.glow)] : []),
  c("bgColor","Cor de fundo",o.bg), tog("transparent","Fundo transparente",false),
];
const P = (id,name,cat,description,dur,phrases,o,props={}) => ({id,name,category:cat,description,style:"text-flick-3d",fps:30,durationInFrames:dur,formats:V,
  fields:[...phrases.flatMap(([s,b],i)=>phr(i+1,s,b)), ...common(o)], props:{uppercase:false,...props}});
const presets = [
 // ===== TEXTO FLICK =====
 P("flick-editorial","Flick Editorial",FL,"Frases editoriais trocando em flicks rápidos, com zoom atravessando a tela.",120,
   [["num ícone","mundial."],["feito para","durar."],["o clássico","atemporal."],["",""]],
   {font:"playfair",size:170,cam:"orbit",camAmt:0.5,text:"#111111",bg:"#ffffff"},{bigWeight:700,smallWeight:700,align:"left",smallRatio:0.34}),
 P("flick-noir","Flick Noir",FL,"Preto e dourado, flashes nos cortes e tipografia forte.",110,
   [["nova","COLEÇÃO"],["edição","LIMITADA"],["",""],["",""]],
   {font:"montserrat",size:180,cam:"tilt",camAmt:0.7,flash:true,text:"#ffffff",small:"#c9a45c",bg:"#050505"},{uppercase:true,smallRatio:0.26,smallUppercase:true,smallTracking:0.3}),
 P("flick-colorido","Flick Colorido",FL,"Palavras gigantes em fundo de cor chapada, flick agressivo.",100,
   [["som","PURO."],["grave","FORTE."],["volume","MÁXIMO."],["",""]],
   {font:"bebas",size:320,cam:"dolly",camAmt:0.8,text:"#111111",small:"#ffffff",bg:"#ff5c39"},{uppercase:true,smallRatio:0.16,bigWeight:400,smallWeight:800,charRatio:0.45}),
 P("flick-neon","Flick Neon",FL,"Texto neon piscando como letreiro, em fundo escuro.",110,
   [["acesso","LIBERADO"],["modo","TURBO"],["",""],["",""]],
   {font:"spacegrotesk",size:170,cam:"orbit",camAmt:0.8,flick:1,text:"#e9fdff",small:"#00e5ff",glow:"#00e5ff",bg:"#04070d"},{uppercase:true,smallRatio:0.26,smallUppercase:true,smallTracking:0.35}),
 // ===== TEXTO CÂMERA 3D =====
 P("cam3d-orbita","Órbita 3D",C3,"A câmera gira em volta do texto enquanto as frases entram de lados alternados.",130,
   [["o futuro","começa"],["exatamente","aqui."],["",""],["",""]],
   {font:"montserrat",size:170,cam:"orbit",camAmt:1.6,flick:0.5,text:"#ffffff",small:"#7cf5c4",bg:"#0d0f1a"},{smallRatio:0.3}),
 P("cam3d-inclinacao","Inclinação Impacto",C3,"Texto inclinando em 3D com força, rastro no zoom.",110,
   [["sem","DESCULPAS"],["sem","LIMITES"],["",""],["",""]],
   {font:"montserrat",size:180,cam:"tilt",camAmt:1.8,flick:0.8,echo:true,text:"#ffffff",small:"#ff2a2a",bg:"#000000"},{uppercase:true,smallRatio:0.24,smallUppercase:true,smallTracking:0.25}),
 P("cam3d-dolly-cinema","Dolly Cinema",C3,"Movimento lateral de câmera, tons frios e zoom suave entre as frases.",150,
   [["um filme de","Ana Souza"],["em breve","nos cinemas"],["",""],["",""]],
   {font:"playfair",size:150,cam:"dolly",camAmt:1.4,flick:0.3,zoom:4,zoomFrames:10,text:"#e6f1ff",small:"#6fa8ff",bg:"#03060c"},{bigWeight:700,smallRatio:0.28,smallUppercase:true,smallTracking:0.3,smallFont:"inter"}),
 P("cam3d-pastel","Pastel 3D",C3,"Câmera 3D suave em tons pastel, para conteúdos leves.",130,
   [["fragrância","floral"],["notas de","baunilha"],["",""],["",""]],
   {font:"playfair",size:160,cam:"orbit",camAmt:1.2,flick:0.4,zoom:5,text:"#4a2a2a",small:"#b5707a",bg:"#fff1ef"},{bigWeight:700,smallRatio:0.3}),
 // ===== TEXTO ZOOM =====
 P("zoom-oferta","Zoom Oferta",ZO,"Cada frase atravessa a tela em zoom com flash, ritmo de promoção.",90,
   [["oferta","IMPERDÍVEL"],["até","-50%"],["só","HOJE"],["",""]],
   {font:"montserrat",size:200,cam:"tilt",camAmt:0.6,flick:0.8,zoom:9,zoomFrames:6,flash:true,echo:true,text:"#111111",small:"#ff2a2a",bg:"#ffd400"},{uppercase:true,smallRatio:0.24,smallUppercase:true}),
 P("zoom-lancamento","Zoom Lançamento",ZO,"Zoom profundo atravessando a tela em fundo escuro com brilho.",100,
   [["chegou","AGORA"],["drop","01"],["",""],["",""]],
   {font:"bebas",size:300,cam:"orbit",camAmt:0.7,flick:0.7,zoom:10,zoomFrames:8,echo:true,text:"#ffffff",small:"#00e5ff",glow:"#00e5ff",bg:"#05060a"},{uppercase:true,smallRatio:0.16,bigWeight:400,smallWeight:800,charRatio:0.45,smallUppercase:true,smallTracking:0.4,smallFont:"montserrat"}),
 P("zoom-boom","Zoom Boom",ZO,"Soco de texto com rastro, flash e zoom passando pela tela.",70,
   [["","BOOM!"],["","BANG!"],["",""],["",""]],
   {font:"montserrat",size:220,cam:"tilt",camAmt:1,flick:1,zoom:12,zoomFrames:5,flash:true,echo:true,text:"#111111",bg:"#ffffff"},{uppercase:true}),
 P("zoom-vermelho","Zoom Vermelho",ZO,"Frases curtas em vermelho e branco atravessando a tela.",100,
   [["isso","MUDA"],["tudo","AGORA"],["",""],["",""]],
   {font:"montserrat",size:200,cam:"dolly",camAmt:0.8,flick:0.6,zoom:8,echo:true,text:"#ffffff",small:"#111111",bg:"#e8112d"},{uppercase:true,smallRatio:0.24,smallUppercase:true,smallTracking:0.2}),
];
for (const p of presets) fs.writeFileSync(`${out}/${p.id}.json`, JSON.stringify(p, null, 2) + "\n");
console.log(presets.length, "presets");
