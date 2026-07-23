import {
  mapCapability,
  mapCapabilityRegistry,
} from "../maps/mapCapabilityRegistry";
import { closestMatches, type Diagnostic } from "./diagnostics";
import { resolveMapLayerCapabilities } from "../maps/model/mapLayerCapabilities";
import type { MapLayerSourceType } from "./mapSchema";
import { isValidIconName } from "../components/icons/iconRegistry";

type Json = Record<string, unknown>;
const object = (value: unknown): value is Json =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const allowed = (...values: string[]) => new Set(values);
const pointer = (value: string) =>
  value.replace(/~/g, "~0").replace(/\//g, "~1");
export const acceptedMapSchemaPaths = new Set(
  mapCapabilityRegistry
    .filter((entry) => entry.status !== "unsupported")
    .map((entry) => entry.schemaPath),
);

function unknownKeys(
  value: Json,
  keys: Set<string>,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  for (const key of Object.keys(value))
    if (!keys.has(key))
      diagnostics.push({
        code: "UNKNOWN_PROPERTY",
        severity: "error",
        path: `${path}/${pointer(key)}`,
        componentId,
        message: `Map property “${key}” is not supported at ${path}.`,
        received: key,
        suggestions: closestMatches(key, keys),
      });
}

function limitation(
  schemaPath: string,
  actualPath: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  const capability = mapCapability(schemaPath);
  if (
    !capability ||
    !["partial", "experimental", "deprecated"].includes(capability.status)
  )
    return;
  diagnostics.push({
    code: "MAP_CAPABILITY_LIMITATION",
    severity: "warning",
    path: actualPath,
    componentId,
    message: `${schemaPath} is ${capability.status}: ${capability.limitation ?? "See the map capability registry."}`,
    received: capability.status,
  });
}

function validateObject(
  value: unknown,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): value is Json {
  if (object(value)) return true;
  diagnostics.push({
    code: "INVALID_PROPERTY_TYPE",
    severity: "error",
    path,
    componentId,
    message: `${path} must be an object.`,
    received: value,
  });
  return false;
}
function validateEnum(
  value: unknown,
  values: readonly string[],
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  if (
    value === undefined ||
    (typeof value === "string" && values.includes(value))
  )
    return;
  diagnostics.push({
    code: "INVALID_ENUM_VALUE",
    severity: "error",
    path,
    componentId,
    message: `${path} must be one of: ${values.join(", ")}.`,
    received: value,
    suggestions:
      typeof value === "string" ? closestMatches(value, values) : undefined,
  });
}

function validateBoolean(
  value: unknown,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined || typeof value === "boolean") return;
  diagnostics.push({
    code: "INVALID_PROPERTY_TYPE",
    severity: "error",
    path,
    componentId,
    message: `${path} must be a boolean.`,
    received: value,
  });
}

function validateString(
  value: unknown,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
  required = false,
): void {
  if (value === undefined && !required) return;
  if (typeof value === "string" && value.length > 0) return;
  diagnostics.push({
    code: required ? "MISSING_REQUIRED_PROPERTY" : "INVALID_PROPERTY_TYPE",
    severity: "error",
    path,
    componentId,
    message: `${path} must be a non-empty string.`,
    received: value,
  });
}

function validateNumber(
  value: unknown,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
  options: { minimum?: number; maximum?: number; integer?: boolean } = {},
): void {
  if (value === undefined) return;
  const valid =
    typeof value === "number" &&
    Number.isFinite(value) &&
    (!options.integer || Number.isInteger(value)) &&
    (options.minimum === undefined || value >= options.minimum) &&
    (options.maximum === undefined || value <= options.maximum);
  if (valid) return;
  const range =
    options.minimum !== undefined || options.maximum !== undefined
      ? ` from ${options.minimum ?? "-∞"} through ${options.maximum ?? "∞"}`
      : "";
  diagnostics.push({
    code: "INVALID_PROPERTY_TYPE",
    severity: "error",
    path,
    componentId,
    message: `${path} must be a ${options.integer ? "finite integer" : "finite number"}${range}.`,
    received: value,
  });
}

function validateFinitePair(
  value: unknown,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) return;
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  )
    return;
  diagnostics.push({
    code: "INVALID_PROPERTY_TYPE",
    severity: "error",
    path,
    componentId,
    message: `${path} must contain exactly two finite numbers.`,
    received: value,
  });
}

const sourceKeys: Record<string, Set<string>> = {
  powerbi: allowed("type", "bindings", "layerValue"),
  arcgisFeature: allowed(
    "type",
    "url",
    "layerId",
    "useServiceRenderer",
    "useServiceLabels",
    "definitionExpression",
    "outFields",
    "mode",
    "refreshIntervalMinutes",
  ),
  arcgisTile: allowed("type", "url", "attribution", "minZoom", "maxZoom"),
  arcgisDynamic: allowed(
    "type",
    "url",
    "layerIds",
    "layerDefinitions",
    "format",
    "transparent",
    "minZoom",
    "maxZoom",
    "attribution",
    "debounceMs",
    "identify",
  ),
  geoJson: allowed("type", "data", "url", "idField", "refreshIntervalMinutes"),
  xyz: allowed("type", "url", "attribution", "minZoom", "maxZoom", "subdomains"),
};
const rendererKeys: Record<string, Set<string>> = {
  service: allowed("type"),
  simple: allowed("type", "symbol"),
  icon: allowed("type", "symbol"),
  line: allowed("type", "symbol"),
  polygon: allowed("type", "symbol"),
  uniqueValue: allowed(
    "type",
    "field",
    "fieldSource",
    "values",
    "defaultSymbol",
    "defaultLabel",
  ),
  classBreaks: allowed(
    "type",
    "field",
    "fieldSource",
    "method",
    "classes",
    "breaks",
    "colorRamp",
  ),
  continuousColor: allowed(
    "type",
    "field",
    "fieldSource",
    "minColor",
    "maxColor",
    "clamp",
  ),
  proportionalSize: allowed(
    "type",
    "field",
    "fieldSource",
    "minSize",
    "maxSize",
    "color",
  ),
  heatmap: allowed(
    "type",
    "weightField",
    "fieldSource",
    "radius",
    "blur",
    "minOpacity",
    "maxIntensity",
    "gradient",
    "minZoom",
    "maxZoom",
    "normalization",
    "interactivePoints",
  ),
  cluster: allowed(
    "type",
    "radius",
    "disableAtZoom",
    "showCoverageOnHover",
    "clusterLabel",
    "aggregateField",
    "fieldSource",
    "format",
  ),
  densityGrid: allowed(
    "type",
    "statistic",
    "field",
    "fieldSource",
    "cellSizePixels",
    "classes",
    "colorRamp",
  ),
};
const symbolKeys = allowed(
  "shape",
  "color",
  "fillColor",
  "size",
  "radius",
  "width",
  "weight",
  "opacity",
  "fillOpacity",
  "outlineColor",
  "outlineWidth",
  "dashArray",
  "dashStyle",
  "lineCap",
  "lineJoin",
  "fillPattern",
  "icon",
  "iconField",
  "iconFieldSource",
  "iconMap",
  "rotation",
  "rotationField",
  "rotationFieldSource",
  "sizeField",
  "sizeFieldSource",
  "colorField",
  "colorFieldSource",
  "colorMap",
  "markerText",
  "markerTextField",
  "markerTextFieldSource",
  "badge",
  "badgeField",
  "badgeFieldSource",
  "showValue",
  "anchor",
  "offset",
  "selectedStyle",
  "hoverStyle",
  "externalHighlightStyle",
  "dimmedOpacity",
);

