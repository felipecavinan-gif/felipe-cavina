// Converte dist-standalone/index.html no formato de página do Artifact (sem <html>/<head>/<body>).
import fs from "node:fs";
const [src = "dist-standalone/index.html", out = "dist-standalone/motion-presets.html"] = process.argv.slice(2);
const html = fs.readFileSync(src, "utf8");
// Os <script> do build são tags de topo; os estilos são procurados só fora deles.
const scriptRe = /<script\b[^>]*>[\s\S]*?<\/script>/g;
const scripts = [...html.matchAll(scriptRe)].map((m) => m[0]).join("\n");
const rest = html.replace(scriptRe, "");
const styles = [...rest.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join("\n");
const page = `<title>Motion Presets</title>\n${styles}\n<div id="root"></div>\n${scripts}\n`;
fs.writeFileSync(out, page);
console.log(out, (page.length / 1e6).toFixed(2), "MB");
