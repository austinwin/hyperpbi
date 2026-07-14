import {
  mapCapability,
  mapCapabilityRegistry,
} from "../maps/mapCapabilityRegistry";
import { closestMatches, type Diagnostic } from "./diagnostics";

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
  ),
};
const rendererKeys: Record<string, Set<string>> = {
  service: allowed("type"),
  simple: allowed("type", "symbol"),
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
    "gradient",
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
    ["legend", allowed("defaultOpen")],
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
      ),
    ],
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
    if (type === "heatmap" || type === "densityGrid")
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
          ["circle", "square", "diamond", "triangle", "line", "fill"],
          `${path}/renderer/${property}/shape`,
          componentId,
          diagnostics,
        );
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
    allowed("enabled", "title", "fields", "actions", "html"),
    path,
    componentId,
    diagnostics,
  );
  validateSection(
    raw,
    "tooltip",
    allowed("enabled", "fields", "template"),
    path,
    componentId,
    diagnostics,
  );
  for (const section of ["popup", "tooltip"]) {
    const value = raw[section];
    if (!object(value) || value.fields === undefined) continue;
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
      "generalizeByZoom",
      "minimumGeneralization",
      "maximumGeneralization",
      "requestBatchSize",
      "progressiveRendering",
    ),
    path,
    componentId,
    diagnostics,
  );
  if (object(raw.performance))
    for (const property of [
      "generalizeByZoom",
      "minimumGeneralization",
      "maximumGeneralization",
      "progressiveRendering",
    ])
      if (raw.performance[property] !== undefined)
        limitation(
          `map.layers[].performance.${property}`,
          `${path}/performance/${property}`,
          componentId,
          diagnostics,
        );
  validateSection(
    raw,
    "legend",
    allowed("visible", "title", "collapsed"),
    path,
    componentId,
    diagnostics,
  );
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
