export type MapCapabilityStatus = "implemented" | "partial" | "experimental" | "deprecated" | "unsupported";

export interface MapCapabilityRegistryEntry {
    schemaPath: string;
    status: MapCapabilityStatus;
    runtimeModule: string;
    validationModule: string;
    studioSupport: string;
    documentationSection: string;
    focusedTestFile: string;
    limitation?: string;
}

const runtime = "src/components/maps/MapBlock.tsx; src/components/maps/LeafletMap.tsx";
const validation = "src/schema/mapSchemaValidation.ts";
const studio = "src/editor/map-studio/MapStudio.tsx";
const documentation = "docs/map-services.md#schema-runtime-capability-status";
const test = "tests/map-schema-runtime-parity.test.ts";

const entries = (status: MapCapabilityStatus, paths: string[], limitation?: string, runtimeModule = runtime): MapCapabilityRegistryEntry[] => paths.map(schemaPath => ({
    schemaPath, status, runtimeModule, validationModule: validation, studioSupport: studio,
    documentationSection: documentation, focusedTestFile: test, ...(limitation ? { limitation } : {}),
}));

export const mapCapabilityRegistry: readonly MapCapabilityRegistryEntry[] = [
    ...entries("implemented", [
        "map.view.center", "map.view.zoom", "map.view.minZoom", "map.view.maxZoom", "map.view.fitPadding",
        "map.height", "map.heightMode", "map.minHeight", "map.aspectRatio", "map.featureDetails.mode", "map.featureDetails.clearSelectionOnBackgroundClick", "map.featureDetails.clearSelectionOnClose",
        "map.basemap.type", "map.basemap.url", "map.basemap.attribution", "map.basemap.maxZoom", "map.basemap.visible",
        "map.search.enabled", "map.search.placeholder", "map.search.zoom", "map.search.showResultMarker", "map.search.clearMarkerOnClose", "map.search.autoSelectFirst",
        "map.legend.defaultOpen", "map.layerGroups[].id", "map.layerGroups[].name", "map.layerGroups[].visible", "map.layerGroups[].collapsed", "map.layerGroups[].opacity", "map.layerGroups[].order",
        "map.bookmarks[].id", "map.bookmarks[].label", "map.bookmarks[].center", "map.bookmarks[].zoom",
        "map.layers[].id", "map.layers[].name", "map.layers[].dataset", "map.layers[].groupId", "map.layers[].visible", "map.layers[].opacity", "map.layers[].order",
        "map.layers[].source.type", "map.layers[].source.powerbi.bindings.layer", "map.layers[].source.powerbi.bindings.type", "map.layers[].source.powerbi.bindings.latitude", "map.layers[].source.powerbi.bindings.longitude",
        "map.layers[].source.powerbi.bindings.x", "map.layers[].source.powerbi.bindings.y", "map.layers[].source.powerbi.bindings.address", "map.layers[].source.powerbi.bindings.city", "map.layers[].source.powerbi.bindings.state",
        "map.layers[].source.powerbi.bindings.zip", "map.layers[].source.powerbi.bindings.geometry", "map.layers[].source.powerbi.bindings.color", "map.layers[].source.powerbi.bindings.size",
        "map.layers[].source.powerbi.bindings.tooltip", "map.layers[].source.powerbi.bindings.details", "map.layers[].source.powerbi.layerValue",
        "map.layers[].source.arcgisFeature.url", "map.layers[].source.arcgisFeature.layerId", "map.layers[].source.arcgisFeature.useServiceRenderer", "map.layers[].source.arcgisFeature.useServiceLabels",
        "map.layers[].source.arcgisFeature.definitionExpression", "map.layers[].source.arcgisFeature.outFields", "map.layers[].source.arcgisFeature.mode", "map.layers[].source.arcgisFeature.refreshIntervalMinutes",
        "map.layers[].source.arcgisTile.url", "map.layers[].source.arcgisTile.attribution", "map.layers[].source.arcgisTile.minZoom", "map.layers[].source.arcgisTile.maxZoom",
        "map.layers[].source.arcgisDynamic.url", "map.layers[].source.arcgisDynamic.layerIds", "map.layers[].source.arcgisDynamic.layerDefinitions", "map.layers[].source.arcgisDynamic.format",
        "map.layers[].source.arcgisDynamic.transparent", "map.layers[].source.arcgisDynamic.minZoom", "map.layers[].source.arcgisDynamic.maxZoom", "map.layers[].source.arcgisDynamic.attribution", "map.layers[].source.arcgisDynamic.debounceMs",
        "map.layers[].source.arcgisDynamic.identify", "map.layers[].source.arcgisDynamic.identify.enabled", "map.layers[].source.arcgisDynamic.identify.tolerance", "map.layers[].source.arcgisDynamic.identify.layerOption", "map.layers[].source.arcgisDynamic.identify.maxResults",
        "map.layers[].join.enabled", "map.layers[].join.powerBiField", "map.layers[].join.serviceField", "map.layers[].join.cardinality", "map.layers[].join.normalization",
        "map.layers[].join.powerBiDuplicatePolicy", "map.layers[].join.serviceDuplicatePolicy", "map.layers[].join.unmatchedPolicy", "map.layers[].join.aggregations", "map.layers[].join.aggregations[].field", "map.layers[].join.aggregations[].aggregation", "map.layers[].join.aggregations[].as", "map.layers[].join.queryStrategy",
        "map.layers[].renderer.service.type", "map.layers[].renderer.simple.type", "map.layers[].renderer.simple.symbol", "map.layers[].renderer.uniqueValue.type", "map.layers[].renderer.uniqueValue.field",
        "map.layers[].renderer.uniqueValue.fieldSource", "map.layers[].renderer.uniqueValue.values", "map.layers[].renderer.uniqueValue.values[].value", "map.layers[].renderer.uniqueValue.values[].label", "map.layers[].renderer.uniqueValue.values[].symbol", "map.layers[].renderer.uniqueValue.defaultSymbol", "map.layers[].renderer.uniqueValue.defaultLabel",
        "map.layers[].renderer.classBreaks.type", "map.layers[].renderer.classBreaks.field", "map.layers[].renderer.classBreaks.fieldSource", "map.layers[].renderer.classBreaks.method", "map.layers[].renderer.classBreaks.classes",
        "map.layers[].renderer.classBreaks.breaks", "map.layers[].renderer.classBreaks.breaks[].min", "map.layers[].renderer.classBreaks.breaks[].max", "map.layers[].renderer.classBreaks.breaks[].label", "map.layers[].renderer.classBreaks.breaks[].symbol", "map.layers[].renderer.classBreaks.colorRamp", "map.layers[].renderer.continuousColor.type", "map.layers[].renderer.continuousColor.field", "map.layers[].renderer.continuousColor.fieldSource",
        "map.layers[].renderer.continuousColor.minColor", "map.layers[].renderer.continuousColor.maxColor", "map.layers[].renderer.continuousColor.clamp", "map.layers[].renderer.proportionalSize.type",
        "map.layers[].renderer.proportionalSize.field", "map.layers[].renderer.proportionalSize.fieldSource", "map.layers[].renderer.proportionalSize.minSize", "map.layers[].renderer.proportionalSize.maxSize", "map.layers[].renderer.proportionalSize.color",
        "map.layers[].renderer.cluster.type", "map.layers[].renderer.cluster.radius", "map.layers[].renderer.cluster.disableAtZoom", "map.layers[].renderer.cluster.showCoverageOnHover", "map.layers[].renderer.cluster.clusterLabel", "map.layers[].renderer.cluster.aggregateField", "map.layers[].renderer.cluster.fieldSource", "map.layers[].renderer.cluster.format",
        "map.layers[].labels.enabled", "map.layers[].labels.field", "map.layers[].labels.fieldSource", "map.layers[].labels.template", "map.layers[].labels.placement", "map.layers[].labels.minZoom", "map.layers[].labels.maxZoom",
        "map.layers[].labels.color", "map.layers[].labels.size", "map.layers[].labels.weight", "map.layers[].labels.haloColor", "map.layers[].labels.haloSize", "map.layers[].labels.backgroundColor", "map.layers[].labels.padding", "map.layers[].labels.maxLabels",
        "map.layers[].popup.enabled", "map.layers[].popup.title", "map.layers[].popup.fields", "map.layers[].popup.fields[].field", "map.layers[].popup.fields[].fieldSource", "map.layers[].popup.fields[].label", "map.layers[].popup.fields[].format", "map.layers[].popup.fields[].display", "map.layers[].popup.actions", "map.layers[].popup.actions[].id", "map.layers[].popup.actions[].label", "map.layers[].popup.actions[].icon", "map.layers[].popup.actions[].uiAction", "map.layers[].popup.html",
        "map.layers[].tooltip.enabled", "map.layers[].tooltip.fields", "map.layers[].tooltip.fields[].field", "map.layers[].tooltip.fields[].fieldSource", "map.layers[].tooltip.fields[].label", "map.layers[].tooltip.fields[].format", "map.layers[].tooltip.template",
        "map.layers[].visibility.minZoom", "map.layers[].visibility.maxZoom", "map.layers[].visibility.conditionField", "map.layers[].visibility.conditionFieldSource", "map.layers[].visibility.conditionValues",
        "map.layers[].filter", "map.layers[].filter[].field", "map.layers[].filter[].fieldSource", "map.layers[].filter[].operator", "map.layers[].filter[].value", "map.layers[].performance.maxFeatures", "map.layers[].performance.cacheMinutes", "map.layers[].performance.viewportQuery", "map.layers[].performance.requestBatchSize",
        "map.layers[].interaction", "map.layers[].interaction.enabled", "map.layers[].interaction.internalMode", "map.layers[].interaction.internalScope", "map.layers[].interaction.externalMode", "map.layers[].interaction.field", "map.layers[].interaction.fieldSource", "map.layers[].interaction.operator", "map.layers[].interaction.value", "map.layers[].interaction.selectionMode", "map.layers[].interaction.multiSelect", "map.layers[].interaction.showSelector", "map.layers[].interaction.clearOnSecondClick", "map.layers[].legend.visible", "map.layers[].legend.title", "map.layers[].legend.collapsed",
        "map.layerPanel.visible", "map.layerPanel.position", "map.layerPanel.defaultOpen", "map.layerPanel.allowViewerReorder", "map.layerPanel.allowViewerOpacity", "map.layerPanel.allowViewerLabels",
        "map.toolbar.visible", "map.toolbar.home", "map.toolbar.layers", "map.toolbar.legend", "map.toolbar.search", "map.toolbar.clearSelection", "map.toolbar.zoomToSelection", "map.toolbar.bookmarks",
    ]),
    ...entries("partial", ["map.view.fitMode"], "data and allVisibleLayers use all supported visible feature bounds; firstLayer uses the first visible feature layer."),
    ...entries("partial", ["map.layers[].join.keyType"], "Join normalization determines comparison values; keyType is retained for diagnostics and Studio guidance."),
    ...entries("partial", ["map.layers[].interaction.trigger"], "Map-layer feature interactions support the click trigger only; change and auto remain available to non-map component contracts."),
    ...entries("partial", ["map.layers[].labels.collision"], "hideOverlaps provides bounded basic collision hiding, not advanced cartographic placement."),
    ...entries("partial", ["map.layers[].visibility.scaleDependent"], "Zoom visibility is implemented; exact service-scale denominators are not exposed by Leaflet."),
    ...entries("experimental", ["map.view.preserveView"], "View preservation is limited to the mounted map instance and is not persisted across report reloads."),
    ...entries("experimental", [
        "map.layers[].renderer.heatmap.type", "map.layers[].renderer.heatmap.weightField", "map.layers[].renderer.heatmap.fieldSource", "map.layers[].renderer.heatmap.radius", "map.layers[].renderer.heatmap.blur", "map.layers[].renderer.heatmap.minOpacity", "map.layers[].renderer.heatmap.gradient",
    ], "Heatmap configuration is accepted with diagnostics and currently uses bounded point-symbol fallback rendering."),
    ...entries("experimental", [
        "map.layers[].renderer.densityGrid.type", "map.layers[].renderer.densityGrid.statistic", "map.layers[].renderer.densityGrid.field", "map.layers[].renderer.densityGrid.fieldSource", "map.layers[].renderer.densityGrid.cellSizePixels", "map.layers[].renderer.densityGrid.classes", "map.layers[].renderer.densityGrid.colorRamp",
    ], "Density grid is a basic bounded preview and not advanced spatial analysis."),
    ...entries("deprecated", ["map.layers[].performance.generalizeByZoom", "map.layers[].performance.minimumGeneralization", "map.layers[].performance.maximumGeneralization"], "Retained for schema compatibility only; the runtime does not generalize service or Power BI geometry and Map Studio does not expose these options."),
    ...entries("deprecated", ["map.layers[].performance.progressiveRendering"], "Retained for schema compatibility only; resolved layers are committed atomically and Map Studio does not expose this option."),
    ...entries("unsupported", [
        "map.tools.scaleBar", "map.tools.coordinateDisplay", "map.tools.rectangleSelection", "map.tools.lassoSelection",
        "map.tools.distanceMeasurement", "map.tools.areaMeasurement", "map.tools.timeSlider", "map.tools.swipe",
        "map.tools.sideBySide", "map.tools.exportSelected", "map.tools.printLayout", "map.layerPanel.openInMapStudio",
    ], "This requested P1 viewer capability is registered for future work and is not accepted by the current schema.", "Not implemented"),
];

export const mapCapabilityByPath = new Map(mapCapabilityRegistry.map(entry => [entry.schemaPath, entry] as const));

export function mapCapability(path: string): MapCapabilityRegistryEntry | undefined {
    return mapCapabilityByPath.get(path);
}
