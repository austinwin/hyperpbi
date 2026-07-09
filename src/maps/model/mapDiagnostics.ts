// ── Map Diagnostics ──────────────────────────────────────────────────
// Runtime diagnostics model for map layers and joins.

export interface MapLayerDiagnosticsData {
    featureCount: number;
    requestCount: number;
    loading: boolean;
    error?: string;
    sourceUrl?: string;
    sourceType: string;
    geometryType: string;
    objectIdField?: string;
    joinField?: string;
    joinDiagnostics?: MapJoinDiagnosticsData;
    usedServiceSymbology: boolean;
    usedServiceLabels: boolean;
    warnings: string[];
}

export interface MapJoinDiagnosticsData {
    powerBiRowCount: number;
    powerBiDistinctKeyCount: number;
    serviceFeatureCount: number;
    serviceDistinctKeyCount: number;
    matchedPowerBiRowCount: number;
    matchedServiceFeatureCount: number;
    unmatchedPowerBiKeyCount: number;
    unmatchedServiceFeatureCount: number;
    blankPowerBiKeyCount: number;
    blankServiceKeyCount: number;
    duplicatePowerBiKeyCount: number;
    duplicateServiceKeyCount: number;
    matchRate: number;
    sampleUnmatchedPowerBiKeys: string[];
    sampleDuplicatePowerBiKeys: string[];
    sampleDuplicateServiceKeys: string[];
}

export function emptyDiagnostics(): MapLayerDiagnosticsData {
    return {
        featureCount: 0,
        requestCount: 0,
        loading: false,
        sourceType: "powerbi",
        geometryType: "unknown",
        usedServiceSymbology: false,
        usedServiceLabels: false,
        warnings: [],
    };
}
