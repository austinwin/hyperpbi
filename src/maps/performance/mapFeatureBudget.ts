import type { ResolvedMapLayer } from "../model/resolvedMapTypes";

export const DEFAULT_GLOBAL_MAP_FEATURE_BUDGET = 20_000;

/** Applies one deterministic feature budget after all layer sources resolve. */
export function applyGlobalMapFeatureBudget(layers: ResolvedMapLayer[], budget = DEFAULT_GLOBAL_MAP_FEATURE_BUDGET): ResolvedMapLayer[] {
    let remaining = Math.max(0, Math.floor(budget));
    return layers.map(layer => {
        const keep = Math.min(remaining, layer.features.length);
        remaining -= keep;
        if (keep === layer.features.length) return layer;
        const message = `The map-wide feature budget retained ${keep.toLocaleString()} of ${layer.features.length.toLocaleString()} features in layer “${layer.name}”.`;
        return {
            ...layer,
            features: layer.features.slice(0, keep),
            diagnostics: {
                ...layer.diagnostics,
                featureCount: keep,
                validFeatureCount: keep,
                warnings: [...layer.diagnostics.warnings, message],
                issues: [...(layer.diagnostics.issues ?? []), {
                    code: "MAP_GLOBAL_FEATURE_LIMIT" as const,
                    severity: "warning" as const,
                    message,
                    path: "/performance/globalMapFeatureBudget",
                    details: { budget, originalLayerFeatureCount: layer.features.length, retainedLayerFeatureCount: keep },
                }],
            },
        };
    });
}
