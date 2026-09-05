import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import prefixSelector from "postcss-prefix-selector";

const webRestHosts = (process.env.HYPERPBI_WEB_REST_HOSTS ?? "https://*.miniup.app")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/runtime/",
  plugins: [preact()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "__HYPERPBI_WEB_REST_HOSTS__": JSON.stringify(webRestHosts),
  },
  css: {
    postcss: {
      plugins: [
        prefixSelector({
          prefix: ".runtime-island__host",
        }),
      ],
    },
  },
  resolve: {
    alias: {
      "@hyperpbi": fileURLToPath(new URL("../../../src", import.meta.url)),
    },
  },
  worker: { format: "es" },
  build: {
    outDir: fileURLToPath(new URL("../public/runtime", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL("./src/index.tsx", import.meta.url)),
      formats: ["es"],
      fileName: () => "hyperpbi-island.js",
      cssFileName: "hyperpbi-island",
    },
    rollupOptions: {
      output: {
        manualChunks: {
          spreadsheet: ["@e965/xlsx"],
          charts: ["echarts"],
          maps: ["leaflet", "leaflet.markercluster"],
        },
      },
    },
  },
});