export function validateMapComponentSchema(
  component: Json,
  path: string,
  componentId?: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const nested: Array<[string, Set<string>]> = [
    [
      "view",
      allowed(
        "center",
        "zoom",
        "minZoom",
        "maxZoom",
        "fitMode",
        "fitPadding",
        "preserveView",
      ),
    ],
    ["basemap", allowed("type", "url", "attribution", "maxZoom", "visible")],
    [
      "search",
      allowed(
        "enabled",
        "placeholder",
        "zoom",
        "showResultMarker",
        "clearMarkerOnClose",
        "autoSelectFirst",
      ),
    ],
    ["legend", allowed("defaultOpen", "enabled", "maxHeight", "search")],
    [
      "featureDetails",
      allowed(
        "mode",
        "clearSelectionOnBackgroundClick",
        "clearSelectionOnClose",
      ),
    ],
    [
      "layerPanel",
      allowed(
        "visible",
        "position",
        "defaultOpen",
        "allowViewerReorder",
        "allowViewerOpacity",
        "allowViewerLabels",
      ),
    ],
    [
      "toolbar",
      allowed(
        "visible",
        "home",
        "layers",
        "legend",
        "search",
        "clearSelection",
        "zoomToSelection",
        "bookmarks",
        "rectangleSelection",
        "lassoSelection",
        "circleSelection",
        "selection",
        "quickFilters",
        "zoomIn",
        "zoomOut",
        "selectedCount",
        "position",
      ),
    ],
    ["tools", allowed("rectangleSelection", "lassoSelection", "circleSelection", "selection", "scaleBar", "coordinateDisplay")],
  ];
  for (const [property, keys] of nested)
    if (
      component[property] !== undefined &&
      validateObject(
        component[property],
        `${path}/${property}`,
        componentId,
        diagnostics,
      )
    )
      unknownKeys(
        component[property] as Json,
        keys,
        `${path}/${property}`,
        componentId,
        diagnostics,
      );
  if (
    object(component.view) &&
    component.view.fitPadding !== undefined &&
    (typeof component.view.fitPadding !== "number" ||
      !Number.isFinite(component.view.fitPadding) ||
      component.view.fitPadding < 0 ||
      component.view.fitPadding > 0.5)
  )
    diagnostics.push({
      code: "MAP_FIT_PADDING_OUT_OF_RANGE",
      severity: "error",
      path: `${path}/view/fitPadding`,
      componentId,
      message:
        "view.fitPadding is a ratio and must be a finite number from 0 through 0.5.",
      received: component.view.fitPadding,
    });
  if (object(component.basemap))
    validateEnum(
      component.basemap.type,
      ["none", "osm", "customTile", "arcgisTile"],
      `${path}/basemap/type`,
      componentId,
      diagnostics,
    );
  validateEnum(
    component.heightMode,
    ["fixed", "fill", "aspectRatio"],
    `${path}/heightMode`,
    componentId,
    diagnostics,
  );
  if (object(component.featureDetails))
    validateEnum(
      component.featureDetails.mode,
      ["auto", "anchored", "panel"],
      `${path}/featureDetails/mode`,
      componentId,
      diagnostics,
    );
  if (object(component.legend)) {
    validateBoolean(component.legend.defaultOpen, `${path}/legend/defaultOpen`, componentId, diagnostics);
    validateBoolean(component.legend.enabled, `${path}/legend/enabled`, componentId, diagnostics);
    validateBoolean(component.legend.search, `${path}/legend/search`, componentId, diagnostics);
    validateNumber(component.legend.maxHeight, `${path}/legend/maxHeight`, componentId, diagnostics, {
      minimum: 80,
      maximum: 1_200,
      integer: true,
    });
  }
  if (object(component.toolbar))
    validateEnum(component.toolbar.position, ["topleft", "topright", "bottomleft", "bottomright"], `${path}/toolbar/position`, componentId, diagnostics);
  if (object(component.toolbar))
    for (const property of [
      "visible", "home", "layers", "legend", "search", "clearSelection",
      "zoomToSelection", "bookmarks", "rectangleSelection", "lassoSelection",
      "circleSelection", "selection", "quickFilters", "zoomIn", "zoomOut",
      "selectedCount",
    ])
      validateBoolean(component.toolbar[property], `${path}/toolbar/${property}`, componentId, diagnostics);
  if (object(component.tools)) {
    for (const property of ["rectangleSelection", "lassoSelection", "circleSelection"]) {
      const value = component.tools[property];
      const toolPath = `${path}/tools/${property}`;
      if (value === undefined || typeof value === "boolean") continue;
      if (!validateObject(value, toolPath, componentId, diagnostics)) continue;
      unknownKeys(
        value,
        property === "lassoSelection"
          ? allowed("enabled", "selectionMode", "minimumPoints")
          : property === "circleSelection"
            ? allowed("enabled", "selectionMode", "radiusMeters")
            : allowed("enabled", "selectionMode"),
        toolPath,
        componentId,
        diagnostics,
      );
      if (value.enabled !== undefined && typeof value.enabled !== "boolean")
        diagnostics.push({
          code: "INVALID_PROPERTY_TYPE",
          severity: "error",
          path: `${toolPath}/enabled`,
          componentId,
          message: "Spatial selection enabled must be a boolean.",
          received: value.enabled,
        });
      validateEnum(
        value.selectionMode,
        ["replace", "toggle", "add", "remove"],
        `${toolPath}/selectionMode`,
        componentId,
        diagnostics,
      );
      if (
        property === "lassoSelection" &&
        value.minimumPoints !== undefined &&
        (!Number.isInteger(value.minimumPoints) || Number(value.minimumPoints) < 3 || Number(value.minimumPoints) > 100)
      )
        diagnostics.push({
          code: "INVALID_PROPERTY_TYPE",
          severity: "error",
          path: `${toolPath}/minimumPoints`,
          componentId,
          message: "Lasso minimumPoints must be an integer from 3 through 100.",
          received: value.minimumPoints,
        });
      if (property === "circleSelection")
        validateNumber(value.radiusMeters, `${toolPath}/radiusMeters`, componentId, diagnostics, {
          minimum: 1,
          maximum: 20_000_000,
        });
    }
    if (object(component.tools.selection)) {
      unknownKeys(component.tools.selection, allowed("maxSelectionCount", "powerBiIdentityLimit", "identityLimitBehavior"), `${path}/tools/selection`, componentId, diagnostics);
      validateEnum(component.tools.selection.identityLimitBehavior, ["localOnly", "truncate"], `${path}/tools/selection/identityLimitBehavior`, componentId, diagnostics);
      validateNumber(component.tools.selection.maxSelectionCount, `${path}/tools/selection/maxSelectionCount`, componentId, diagnostics, {
        minimum: 1,
        maximum: 100_000,
        integer: true,
      });
      validateNumber(component.tools.selection.powerBiIdentityLimit, `${path}/tools/selection/powerBiIdentityLimit`, componentId, diagnostics, {
        minimum: 1,
        maximum: 100_000,
        integer: true,
      });
    }
    for (const property of ["scaleBar", "coordinateDisplay"]) {
      const value = component.tools[property];
      if (value === undefined || typeof value === "boolean") continue;
      if (!validateObject(value, `${path}/tools/${property}`, componentId, diagnostics)) continue;
      unknownKeys(value, property === "scaleBar"
        ? allowed("enabled", "metric", "imperial", "position")
        : allowed("enabled", "precision"), `${path}/tools/${property}`, componentId, diagnostics);
      validateBoolean(value.enabled, `${path}/tools/${property}/enabled`, componentId, diagnostics);
      if (property === "scaleBar") {
        validateBoolean(value.metric, `${path}/tools/scaleBar/metric`, componentId, diagnostics);
        validateBoolean(value.imperial, `${path}/tools/scaleBar/imperial`, componentId, diagnostics);
        validateEnum(value.position, ["bottomleft", "bottomright"], `${path}/tools/scaleBar/position`, componentId, diagnostics);
      } else
        validateNumber(value.precision, `${path}/tools/coordinateDisplay/precision`, componentId, diagnostics, {
          minimum: 0,
          maximum: 8,
          integer: true,
        });
    }
  }
  if (component.quickFilters !== undefined && !Array.isArray(component.quickFilters))
    diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${path}/quickFilters`, componentId, message: "quickFilters must be an array.", received: component.quickFilters });
  if (Array.isArray(component.quickFilters)) {
    const quickFilterIds = new Set<string>();
    component.quickFilters.forEach((filter, index) => {
      const filterPath = `${path}/quickFilters/${index}`;
      if (!validateObject(filter, filterPath, componentId, diagnostics)) return;
      unknownKeys(filter, allowed("id", "label", "type", "field", "fieldSource", "layerId", "multiSelect", "includeNull", "defaultValue", "operator", "count", "valueField", "valueFieldSource"), filterPath, componentId, diagnostics);
      validateString(filter.id, `${filterPath}/id`, componentId, diagnostics, true);
      validateString(filter.field, `${filterPath}/field`, componentId, diagnostics, true);
      validateString(filter.label, `${filterPath}/label`, componentId, diagnostics);
      validateString(filter.layerId, `${filterPath}/layerId`, componentId, diagnostics);
      validateString(filter.valueField, `${filterPath}/valueField`, componentId, diagnostics);
      validateEnum(filter.type, ["categorical", "numericRange", "dateRange", "text", "null", "topN"], `${filterPath}/type`, componentId, diagnostics);
      validateEnum(filter.fieldSource, ["powerbi", "service", "joined"], `${filterPath}/fieldSource`, componentId, diagnostics);
      validateEnum(filter.valueFieldSource, ["powerbi", "service", "joined"], `${filterPath}/valueFieldSource`, componentId, diagnostics);
      validateEnum(filter.operator, ["contains", "startsWith", "equals"], `${filterPath}/operator`, componentId, diagnostics);
      validateBoolean(filter.multiSelect, `${filterPath}/multiSelect`, componentId, diagnostics);
      validateBoolean(filter.includeNull, `${filterPath}/includeNull`, componentId, diagnostics);
      validateNumber(filter.count, `${filterPath}/count`, componentId, diagnostics, {
        minimum: 1,
        maximum: 100_000,
        integer: true,
      });
      if (typeof filter.id === "string" && filter.id) {
        if (quickFilterIds.has(filter.id))
          diagnostics.push({
            code: "DUPLICATE_COMPONENT_ID",
            severity: "error",
            path: `${filterPath}/id`,
            componentId,
            message: `Map quick-filter ID “${filter.id}” is duplicated.`,
            received: filter.id,
          });
        quickFilterIds.add(filter.id);
      }
    });
  }
  for (const property of ["height", "minHeight", "aspectRatio"])
    if (
      component[property] !== undefined &&
      (typeof component[property] !== "number" ||
        !Number.isFinite(component[property]) ||
        Number(component[property]) <= 0)
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/${property}`,
        componentId,
        message: `${property} must be a positive finite number.`,
        received: component[property],
      });
  if (object(component.view))
    for (const key of ["fitMode", "preserveView"])
      if (component.view[key] !== undefined)
        limitation(
          `map.view.${key}`,
          `${path}/view/${key}`,
          componentId,
          diagnostics,
        );

  const ids = new Map<string, string>();
  if (
    component.layerGroups !== undefined &&
    !Array.isArray(component.layerGroups)
  )
    diagnostics.push({
      code: "INVALID_PROPERTY_TYPE",
      severity: "error",
      path: `${path}/layerGroups`,
      componentId,
      message: "layerGroups must be an array.",
    });
  if (Array.isArray(component.layerGroups))
    component.layerGroups.forEach((raw, index) => {
      const groupPath = `${path}/layerGroups/${index}`;
      if (!validateObject(raw, groupPath, componentId, diagnostics)) return;
      unknownKeys(
        raw,
        allowed("id", "name", "visible", "collapsed", "opacity", "order"),
        groupPath,
        componentId,
        diagnostics,
      );
      registerId(
        raw.id,
        `${groupPath}/id`,
        "group",
        ids,
        componentId,
        diagnostics,
      );
      if (typeof raw.name !== "string" || !raw.name)
        diagnostics.push({
          code: "MISSING_REQUIRED_PROPERTY",
          severity: "error",
          path: `${groupPath}/name`,
          componentId,
          message: "Map layer groups require a name.",
        });
    });
  if (component.bookmarks !== undefined && !Array.isArray(component.bookmarks))
    diagnostics.push({
      code: "INVALID_PROPERTY_TYPE",
      severity: "error",
      path: `${path}/bookmarks`,
      componentId,
      message: "bookmarks must be an array.",
    });
  if (Array.isArray(component.bookmarks))
    component.bookmarks.forEach((raw, index) => {
      const bookmarkPath = `${path}/bookmarks/${index}`;
      if (!validateObject(raw, bookmarkPath, componentId, diagnostics)) return;
      unknownKeys(
        raw,
        allowed("id", "label", "center", "zoom"),
        bookmarkPath,
        componentId,
        diagnostics,
      );
      registerId(
        raw.id,
        `${bookmarkPath}/id`,
        "bookmark",
        ids,
        componentId,
        diagnostics,
      );
      if (
        !Array.isArray(raw.center) ||
        raw.center.length !== 2 ||
        raw.center.some(
          (value) => typeof value !== "number" || !Number.isFinite(value),
        )
      )
        diagnostics.push({
          code: "INVALID_PROPERTY_TYPE",
          severity: "error",
          path: `${bookmarkPath}/center`,
          componentId,
          message: "Bookmark center must be [latitude, longitude].",
        });
    });

  if (component.layers !== undefined && !Array.isArray(component.layers))
    diagnostics.push({
      code: "INVALID_PROPERTY_TYPE",
      severity: "error",
      path: `${path}/layers`,
      componentId,
      message: "layers must be an array.",
    });
  if (Array.isArray(component.layers))
    component.layers.forEach((raw, index) =>
      validateLayer(
        raw,
        `${path}/layers/${index}`,
        componentId,
        ids,
        diagnostics,
      ),
    );
  return diagnostics;
}

