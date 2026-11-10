import { parseMapHostPatterns } from "../../scripts/package-profile-utils.mjs";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    root: fileURLToPath(new URL(".", import.meta.url)),
    cacheDir: "node_modules/.vite",
    plugins: [preact()],
    define: { "__HYPERPBI_WEB_REST_HOSTS__": JSON.stringify(parseMapHostPatterns(process.env.HYPERPBI_WEB_REST_HOSTS ?? "")) },
    resolve: {
        alias: {
            "@hyperpbi": fileURLToPath(new URL("../../src", import.meta.url))
        }
    },
    worker: { format: "es" },
    // Prebundle lazy scene dependencies so the first model import keeps the current dev session.
    optimizeDeps: {
        include: ["three", "three/examples/jsm/controls/OrbitControls.js", "three/examples/jsm/loaders/GLTFLoader.js"]
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: true,
        target: "es2022",
        rollupOptions: {
            output: {
                manualChunks: {
                    spreadsheet: ["@e965/xlsx"],
                    charts: ["echarts"],
                    maps: ["leaflet", "leaflet.markercluster"]
                }
            }
        }
    },
    server: { port: 4178 },
    preview: { port: 4178 }
});
