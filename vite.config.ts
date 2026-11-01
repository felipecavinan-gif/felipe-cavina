import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `vite build --mode standalone` gera um único HTML que roda sem servidor
// (presets embutidos, exportação feita no próprio navegador).
export default defineConfig(({ mode }) => {
  const standalone = mode === "standalone";
  return {
    plugins: [react(), ...(standalone ? [viteSingleFile()] : [])],
    root: "src/web",
    define: standalone ? { "import.meta.env.VITE_STANDALONE": JSON.stringify("1") } : {},
    build: {
      outDir: standalone ? "../../dist-standalone" : "../../dist",
      emptyOutDir: true,
      assetsInlineLimit: standalone ? 100_000_000 : 4096,
    },
    server: { port: 5173, proxy: { "/api": "http://localhost:3001" } },
  };
});
