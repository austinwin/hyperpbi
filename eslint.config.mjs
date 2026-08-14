import powerbiVisualsConfigs from "eslint-plugin-powerbi-visuals";

export default [
    powerbiVisualsConfigs.configs.recommended,
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "apps/playground/dist/**",
            "apps/web/.next/**",
            "apps/web/.open-next/**",
            "apps/web/.wrangler/**",
            "apps/web/dist/**",
            "apps/web/out/**",
            "apps/web/public/geolibre/**",
            "apps/web/public/runtime/**",
            "vendor/**",
            ".vscode/**",
            ".tmp/**",
        ],
    },
];