function validateLayer(
  raw: unknown,
  path: string,
  componentId: string | undefined,
  ids: Map<string, string>,
  diagnostics: Diagnostic[],
): void {
  if (!validateObject(raw, path, componentId, diagnostics)) return;
  unknownKeys(
    raw,
    allowed(
      "id",
      "name",
      "dataset",
      "groupId",
      "visible",
      "opacity",
      "order",
      "source",
      "join",
      "renderer",
      "labels",
      "popup",
      "tooltip",
      "visibility",
      "performance",
      "filter",
      "interaction",
      "legend",
    ),
    path,
    componentId,
    diagnostics,
  );
  registerId(raw.id, `${path}/id`, "layer", ids, componentId, diagnostics);
  if (typeof raw.name !== "string" || !raw.name)
    diagnostics.push({
      code: "MISSING_REQUIRED_PROPERTY",
      severity: "error",
      path: `${path}/name`,
      componentId,
      message: "Map layers require a name.",
    });
  if (!validateObject(raw.source, `${path}/source`, componentId, diagnostics))
    return;
  const sourceType = String(raw.source.type ?? "");
  const keys = sourceKeys[sourceType];
  if (!keys)
    diagnostics.push({
      code: "INVALID_ENUM_VALUE",
      severity: "error",
      path: `${path}/source/type`,
      componentId,
      message: `Unsupported map source type “${sourceType}”.`,
      received: sourceType,
      suggestions: closestMatches(sourceType, Object.keys(sourceKeys)),
    });
  else
    unknownKeys(raw.source, keys, `${path}/source`, componentId, diagnostics);
  if (keys) {
    const capabilities = resolveMapLayerCapabilities(
      sourceType as MapLayerSourceType,
    );
    const unsupported: Array<[string, boolean, string]> = [
      ["join", capabilities.join, "joins"],
      ["popup", capabilities.popup, "feature details"],
      ["tooltip", capabilities.tooltip, "feature tooltips"],
      [
        "labels",
        sourceType === "powerbi" || sourceType === "geoJson" || capabilities.serviceLabels,
        "feature labels",
      ],
      ["interaction", capabilities.selection, "persistent feature selection"],
      [
        "renderer",
        sourceType === "powerbi" || sourceType === "arcgisFeature" || sourceType === "geoJson",
        "client feature renderers",
      ],
    ];
    for (const [property, supported, label] of unsupported) {
      if (supported || raw[property] === undefined) continue;
      diagnostics.push({
        code: "MAP_CAPABILITY_LIMITATION",
        severity: "error",
        path: `${path}/${property}`,
        componentId,
        message: `${sourceType} layers do not support ${label}; this setting cannot execute and must be removed or the source type changed.`,
        received: sourceType,
      });
    }
  }
  if (
    sourceType === "powerbi" &&
    raw.source.bindings !== undefined &&
    validateObject(
      raw.source.bindings,
      `${path}/source/bindings`,
      componentId,
      diagnostics,
    )
  )
    unknownKeys(
      raw.source.bindings,
      allowed(
        "layer",
        "type",
        "latitude",
        "longitude",
        "x",
        "y",
        "address",
        "city",
        "state",
        "zip",
        "geometry",
        "color",
        "size",
        "tooltip",
        "details",
      ),
      `${path}/source/bindings`,
      componentId,
      diagnostics,
    );
  if (sourceType === "geoJson") {
    validateString(raw.source.idField, `${path}/source/idField`, componentId, diagnostics);
    validateNumber(raw.source.refreshIntervalMinutes, `${path}/source/refreshIntervalMinutes`, componentId, diagnostics, {
      minimum: 0.1,
      maximum: 10_080,
    });
    if (
      raw.source.url !== undefined &&
      (typeof raw.source.url !== "string" || !/^https:\/\//i.test(raw.source.url))
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/source/url`,
        componentId,
        message: "Remote GeoJSON requires an HTTPS URL.",
        received: raw.source.url,
      });
    if (raw.source.data !== undefined) {
      const type = object(raw.source.data) ? raw.source.data.type : undefined;
      if (
        typeof type !== "string" ||
        !["Feature", "FeatureCollection", "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"].includes(type)
      )
        diagnostics.push({
          code: "INVALID_PROPERTY_TYPE",
          severity: "error",
          path: `${path}/source/data`,
          componentId,
          message: "Inline GeoJSON must be a supported GeoJSON object.",
          received: raw.source.data,
        });
    }
  }
  if (sourceType === "xyz") {
    const xyzUrl = raw.source.url;
    validateString(raw.source.attribution, `${path}/source/attribution`, componentId, diagnostics);
    validateNumber(raw.source.minZoom, `${path}/source/minZoom`, componentId, diagnostics, {
      minimum: 0,
      maximum: 24,
      integer: true,
    });
    validateNumber(raw.source.maxZoom, `${path}/source/maxZoom`, componentId, diagnostics, {
      minimum: 0,
      maximum: 24,
      integer: true,
    });
    if (
      typeof xyzUrl !== "string" ||
      !/^https:\/\//i.test(xyzUrl) ||
      !["{z}", "{x}", "{y}"].every((token) => xyzUrl.includes(token))
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/source/url`,
        componentId,
        message: "XYZ layers require an HTTPS URL containing {z}, {x}, and {y}.",
        received: xyzUrl,
      });
    if (
      raw.source.subdomains !== undefined &&
      !(
        typeof raw.source.subdomains === "string" ||
        Array.isArray(raw.source.subdomains) &&
          raw.source.subdomains.every((item) => typeof item === "string" && item.length > 0)
      )
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/source/subdomains`,
        componentId,
        message: "XYZ subdomains must be a string or an array of non-empty strings.",
        received: raw.source.subdomains,
      });
  }
  if (
    sourceType === "arcgisDynamic" &&
    raw.source.identify !== undefined &&
    validateObject(
      raw.source.identify,
      `${path}/source/identify`,
      componentId,
      diagnostics,
    )
  ) {
    unknownKeys(
      raw.source.identify,
      allowed("enabled", "tolerance", "layerOption", "maxResults"),
      `${path}/source/identify`,
      componentId,
      diagnostics,
    );
    validateEnum(
      raw.source.identify.layerOption,
      ["visible", "all", "top"],
      `${path}/source/identify/layerOption`,
      componentId,
      diagnostics,
    );
    if (
      raw.source.identify.enabled !== undefined &&
      typeof raw.source.identify.enabled !== "boolean"
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/source/identify/enabled`,
        componentId,
        message: "Dynamic identify enabled must be a boolean.",
        received: raw.source.identify.enabled,
      });
    for (const [key, minimum, maximum] of [
      ["tolerance", 0, 50],
      ["maxResults", 1, 25],
    ] as const) {
      const value = raw.source.identify[key];
      if (
        value === undefined ||
        (typeof value === "number" &&
          Number.isInteger(value) &&
          value >= minimum &&
          value <= maximum)
      )
        continue;
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/source/identify/${key}`,
        componentId,
        message: `Dynamic identify ${key} must be an integer from ${minimum} to ${maximum}.`,
        received: value,
      });
    }
  }
  if (
    sourceType.startsWith("arcgis") &&
    (typeof raw.source.url !== "string" || !raw.source.url)
  )
    diagnostics.push({
      code: "MAP_LAYER_BINDING_INCOMPLETE",
      severity: "warning",
      path: `${path}/source/url`,
      componentId,
      message: `${sourceType} needs a public HTTPS service URL before it can load.`,
    });
  if (sourceType === "xyz" && (typeof raw.source.url !== "string" || !raw.source.url))
    diagnostics.push({ code: "MAP_LAYER_BINDING_INCOMPLETE", severity: "error", path: `${path}/source/url`, componentId, message: "XYZ layers require a tile URL template." });
  if (sourceType === "geoJson" && raw.source.data === undefined && (typeof raw.source.url !== "string" || !raw.source.url))
    diagnostics.push({ code: "MAP_LAYER_BINDING_INCOMPLETE", severity: "error", path: `${path}/source`, componentId, message: "GeoJSON layers require inline data or an approved HTTPS URL." });
  if (
    raw.join !== undefined &&
    validateObject(raw.join, `${path}/join`, componentId, diagnostics)
  ) {
    unknownKeys(
      raw.join,
      allowed(
        "enabled",
        "powerBiField",
        "serviceField",
        "cardinality",
        "keyType",
        "normalization",
        "powerBiDuplicatePolicy",
        "serviceDuplicatePolicy",
        "unmatchedPolicy",
        "aggregations",
        "queryStrategy",
      ),
      `${path}/join`,
      componentId,
      diagnostics,
    );
    if (raw.join.keyType !== undefined)
      limitation(
        "map.layers[].join.keyType",
        `${path}/join/keyType`,
        componentId,
        diagnostics,
      );
    if (
      raw.join.normalization !== undefined &&
      !Array.isArray(raw.join.normalization)
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/join/normalization`,
        componentId,
        message: "join.normalization must be an array.",
      });
    if (
      raw.join.aggregations !== undefined &&
      !Array.isArray(raw.join.aggregations)
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/join/aggregations`,
        componentId,
        message: "join.aggregations must be an array.",
      });
    if (Array.isArray(raw.join.aggregations))
      raw.join.aggregations.forEach((aggregation, index) => {
        const aggregationPath = `${path}/join/aggregations/${index}`;
        if (
          validateObject(aggregation, aggregationPath, componentId, diagnostics)
        )
          unknownKeys(
            aggregation,
            allowed("field", "aggregation", "as"),
            aggregationPath,
            componentId,
            diagnostics,
          );
      });
  }
  if (
    raw.renderer !== undefined &&
    validateObject(raw.renderer, `${path}/renderer`, componentId, diagnostics)
  ) {
    const type = String(raw.renderer.type ?? "");
    const keysForRenderer = rendererKeys[type];
    if (!keysForRenderer)
      diagnostics.push({
        code: "INVALID_ENUM_VALUE",
        severity: "error",
        path: `${path}/renderer/type`,
        componentId,
        message: `Unsupported map renderer “${type}”.`,
        received: type,
        suggestions: closestMatches(type, Object.keys(rendererKeys)),
      });
    else
      unknownKeys(
        raw.renderer,
        keysForRenderer,
        `${path}/renderer`,
        componentId,
        diagnostics,
      );
    if (type === "classBreaks" && raw.renderer.method === "naturalBreaks")
      diagnostics.push({
        code: "INVALID_ENUM_VALUE",
        severity: "error",
        path: `${path}/renderer/method`,
        componentId,
        message:
          "naturalBreaks is not implemented. Use manual, equalInterval, or quantile.",
        received: raw.renderer.method,
      });
    if (type === "densityGrid")
      limitation(
        `map.layers[].renderer.${type}.type`,
        `${path}/renderer/type`,
        componentId,
        diagnostics,
      );
    validateEnum(
      raw.renderer.fieldSource,
      ["powerbi", "service", "joined"],
      `${path}/renderer/fieldSource`,
      componentId,
      diagnostics,
    );
    if (type === "heatmap") {
      validateEnum(raw.renderer.normalization, ["global", "viewport"], `${path}/renderer/normalization`, componentId, diagnostics);
      validateString(raw.renderer.weightField, `${path}/renderer/weightField`, componentId, diagnostics);
      validateBoolean(raw.renderer.interactivePoints, `${path}/renderer/interactivePoints`, componentId, diagnostics);
      validateNumber(raw.renderer.radius, `${path}/renderer/radius`, componentId, diagnostics, {
        minimum: 4,
        maximum: 120,
      });
      validateNumber(raw.renderer.blur, `${path}/renderer/blur`, componentId, diagnostics, {
        minimum: 0,
        maximum: 80,
      });
      validateNumber(raw.renderer.minOpacity, `${path}/renderer/minOpacity`, componentId, diagnostics, {
        minimum: 0,
        maximum: 1,
      });
      validateNumber(raw.renderer.maxIntensity, `${path}/renderer/maxIntensity`, componentId, diagnostics, {
        minimum: 0.000001,
      });
      validateNumber(raw.renderer.minZoom, `${path}/renderer/minZoom`, componentId, diagnostics, {
        minimum: 0,
        maximum: 24,
        integer: true,
      });
      validateNumber(raw.renderer.maxZoom, `${path}/renderer/maxZoom`, componentId, diagnostics, {
        minimum: 0,
        maximum: 24,
        integer: true,
      });
      if (
        typeof raw.renderer.minZoom === "number" &&
        typeof raw.renderer.maxZoom === "number" &&
        raw.renderer.minZoom > raw.renderer.maxZoom
      )
        diagnostics.push({
          code: "INVALID_PROPERTY_TYPE",
          severity: "error",
          path: `${path}/renderer/maxZoom`,
          componentId,
          message: "Heatmap maxZoom must be greater than or equal to minZoom.",
          received: raw.renderer.maxZoom,
        });
      if (raw.renderer.gradient !== undefined) {
        if (!validateObject(raw.renderer.gradient, `${path}/renderer/gradient`, componentId, diagnostics)) {
          // validateObject emits the canonical diagnostic.
        } else
          for (const [rawStop, color] of Object.entries(raw.renderer.gradient)) {
            const stop = Number(rawStop);
            if (!Number.isFinite(stop) || stop < 0 || stop > 1 || typeof color !== "string" || !color)
              diagnostics.push({
                code: "INVALID_PROPERTY_TYPE",
                severity: "error",
                path: `${path}/renderer/gradient/${pointer(rawStop)}`,
                componentId,
                message: "Heatmap gradient stops must be from 0 through 1 and map to non-empty color strings.",
                received: color,
              });
          }
      }
    }
    if (["icon", "line", "polygon"].includes(type) && !object(raw.renderer.symbol))
      diagnostics.push({
        code: "MISSING_REQUIRED_PROPERTY",
        severity: "error",
        path: `${path}/renderer/symbol`,
        componentId,
        message: `${type} renderers require a symbol object.`,
        received: raw.renderer.symbol,
      });
    if (type === "cluster") {
      validateEnum(
        raw.renderer.clusterLabel,
        ["count", "sum"],
        `${path}/renderer/clusterLabel`,
        componentId,
        diagnostics,
      );
      if (
        raw.renderer.clusterLabel === "sum" &&
        (typeof raw.renderer.aggregateField !== "string" ||
          !raw.renderer.aggregateField)
      )
        diagnostics.push({
          code: "MISSING_REQUIRED_PROPERTY",
          severity: "error",
          path: `${path}/renderer/aggregateField`,
          componentId,
          message: "Cluster sum labels require aggregateField.",
        });
    }
    for (const property of ["symbol", "defaultSymbol"])
      if (
        raw.renderer[property] !== undefined &&
        validateObject(
          raw.renderer[property],
          `${path}/renderer/${property}`,
          componentId,
          diagnostics,
        )
      ) {
        unknownKeys(
          raw.renderer[property],
          symbolKeys,
          `${path}/renderer/${property}`,
          componentId,
          diagnostics,
        );
        validateEnum(
          (raw.renderer[property] as Json).shape,
          ["circle", "square", "diamond", "triangle", "icon", "line", "fill"],
          `${path}/renderer/${property}/shape`,
          componentId,
          diagnostics,
        );
        validateSymbolDetails(raw.renderer[property] as Json, `${path}/renderer/${property}`, componentId, diagnostics);
      }
    if (
      raw.renderer.values !== undefined &&
      !Array.isArray(raw.renderer.values)
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/renderer/values`,
        componentId,
        message: "uniqueValue.values must be an array.",
      });
    if (Array.isArray(raw.renderer.values))
      raw.renderer.values.forEach((value, index) => {
        const valuePath = `${path}/renderer/values/${index}`;
        if (!validateObject(value, valuePath, componentId, diagnostics)) return;
        unknownKeys(
          value,
          allowed("value", "label", "symbol"),
          valuePath,
          componentId,
          diagnostics,
        );
        if (
          value.symbol !== undefined &&
          validateObject(
            value.symbol,
            `${valuePath}/symbol`,
            componentId,
            diagnostics,
          )
        )
          unknownKeys(
            value.symbol,
            symbolKeys,
            `${valuePath}/symbol`,
            componentId,
            diagnostics,
          );
        if (object(value.symbol)) validateSymbolDetails(value.symbol, `${valuePath}/symbol`, componentId, diagnostics);
      });
    if (
      raw.renderer.breaks !== undefined &&
      !Array.isArray(raw.renderer.breaks)
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/renderer/breaks`,
        componentId,
        message: "classBreaks.breaks must be an array.",
      });
    if (Array.isArray(raw.renderer.breaks))
      raw.renderer.breaks.forEach((value, index) => {
        const breakPath = `${path}/renderer/breaks/${index}`;
        if (!validateObject(value, breakPath, componentId, diagnostics)) return;
        unknownKeys(
          value,
          allowed("min", "max", "label", "symbol"),
          breakPath,
          componentId,
          diagnostics,
        );
        if (
          value.symbol !== undefined &&
          validateObject(
            value.symbol,
            `${breakPath}/symbol`,
            componentId,
            diagnostics,
          )
        )
          unknownKeys(
            value.symbol,
            symbolKeys,
            `${breakPath}/symbol`,
            componentId,
            diagnostics,
          );
        if (object(value.symbol)) validateSymbolDetails(value.symbol, `${breakPath}/symbol`, componentId, diagnostics);
        const minimum = Number(value.min);
        const maximum = Number(value.max);
        if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum)
          diagnostics.push({
            code: "MAP_CLASS_BREAK_INVALID_RANGE",
            severity: "error",
            path: breakPath,
            componentId,
            message: "Class-break min and max must be finite numbers with min less than or equal to max.",
          });
        const rendererBreaks = (raw.renderer as Json).breaks;
        const previous = index > 0 && Array.isArray(rendererBreaks) && object(rendererBreaks[index - 1])
          ? rendererBreaks[index - 1] as Json
          : undefined;
        if (previous && Number.isFinite(Number(previous.max)) && minimum < Number(previous.max))
          diagnostics.push({
            code: "MAP_CLASS_BREAK_OVERLAP",
            severity: "error",
            path: breakPath,
            componentId,
            message: "Manual class-break ranges must be sorted and must not overlap.",
          });
      });
  }
  validateSection(
    raw,
    "labels",
    allowed(
      "enabled",
      "field",
      "fieldSource",
      "template",
      "placement",
      "minZoom",
      "maxZoom",
      "color",
      "size",
      "weight",
      "haloColor",
      "haloSize",
      "backgroundColor",
      "padding",
      "collision",
      "maxLabels",
    ),
    path,
    componentId,
    diagnostics,
  );
  if (object(raw.labels))
    validateEnum(
      raw.labels.fieldSource,
      ["powerbi", "service", "joined"],
      `${path}/labels/fieldSource`,
      componentId,
      diagnostics,
    );
  if (object(raw.labels) && raw.labels.collision === "hideOverlaps")
    limitation(
      "map.layers[].labels.collision",
      `${path}/labels/collision`,
      componentId,
      diagnostics,
    );
  validateSection(
    raw,
    "popup",
    allowed("enabled", "defaultFieldSource", "title", "fields", "actions", "html"),
    path,
    componentId,
    diagnostics,
  );
  validateSection(
    raw,
    "tooltip",
    allowed("enabled", "defaultFieldSource", "fields", "template"),
    path,
    componentId,
    diagnostics,
  );
  for (const section of ["popup", "tooltip"]) {
    const value = raw[section];
    if (!object(value)) continue;
    validateEnum(
      value.defaultFieldSource,
      ["powerbi", "service", "joined"],
      `${path}/${section}/defaultFieldSource`,
      componentId,
      diagnostics,
    );
    if (value.fields === undefined) continue;
    if (!Array.isArray(value.fields))
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/${section}/fields`,
        componentId,
        message: `${section}.fields must be an array.`,
      });
    else
      value.fields.forEach((entry, index) => {
        const itemPath = `${path}/${section}/fields/${index}`;
        if (validateObject(entry, itemPath, componentId, diagnostics)) {
          unknownKeys(
            entry,
            allowed(
              "field",
              "fieldSource",
              "label",
              "format",
              ...(section === "popup" ? ["display"] : []),
            ),
            itemPath,
            componentId,
            diagnostics,
          );
          validateEnum(
            entry.fieldSource,
            ["powerbi", "service", "joined"],
            `${itemPath}/fieldSource`,
            componentId,
            diagnostics,
          );
        }
      });
  }
  if (object(raw.popup) && raw.popup.actions !== undefined) {
    if (!Array.isArray(raw.popup.actions))
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/popup/actions`,
        componentId,
        message: "popup.actions must be an array.",
      });
    else
      raw.popup.actions.forEach((entry, index) => {
        const actionPath = `${path}/popup/actions/${index}`;
        if (!validateObject(entry, actionPath, componentId, diagnostics))
          return;
        unknownKeys(
          entry,
          allowed("id", "label", "icon", "uiAction"),
          actionPath,
          componentId,
          diagnostics,
        );
        if (
          entry.uiAction !== undefined &&
          validateObject(
            entry.uiAction,
            `${actionPath}/uiAction`,
            componentId,
            diagnostics,
          )
        )
          unknownKeys(
            entry.uiAction,
            allowed(
              "type",
              "target",
              "value",
              "message",
              "title",
              "intent",
              "durationMs",
            ),
            `${actionPath}/uiAction`,
            componentId,
            diagnostics,
          );
      });
  }
  validateSection(
    raw,
    "visibility",
    allowed(
      "minZoom",
      "maxZoom",
      "scaleDependent",
      "conditionField",
      "conditionFieldSource",
      "conditionValues",
    ),
    path,
    componentId,
    diagnostics,
  );
  if (object(raw.visibility))
    validateEnum(
      raw.visibility.conditionFieldSource,
      ["powerbi", "service", "joined"],
      `${path}/visibility/conditionFieldSource`,
      componentId,
      diagnostics,
    );
  if (object(raw.visibility) && raw.visibility.scaleDependent !== undefined)
    limitation(
      "map.layers[].visibility.scaleDependent",
      `${path}/visibility/scaleDependent`,
      componentId,
      diagnostics,
    );
  validateSection(
    raw,
    "performance",
    allowed(
      "maxFeatures",
      "cacheMinutes",
      "viewportQuery",
      "requestBatchSize",
    ),
    path,
    componentId,
    diagnostics,
  );
  validateSection(
    raw,
    "legend",
    allowed("visible", "title", "collapsed", "type", "interactive", "selectionMode", "clickAction", "hoverAction", "showCounts", "showPercentages", "valueField", "valueFieldSource", "valueAggregation", "search", "maxHeight", "order", "labels", "externalInteraction", "internalInteraction"),
    path,
    componentId,
    diagnostics,
  );
  if (object(raw.legend)) {
    validateEnum(raw.legend.type, ["auto", "categorical", "classBreaks", "continuousColor", "proportionalSize", "icon", "line", "polygon", "heatIntensity", "combined"], `${path}/legend/type`, componentId, diagnostics);
    validateEnum(raw.legend.selectionMode, ["single", "multiple"], `${path}/legend/selectionMode`, componentId, diagnostics);
    validateEnum(raw.legend.clickAction, ["filterLayer", "filterMap", "highlight", "select"], `${path}/legend/clickAction`, componentId, diagnostics);
    validateEnum(raw.legend.hoverAction, ["none", "highlight"], `${path}/legend/hoverAction`, componentId, diagnostics);
    validateEnum(raw.legend.valueFieldSource, ["powerbi", "service", "joined"], `${path}/legend/valueFieldSource`, componentId, diagnostics);
    validateEnum(raw.legend.valueAggregation, ["sum", "avg", "min", "max"], `${path}/legend/valueAggregation`, componentId, diagnostics);
    for (const property of [
      "visible", "collapsed", "interactive", "showCounts", "showPercentages",
      "search", "externalInteraction", "internalInteraction",
    ])
      validateBoolean(raw.legend[property], `${path}/legend/${property}`, componentId, diagnostics);
    validateString(raw.legend.title, `${path}/legend/title`, componentId, diagnostics);
    validateString(raw.legend.valueField, `${path}/legend/valueField`, componentId, diagnostics);
    validateNumber(raw.legend.maxHeight, `${path}/legend/maxHeight`, componentId, diagnostics, {
      minimum: 80,
      maximum: 1_200,
      integer: true,
    });
    if (
      raw.legend.order !== undefined &&
      (!Array.isArray(raw.legend.order) ||
        raw.legend.order.some((value) => !["string", "number", "boolean"].includes(typeof value)))
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${path}/legend/order`,
        componentId,
        message: "Legend order must be an array of primitive category values.",
        received: raw.legend.order,
      });
    if (raw.legend.labels !== undefined) {
      if (!validateObject(raw.legend.labels, `${path}/legend/labels`, componentId, diagnostics)) {
        // validateObject emits the canonical diagnostic.
      } else
        for (const [key, value] of Object.entries(raw.legend.labels))
          validateString(value, `${path}/legend/labels/${pointer(key)}`, componentId, diagnostics, true);
    }
  }
  validateSection(
    raw,
    "interaction",
    allowed(
      "enabled",
      "trigger",
      "internalMode",
      "internalScope",
      "externalMode",
      "field",
      "fieldSource",
      "operator",
      "value",
      "selectionMode",
      "multiSelect",
      "showSelector",
      "clearOnSecondClick",
    ),
    path,
    componentId,
    diagnostics,
  );
  if (object(raw.interaction)) {
    if (
      raw.interaction.trigger !== undefined &&
      raw.interaction.trigger !== "click"
    )
      diagnostics.push({
        code: "MAP_INTERACTION_TRIGGER_UNSUPPORTED",
        severity: "error",
        path: `${path}/interaction/trigger`,
        componentId,
        message: "Map layer interactions currently support trigger “click” only.",
        received: raw.interaction.trigger,
        suggestions: ["click"],
      });
    validateEnum(
      raw.interaction.fieldSource,
      ["powerbi", "service", "joined"],
      `${path}/interaction/fieldSource`,
      componentId,
      diagnostics,
    );
  }
  const filters =
    raw.filter === undefined
      ? []
      : Array.isArray(raw.filter)
        ? raw.filter
        : [raw.filter];
  filters.forEach((filter, index) => {
    const filterPath = `${path}/filter/${index}`;
    if (validateObject(filter, filterPath, componentId, diagnostics)) {
      unknownKeys(
        filter,
        allowed("field", "fieldSource", "operator", "value"),
        filterPath,
        componentId,
        diagnostics,
      );
      validateEnum(
        filter.fieldSource,
        ["powerbi", "service", "joined"],
        `${filterPath}/fieldSource`,
        componentId,
        diagnostics,
      );
    }
  });
}

