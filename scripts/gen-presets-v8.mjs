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

// Letterings (aba própria): duas palavras pequenas + uma grande, fundo transparente, vários movimentos.
const V = ["9:16","16:9","1:1","4:5"];
const CA = "Câmera se afastando", BL = "Blur suave", CR = "Crescendo", FK = "Flick", ZM = "Zoom", TR = "Tracking & cascata";
const motionSel = (d) => sel("motion","Movimento",d,[["shrink","Blur + escala diminuindo"],["grow","Crescendo (pequeno → grande)"],["zoom","Zoom atravessando"],["rise","Subindo"],["tracking","Letras se abrindo"],["pullback","Câmera 3D se afastando"]]);
const layoutSel = (d) => sel("layout","Disposição",d,[["top","Pequenas em cima"],["bottom","Pequenas embaixo"],["split","Pequenas cruzadas (cima/baixo)"]]);
const alignSel = (d) => sel("align","Alinhamento",d,[["center","Centro"],["left","Esquerda"],["right","Direita"]]);
const L = (id, name, category, description, words, o) => {
  const [s1, s2, big] = words;
  const motion = o.motion ?? "shrink";
  const defFrom = motion === "grow" ? 0.7 : motion === "zoom" ? 2.4 : 1.12;
  const cam = motion === "pullback" ? [n("camNear","Câmera: começa perto (quanto)",o.near ?? 420,0,1200), n("camFar","Câmera: termina longe (quanto)",o.far ?? -160,-800,200), n("camTurn","Câmera: giro inicial (graus)",o.turn ?? -16,-45,45), n("camTilt","Câmera: inclinação inicial (graus)",o.tilt ?? 10,-30,30)] : [];
  const defTo = motion === "grow" ? 1.06 : 0.97;
  return {
    id: `let-${id}`, name, category, kind: "letterings", description, style: "lettering", fps: 30, durationInFrames: o.dur ?? 90, formats: V,
    fields: [
      t("small1","Palavra pequena 1",s1,{maxLength:20}), t("small2","Palavra pequena 2",s2,{maxLength:20}), t("big","Palavra grande",big,{maxLength:16}),
      layoutSel(o.layout ?? "top"), alignSel(o.align ?? "center"),
      n("posX","Posição horizontal (%)",o.px ?? 0,-45,45,1), n("posY","Posição vertical (%)",o.py ?? 0,-45,45,1),
      motionSel(motion), n("speed","Velocidade do movimento",o.speed ?? 1,0.3,3,0.1), ...cam,
      tog("flick","Flick",o.flick ?? false), tog("flickOut","Flick também ao sumir",o.flickOut ?? true), tog("stagger","Entrada em cascata",o.stagger ?? false),
      f(o.font,"font","Fonte da palavra grande"), f(o.smallFont ?? o.font,"smallFont","Fonte das pequenas"),
      n("bigSize","Tamanho",o.size ?? 200,60,360), n("lineGap","Espaço entre as linhas (negativo aproxima)",o.gap ?? -0.04,-0.25,0.3,0.01), n("smallRatio","Proporção das pequenas",o.ratio ?? 0.3,0.12,0.7,0.01),
      n("blurAmount","Intensidade do blur",o.blur ?? 1,0,3,0.1), n("scaleFrom","Escala inicial",o.sf ?? defFrom,0.3,4,0.01), n("scaleTo","Escala final",o.st ?? defTo,0.5,2,0.01),
      n("introFrames","Duração da entrada (frames)",o.intro ?? 18,4,40), n("outroFrames","Duração da saída (frames)",o.outro ?? 18,4,40),
      c("bigColor","Cor da palavra grande",o.big), c("smallColor","Cor das pequenas",o.small ?? o.big),
      ...(o.glow ? [tog("glow","Brilho",true), c("glowColor","Cor do brilho",o.glow)] : []),
      c("bgColor","Cor de fundo (só se desligar transparente)",o.bg ?? "#111111"), tog("transparent","Fundo transparente",true),
    ],
    props: { bigWeight: o.bw ?? 800, smallWeight: o.sw ?? 600, uppercase: !!o.upper, smallUppercase: !!o.supper, smallItalic: !!o.sitalic, bigItalic: !!o.bitalic, smallTracking: o.strack ?? 0, bigTracking: o.btrack ?? -0.02, charRatio: o.cr ?? 0.6, staggerFrames: o.sfr ?? 4, trackFrom: o.tf ?? 0.35, zoomOut: o.zo ?? 2.6 },
  };
};
const PB = (id, name, description, words, o) => L(id, name, CA, description, words, { motion: "pullback", flick: true, flickOut: false, dur: 100, ...o });
const presets = [
  // Câmera se afastando: flick no começo + câmera 3D recuando
  PB("cam-icone","Ícone em Recuo","Começa com flick e a câmera se afasta em 3D, como a escala diminuindo.",["num","ícone","mundial."],{font:"playfair",size:210,big:"#ffffff",bw:700,sw:700,align:"left",ratio:0.32}),
  PB("cam-lancamento","Lançamento em Recuo","Flick de entrada e recuo de câmera girando da esquerda.",["o grande","lançamento","CHEGOU"],{font:"montserrat",size:240,big:"#ffffff",small:"#ffd400",upper:true,supper:true,strack:0.25,ratio:0.18,bw:900}),
  PB("cam-neon","Neon em Recuo","Neon piscando na entrada e câmera se afastando.",["modo","noturno","ATIVO"],{font:"spacegrotesk",size:240,big:"#e9fdff",small:"#00e5ff",glow:"#00e5ff",upper:true,supper:true,strack:0.3,ratio:0.17,bw:700,turn:18}),
  PB("cam-classico","Clássico em Recuo","Serifa elegante, recuo suave e inclinação de cima.",["um","clássico","atemporal"],{font:"playfair",size:200,big:"#f5efe0",small:"#c9a45c",sitalic:true,bw:700,ratio:0.3,tilt:18,turn:-8}),
  PB("cam-oferta","Oferta em Recuo","Flick forte na entrada, câmera recua de bem perto.",["só","hoje","-70%"],{font:"montserrat",size:300,big:"#ffd400",small:"#ffffff",supper:true,strack:0.2,ratio:0.16,bw:900,near:700,turn:-22}),
  PB("cam-cruzado","Cruzado em Recuo","Pequenas cruzadas, flick e recuo de câmera.",["a","coleção","INVERNO"],{layout:"split",font:"bebas",smallFont:"playfair",size:300,big:"#ffffff",small:"#9fc3ff",sitalic:true,bw:400,ratio:0.2,cr:0.45,turn:20}),
  PB("cam-cascata","Cascata em Recuo","As palavras entram em cascata com flick enquanto a câmera se afasta.",["passo","a passo","JUNTOS"],{stagger:true,font:"poppins",size:240,big:"#ffffff",small:"#7cf5c4",upper:true,bw:800,ratio:0.24,sfr:5}),
  PB("cam-embaixo","Recuo Pequenas Embaixo","Palavra grande em cima, pequenas embaixo, recuo com giro.",["vale","a pena","AGORA"],{layout:"bottom",font:"bebas",smallFont:"montserrat",size:300,big:"#ffffff",small:"#ff3d5a",supper:true,strack:0.3,ratio:0.14,bw:400,sw:800,cr:0.45,turn:14,tilt:-10}),
  // Blur suave
  L("icone-mundial","Ícone Mundial",BL,"Editorial serifado: entra com blur, encolhe de leve e sai em blur.",["num","ícone","mundial."],{font:"playfair",size:210,big:"#ffffff",bw:700,sw:700,align:"left",ratio:0.32}),
  L("feito-para","Feito para Durar",BL,"Sem serifa forte, pequenas em caixa alta espaçadas.",["feito","para","DURAR"],{font:"montserrat",size:230,big:"#ffffff",upper:true,supper:true,strack:0.3,ratio:0.2,bw:900}),
  L("novo-classico","O Novo Clássico",BL,"Bebas grande com pequenas em itálico serifado.",["o","novo","CLÁSSICO"],{font:"bebas",smallFont:"playfair",size:260,big:"#f5efe0",small:"#c9a45c",sitalic:true,bw:400,ratio:0.24,cr:0.45}),
  L("so-hoje","Só Hoje",BL,"Pequenas embaixo, palavra grande dominante.",["vale","a pena","HOJE"],{font:"montserrat",size:260,big:"#ffffff",small:"#ffd400",layout:"bottom",upper:true,supper:true,strack:0.25,ratio:0.2,bw:900}),
  L("leve-suave","Leve e Suave",BL,"Bem sutil, poppins arredondada, pouco blur.",["bem","leve,","suave"],{font:"poppins",size:200,big:"#ffffff",blur:0.6,sf:1.06,st:0.98,bw:800}),
  // Crescendo
  L("cresce-futuro","Rumo ao Futuro",CR,"Começa pequeno e cresce devagar até ficar grande.",["rumo","ao","FUTURO"],{motion:"grow",font:"spacegrotesk",size:220,big:"#ffffff",upper:true,supper:true,strack:0.3,ratio:0.2,bw:700}),
  L("cresce-sonho","Sonhe Grande",CR,"Crescendo serifado com pequenas cruzadas.",["sonhe","sem medo","grande."],{motion:"grow",layout:"split",font:"playfair",size:220,big:"#ffffff",sitalic:true,bw:700,ratio:0.28}),
  L("cresce-impacto","Impacto Crescente",CR,"Cresce rápido com cascata das palavras.",["agora","é a","HORA"],{motion:"grow",stagger:true,font:"montserrat",size:260,big:"#ffffff",small:"#ff3d5a",upper:true,supper:true,ratio:0.2,bw:900,sf:0.55,st:1.1}),
  L("cresce-neon","Neon Crescente",CR,"Cresce com brilho neon.",["modo","noturno","ON"],{motion:"grow",font:"spacegrotesk",size:300,big:"#e9fdff",small:"#00e5ff",glow:"#00e5ff",upper:true,supper:true,strack:0.3,ratio:0.16,bw:700}),
  // Flick
  L("flick-turbo","Flick Turbo",FK,"Pisca ao aparecer e ao sumir, com blur e escala diminuindo.",["ative","o modo","TURBO"],{flick:true,font:"montserrat",size:250,big:"#ffffff",small:"#00e5ff",upper:true,supper:true,ratio:0.2,bw:900}),
  L("flick-editorial","Flick Editorial",FK,"Serifado elegante com flicks curtos.",["uma","nova","era."],{flick:true,font:"playfair",size:240,big:"#ffffff",align:"left",bw:700,ratio:0.3}),
  L("flick-oferta","Flick Oferta",FK,"Promoção piscando em cascata.",["só","esta semana","-50%"],{flick:true,stagger:true,font:"montserrat",size:280,big:"#ffd400",small:"#ffffff",supper:true,strack:0.2,ratio:0.17,bw:900}),
  L("flick-cresce","Flick Crescendo",FK,"Pisca enquanto cresce de pequeno para grande.",["olha","isso","AQUI"],{flick:true,motion:"grow",font:"bebas",size:300,big:"#ffffff",small:"#ff3d5a",smallFont:"montserrat",supper:true,ratio:0.14,bw:400,cr:0.45,sw:800}),
  L("flick-glitchy","Flick Sinal",FK,"Flicks mais longos e muito blur, como sinal falhando.",["sinal","perdido","404"],{flick:true,blur:1.8,font:"jetbrains",size:280,big:"#ffffff",small:"#7cf5c4",supper:true,strack:0.2,ratio:0.18,bw:700,intro:24,outro:24}),
  // Zoom
  L("zoom-chegou","Chegou",ZM,"Chega atravessando a tela, assenta e sai atravessando de novo.",["finalmente","está aqui","CHEGOU"],{motion:"zoom",font:"montserrat",size:240,big:"#ffffff",upper:true,supper:true,strack:0.2,ratio:0.17,bw:900}),
  L("zoom-serif","Zoom Serifado",ZM,"Zoom de entrada e saída com tipografia editorial.",["um","novo","capítulo"],{motion:"zoom",font:"playfair",size:220,big:"#ffffff",bw:700,ratio:0.3,blur:1.4}),
  L("zoom-flick","Zoom com Flick",ZM,"Zoom atravessando com flicks na chegada e na saída.",["fique","pronto","AGORA"],{motion:"zoom",flick:true,font:"bebas",smallFont:"montserrat",size:300,big:"#ffffff",small:"#ffd400",supper:true,ratio:0.14,bw:400,sw:800,cr:0.45}),
  // Tracking & cascata
  L("abre-letras","Letras se Abrindo",TR,"As letras da palavra grande vão se aproximando enquanto o blur some.",["a","arte do","SILÊNCIO"],{motion:"tracking",font:"montserrat",size:190,big:"#ffffff",small:"#c9a45c",upper:true,supper:true,strack:0.35,ratio:0.2,bw:700,tf:0.45}),
  L("sobe-cascata","Subindo em Cascata",TR,"Cada palavra sobe em sequência, com blur.",["passo","a passo","juntos"],{motion:"rise",stagger:true,font:"poppins",size:220,big:"#ffffff",small:"#7cf5c4",bw:800,ratio:0.28,sfr:5}),
  L("cruzado-cascata","Cruzado em Cascata",TR,"Pequenas cruzadas entrando uma de cada vez.",["a","coleção","VERÃO"],{layout:"split",stagger:true,font:"bebas",smallFont:"playfair",size:300,big:"#ffffff",small:"#ffb37a",sitalic:true,bw:400,ratio:0.2,cr:0.45,sfr:6}),
];
for (const p of presets) fs.writeFileSync(`${out}/${p.id}.json`, JSON.stringify(p, null, 2) + "\n");
console.log(presets.length, "presets");
