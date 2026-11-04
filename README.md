# Motion Presets

Plataforma web de templates de motion design para editores de vídeo.
O editor escolhe um template, troca textos, cores e fonte, vê o preview ao vivo e exporta o vídeo.
Tudo é renderizado com [Remotion](https://www.remotion.dev), **sem nenhuma IA**.

## Como rodar

```bash
npm install
npm run dev        # interface em http://localhost:5173 (API em :3001)
```

Produção (interface e API num único servidor, na porta 3001):

```bash
npm run build
npm start
```

> O Remotion baixa sozinho o Chrome headless na primeira renderização.
> Para usar um Chrome já instalado, defina `REMOTION_BROWSER_EXECUTABLE=/caminho/para/chrome-headless-shell`.
> `RENDER_CONCURRENCY` controla quantas abas renderizam em paralelo.

## Como funciona

```
presets/*.json        ← os TEMPLATES (um arquivo = um template na galeria)
src/styles/*.tsx      ← os ESTILOS de animação (o "motor" de cada tipo de template)
src/remotion/         ← composição Remotion única ("Preset") que recebe estilo + valores
src/web/              ← interface: galeria, editor e exportação
server/index.ts       ← API: lista presets e renderiza vídeos (fila de render)
```

**Estilo** é a animação (ex.: `lower-third`, `counter`). **Preset** é um JSON que usa um estilo com
textos, cores e fonte padrão, e define quais campos o editor pode alterar. Um mesmo estilo gera vários presets.

### Criar um novo template (só JSON, sem programar)

Crie `presets/meu-template.json`. Ele aparece na galeria ao recarregar a página, sem reiniciar o servidor:

```json
{
  "id": "meu-template",
  "name": "Meu Template",
  "category": "Títulos",
  "description": "Descrição curta que aparece no card.",
  "style": "kinetic-words",
  "fps": 30,
  "durationInFrames": 90,
  "formats": ["16:9", "9:16", "1:1", "4:5"],
  "fields": [
    { "key": "text", "label": "Texto", "type": "textarea", "default": "OLÁ *MUNDO*" },
    { "key": "textColor", "label": "Cor do texto", "type": "color", "default": "#ffffff" },
    { "key": "accentColor", "label": "Cor do destaque", "type": "color", "default": "#ff3d5a" },
    { "key": "bgColor", "label": "Cor de fundo", "type": "color", "default": "#000000" },
    { "key": "transparent", "label": "Fundo transparente", "type": "toggle", "default": false }
  ],
  "props": { "font": "montserrat", "fontSize": 140, "wordDelay": 5, "uppercase": true }
}
```

- `fields`: o que o editor pode mudar. Tipos: `text`, `textarea`, `color`, `number` (com `min`/`max`/`step`),
  `toggle`, `select` (com `options`), `font` e `image` (upload, link ou exemplo embutido como `"builtin:perfume"`, `"builtin:headphones"`, `"builtin:bag"`).
- `props`: valores **fixos** do estilo que o editor não vê. Use para "travar" o visual do preset.
- Para ver quais chaves cada estilo aceita, abra o arquivo do estilo em `src/styles/` (tudo que aparece como `v.algumaCoisa`)
  ou copie um preset existente do mesmo estilo.

### Estilos disponíveis

| Estilo | O que faz | Chaves principais |
|---|---|---|
| `kinetic-words` | Palavras surgem uma a uma (use `*palavra*` para destacar) | text, font, fontSize, wordDelay, uppercase, textColor, accentColor, accentBox, accentBoxColor |
| `lower-third` | Nome + cargo com barra lateral | name, role, align, textColor, boxColor, accentColor, roleColor |
| `cinematic-title` | Título com espaçamento e desfoque, linhas finas | title, subtitle, fontSize, textColor, accentColor |
| `block-reveal` | Bloco de cor revela até 3 linhas | line1, line2, line3, align, uppercase, accentColor, secondColor |
| `counter` | Número contando com barra de progresso | prefix, value, startValue, suffix, decimals, label |
| `typewriter` | Texto digitado com cursor | prompt, text, speed, align |
| `bullet-list` | Lista de até 5 itens (check ou numerada) | title, item1…item5, numbered, stagger |
| `quote` | Citação com aspas animadas | quote, author, italic |
| `highlight` | Marca-texto sobre palavra-chave | before, highlight, after, markStyle |
| `subscribe-cta` | Cursor clica em "Inscrever-se" e o sino toca | channelName, buttonText, doneText, showBell, cardColor |
| `social-handle` | Pílula com @ da rede social | platform, handle, position, useBrandColor |

| `camera-3d` | Plano 3D voando até a câmera, dolly e saída passando pela câmera | title, subtitle, direction, glow, vignette, orbit, speed |
| `flip-3d-words` | Palavras trocando como faces de um cubo 3D | prefix, words (separadas por \|), stacked, boxColor |
| `depth-tunnel` | Câmera atravessa túnel; palavras com profundidade de campo | words, ringColor, twist |
| `orbit-3d` | Palavras orbitando o título em 3D | title, items, spinSpeed, tilt |
| `retro-floor` | Synthwave: chão em grade 3D, sol e neon piscando | title, subtitle, speed, cores do céu/sol/grade |
| `slam-impact` | Palavras batendo com blur, flash e tremor | text, beat, shake, flash, mode (single/stack), stripes |
| `glitch` | Separação RGB, fatias, ruído e flicker | title, subtitle, intensity, scanlines |
| `whip-speed` | Whip-pan com motion blur e linhas de velocidade | line1, line2, italic |
| `strobe-cut` | Uma palavra por vez com fundo alternando | text, framesPerWord, chaos, colorA/B/C |
| `cine-reveal` | Letterbox, letras saindo do desfoque, flare e luz | title, subtitle, letterbox, flare, leaks, flicker |
| `trailer` | Frases entre cortes no preto e título final | lines, finalTitle, date, flash, leaks |
| `background-scene` | Fundo animado + texto (blobs, particles, shapes, grid, confetti, stripes) | title, subtitle, background, card, color1/2/3 |

| `product-flick` | Produto entra em flicks rápidos e frases trocam em cortes secos (texto atrás ou na frente) | image, small1..3, big1..3, textOffset, imageScale, imageY, textLayer, flickSpeed, flash |
| `product-spin-3d` | Produto girando em 3D sobre palavra gigante, com reflexo e selo | image, bgWord, title, subtitle, badge, swing, marquee, reflection |
| `glass-card-3d` | Cartão de vidro 3D com reflexo; o produto salta para fora | image, title, subtitle, badge, cardLabel, sway, impact, blobs, glassColor |
| `glass-shatter` | Vidro trinca e estilhaça revelando produto e título | image, title, subtitle, crackHold, force, glassColor, crackColor |
| `product-impact` | Produto despenca com onda de choque, linhas radiais e texto martelado | image, text, badge, shake |
| `impact-frame` | Linhas de velocidade estilo mangá, frames invertidos e soco de texto | title, showImage, image, lineCount, invert, tilt |

| `text-flick-3d` | Só texto: frases em flick, câmera 3D e zoom atravessando a tela | small1..4, big1..4, cameraMode, cameraAmount, flickAmount, zoomScale, zoomFrames, flash, echo |

| `camera-3-points` | Câmera 3D viaja por 3 pontos no espaço, cada um com um texto | label1..3, text1..3, layout (zigzag/corredor/escada/orbita), motion (smooth/whip), springDamping, drift, travelFrames, depth, bank, motionBlur, focusBlur, flick, showIndex |

| `outline-flick` | Texto chega atravessando a tela, escala diminuindo suave, contorno desenhado na *palavra* e saída em blur | text, outlineShape (ellipse/double/box/underline/brackets), outlineAt, outlineFrames, outlineWidth, outlineBlur, outlineOpacity, scaleFrom, introFrames, scaleTo, outroFrames, cinemaBlur |

Os CTAs (`subscribe-cta`, `social-handle`) aceitam `avatar`: a foto do perfil (Instagram, YouTube…), ou vazio para usar a inicial.

Todos aceitam `font`, `bgColor` e `transparent`, e se adaptam a 16:9, 9:16, 1:1 e 4:5.

### Criar um novo estilo (programando)

1. Crie `src/styles/MeuEstilo.tsx` recebendo `{ v }` (os valores). Use `useUnit()` para tamanhos responsivos e `<Background v={v}>` para o fundo/transparência.
2. Registre-o em `src/styles/index.ts`.
3. Crie presets JSON apontando para ele.

### Fontes

As fontes ficam em `src/assets/fonts` (embutidas, sem depender da internet na hora do render).
Para adicionar uma, coloque o `.woff2` lá e registre em `src/fonts.ts`.

## Exportação

| Formato | Uso |
|---|---|
| MP4 (H.264) | Vídeo com fundo, compatível com tudo |
| MOV ProRes 4444 | **Com transparência**: para Premiere, Final Cut, DaVinci, After Effects |
| WebM VP9 | Com transparência, arquivo leve (web, CapCut desktop) |
| GIF | Prévia rápida |

Com "Fundo transparente" ligado, a plataforma já sugere MOV.

**PNG sem fundo:** o botão "Baixar PNG sem fundo" exporta o quadro em que o preview está pausado, com fundo transparente e todos os elementos e textos.

## Revisão visual

```bash
npx tsx scripts/preview-all.ts out/previews 16:9,9:16
```
Gera um PNG de cada preset em cada formato.

## Versão sem servidor (para celular)

```bash
npm run build:artifact
```
Gera `dist-standalone/motion-presets.html`, um único arquivo com tudo embutido, que exporta o vídeo no próprio navegador (MP4/WebM).