function validateSection(
  owner: Json,
  property: string,
  keys: Set<string>,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  if (
    owner[property] !== undefined &&
    validateObject(
      owner[property],
      `${path}/${property}`,
      componentId,
      diagnostics,
    )
  )
    unknownKeys(
      owner[property] as Json,
      keys,
      `${path}/${property}`,
      componentId,
      diagnostics,
    );
}

function validateSymbolDetails(
  symbol: Json,
  path: string,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  validateEnum(symbol.dashStyle, ["solid", "dash", "dot", "dashDot"], `${path}/dashStyle`, componentId, diagnostics);
  validateEnum(symbol.lineCap, ["butt", "round", "square"], `${path}/lineCap`, componentId, diagnostics);
  validateEnum(symbol.lineJoin, ["miter", "round", "bevel"], `${path}/lineJoin`, componentId, diagnostics);
  validateEnum(symbol.fillPattern, ["none", "diagonal", "crosshatch", "dots"], `${path}/fillPattern`, componentId, diagnostics);
  if (symbol.fillPattern && symbol.fillPattern !== "none")
    limitation("map.layers[].renderer.symbol.fillPattern", `${path}/fillPattern`, componentId, diagnostics);
  for (const sourceProperty of ["iconFieldSource", "rotationFieldSource", "sizeFieldSource", "colorFieldSource", "markerTextFieldSource", "badgeFieldSource"])
    validateEnum(symbol[sourceProperty], ["powerbi", "service", "joined"], `${path}/${sourceProperty}`, componentId, diagnostics);
  for (const fieldProperty of [
    "iconField", "rotationField", "sizeField", "colorField", "markerText",
    "markerTextField", "badge", "badgeField",
  ])
    validateString(symbol[fieldProperty], `${path}/${fieldProperty}`, componentId, diagnostics);
  validateBoolean(symbol.showValue, `${path}/showValue`, componentId, diagnostics);
  validateNumber(symbol.rotation, `${path}/rotation`, componentId, diagnostics);
  validateNumber(symbol.dimmedOpacity, `${path}/dimmedOpacity`, componentId, diagnostics, {
    minimum: 0,
    maximum: 1,
  });
  validateFinitePair(symbol.anchor, `${path}/anchor`, componentId, diagnostics);
  validateFinitePair(symbol.offset, `${path}/offset`, componentId, diagnostics);
  if (symbol.colorMap !== undefined) {
    if (!validateObject(symbol.colorMap, `${path}/colorMap`, componentId, diagnostics)) {
      // validateObject emits the canonical diagnostic.
    } else
      for (const [key, color] of Object.entries(symbol.colorMap))
        validateString(color, `${path}/colorMap/${pointer(key)}`, componentId, diagnostics, true);
  }
  for (const stateProperty of ["selectedStyle", "hoverStyle", "externalHighlightStyle"]) {
    const state = symbol[stateProperty];
    if (state === undefined || !validateObject(state, `${path}/${stateProperty}`, componentId, diagnostics)) continue;
    unknownKeys(state, allowed("color", "fillColor", "size", "radius", "weight", "opacity", "fillOpacity", "outlineColor", "outlineWidth"), `${path}/${stateProperty}`, componentId, diagnostics);
    for (const colorProperty of ["color", "fillColor", "outlineColor"])
      validateString(state[colorProperty], `${path}/${stateProperty}/${colorProperty}`, componentId, diagnostics);
    for (const numericProperty of ["size", "radius", "weight", "opacity", "fillOpacity", "outlineWidth"])
      validateNumber(state[numericProperty], `${path}/${stateProperty}/${numericProperty}`, componentId, diagnostics, {
        minimum: numericProperty.includes("opacity") ? 0 : undefined,
        maximum: numericProperty.includes("opacity") ? 1 : undefined,
      });
  }
  const validateIcon = (icon: Json, iconPath: string) => {
    validateEnum(icon.type, ["builtIn", "svg", "image"], `${iconPath}/type`, componentId, diagnostics);
    const iconKeys = icon.type === "builtIn"
      ? allowed("type", "name", "size", "anchor", "offset")
      : icon.type === "svg"
        ? allowed("type", "svg", "size", "anchor", "offset")
        : icon.type === "image"
          ? allowed("type", "url", "size", "anchor", "offset")
          : allowed("type", "name", "svg", "url", "size", "anchor", "offset");
    unknownKeys(icon, iconKeys, iconPath, componentId, diagnostics);
    if (icon.type === "builtIn" && !isValidIconName(icon.name))
      diagnostics.push({ code: "INVALID_ENUM_VALUE", severity: "error", path: `${iconPath}/name`, componentId, message: "Built-in map icons require a name from the governed icon registry.", received: icon.name });
    if (icon.type === "svg" && (typeof icon.svg !== "string" || !icon.svg))
      diagnostics.push({ code: "MISSING_REQUIRED_PROPERTY", severity: "error", path: `${iconPath}/svg`, componentId, message: "SVG map icons require sanitized SVG markup." });
    if (icon.type === "image" && (typeof icon.url !== "string" || !/^(https:\/\/|\/|\.\/|\.\.\/)/i.test(icon.url)))
      diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${iconPath}/url`, componentId, message: "Image map icons require an HTTPS or relative URL.", received: icon.url });
    validateFinitePair(icon.size, `${iconPath}/size`, componentId, diagnostics);
    validateFinitePair(icon.anchor, `${iconPath}/anchor`, componentId, diagnostics);
    validateFinitePair(icon.offset, `${iconPath}/offset`, componentId, diagnostics);
    if (
      Array.isArray(icon.size) &&
      icon.size.length === 2 &&
      icon.size.some((value) => typeof value === "number" && value <= 0)
    )
      diagnostics.push({
        code: "INVALID_PROPERTY_TYPE",
        severity: "error",
        path: `${iconPath}/size`,
        componentId,
        message: "Map icon size values must be greater than zero.",
        received: icon.size,
      });
  };
  if (symbol.icon !== undefined && validateObject(symbol.icon, `${path}/icon`, componentId, diagnostics))
    validateIcon(symbol.icon, `${path}/icon`);
  if (symbol.iconMap !== undefined && validateObject(symbol.iconMap, `${path}/iconMap`, componentId, diagnostics))
    for (const [key, rawIcon] of Object.entries(symbol.iconMap))
      if (validateObject(rawIcon, `${path}/iconMap/${pointer(key)}`, componentId, diagnostics))
        validateIcon(rawIcon, `${path}/iconMap/${pointer(key)}`);
}

function registerId(
  value: unknown,
  path: string,
  kind: string,
  ids: Map<string, string>,
  componentId: string | undefined,
  diagnostics: Diagnostic[],
): void {
  if (typeof value !== "string" || !value) {
    diagnostics.push({
      code: "MISSING_REQUIRED_PROPERTY",
      severity: "error",
      path,
      componentId,
      message: `Every map ${kind} requires an ID.`,
    });
    return;
  }
  if (ids.has(value))
    diagnostics.push({
      code: "DUPLICATE_COMPONENT_ID",
      severity: "error",
      path,
      componentId,
      message: `Map ${kind} ID “${value}” duplicates ${ids.get(value)}.`,
      received: value,
    });
  else ids.set(value, path);
}
