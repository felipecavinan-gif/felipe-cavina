/* Anakin — funções do Premiere Pro chamadas pelo painel (ExtendScript). */

function anakin_q(s) {
  s = String(s);
  var out = '"';
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i), code = s.charCodeAt(i);
    if (c === '"' || c === "\\") out += "\\" + c;
    else if (code < 32) out += "\\u" + ("0000" + code.toString(16)).slice(-4);
    else out += c;
  }
  return out + '"';
}

/** Tamanho, fps e ponto de reprodução da sequência ativa. */
function anakin_getSequence() {
  var s = app.project.activeSequence;
  if (!s) return '{"error":"Abra uma sequência no Premiere primeiro."}';
  var TICKS = 254016000000;
  var fps = TICKS / Number(s.timebase);
  var ph = s.getPlayerPosition();
  return '{"seq":{"name":' + anakin_q(s.name) +
    ',"width":' + s.frameSizeHorizontal + ',"height":' + s.frameSizeVertical +
    ',"fps":' + fps + ',"playhead":' + ph.seconds + ',"videoTracks":' + s.videoTracks.numTracks + '}}';
}

function anakin_bin() {
  var root = app.project.rootItem;
  for (var i = 0; i < root.children.numItems; i++) {
    var it = root.children[i];
    if (it && it.type === ProjectItemType.BIN && it.name === "Anakin") return it;
  }
  return root.createBin("Anakin");
}

function anakin_samePath(a, b) {
  a = String(a).replace(/\\/g, "/").toLowerCase();
  b = String(b).replace(/\\/g, "/").toLowerCase();
  return a === b;
}

function anakin_find(bin, path) {
  for (var i = bin.children.numItems - 1; i >= 0; i--) {
    var it = bin.children[i];
    try { if (it && it.getMediaPath && anakin_samePath(it.getMediaPath(), path)) return it; } catch (e) {}
  }
  return null;
}

/** Importa o .mov para a pasta "Anakin" do projeto e coloca na faixa de vídeo pedida (sem empurrar nada). */
function anakin_place(path, atSeconds, trackNumber) {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return '{"ok":false,"error":"Abra uma sequência no Premiere primeiro."}';
    var bin = anakin_bin();
    app.project.importFiles([path], true, bin, false);
    var item = anakin_find(bin, path);
    if (!item) return '{"ok":false,"error":' + anakin_q("O arquivo foi gerado mas não foi importado: " + path) + "}";

    var idx = Math.max(1, trackNumber) - 1;
    if (idx >= seq.videoTracks.numTracks) {
      try {
        app.enableQE();
        qe.project.getActiveSequence().addTracks(idx - seq.videoTracks.numTracks + 1, seq.videoTracks.numTracks, 0);
      } catch (e) {}
      seq = app.project.activeSequence;
      if (idx >= seq.videoTracks.numTracks) idx = seq.videoTracks.numTracks - 1;
    }
    var t = new Time();
    t.seconds = atSeconds;
    seq.videoTracks[idx].overwriteClip(item, t.seconds);
    return '{"ok":true}';
  } catch (err) {
    return '{"ok":false,"error":' + anakin_q(String(err)) + "}";
  }
}
