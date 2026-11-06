#!/bin/bash
# Abre o Anakin no Mac: instala o que falta na primeira vez, inicia e abre no navegador.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "Falta o Node.js" message "Instale o Node.js (versão LTS) em nodejs.org e abra o Anakin de novo."'
  open "https://nodejs.org"
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Primeira vez: instalando (pode levar alguns minutos)…"
  npm install || { osascript -e 'display alert "Não foi possível instalar" message "Verifique a internet e tente de novo."'; exit 1; }
fi
[ -f dist/index.html ] || npm run build
(sleep 4; open "http://localhost:3001") &
echo "Anakin aberto em http://localhost:3001 — deixe esta janela aberta enquanto usa."
NODE_ENV=production npx tsx server/index.ts
