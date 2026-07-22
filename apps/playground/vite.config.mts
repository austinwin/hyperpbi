import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    root: fileURLToPath(new URL(".", import.meta.url)),
    plugins: [preact()],
    resolve: {
        alias: {
            "@hyperpbi": fileURLToPath(new URL("../../src", import.meta.url))
        }
    },
    worker: { format: "es" },
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
