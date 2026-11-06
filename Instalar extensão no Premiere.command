#!/bin/bash
# Instala o painel Anakin no Premiere Pro (Mac).
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/Anakin"
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$DIR/premiere-extension/Anakin" "$DEST"
# extensões sem assinatura precisam deste ajuste (vale para as versões recentes do Premiere)
for v in 9 10 11 12 13; do defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1; done
osascript -e 'display dialog "Extensão Anakin instalada.\n\n1. Abra o Anakin (Abrir Anakin).\n2. Reinicie o Premiere.\n3. Menu Janela > Extensões > Anakin." buttons {"OK"} default button "OK"'
