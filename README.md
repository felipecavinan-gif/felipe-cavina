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
  `toggle`, `select` (com `options`), `font`.
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

## Revisão visual

```bash
npx tsx scripts/preview-all.ts out/previews 16:9,9:16
```
Gera um PNG de cada preset em cada formato.
