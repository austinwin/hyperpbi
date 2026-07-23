// ── Map Feature Symbol ────────────────────────────────────────────────
// Computes Leaflet style objects from ResolvedMapRenderer + feature data.
// Supports: simple, uniqueValue, classBreaks, continuousColor,
// proportionalSize, cluster, service.

import type {
  ResolvedMapRenderer,
  ResolvedMapSymbol,
  ResolvedMapFeature,
} from "../model/resolvedMapTypes";
import {
  resolvedFeatureValue,
  featureNumericDomain,
} from "../model/mapFeatureValue";

export interface LeafletFeatureStyle {
  shape: "circle" | "square" | "diamond" | "triangle" | "icon" | "line" | "fill";
  color: string;
  fillColor: string;
  fillOpacity: number;
  opacity: number;
  weight: number;
  radius: number;
  dashArray?: string;
  className?: string;
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  fillPattern?: "none" | "diagonal" | "crosshatch" | "dots";
  icon?: import("../../schema/mapSchema").MapIconDefinition;
  rotation?: number;
  markerText?: string;
  badge?: string;
  showValue?: boolean;
  anchor?: [number, number];
  offset?: [number, number];
  selectedStyle?: import("../../schema/mapSchema").MapSymbolStateDefinition;
  hoverStyle?: import("../../schema/mapSchema").MapSymbolStateDefinition;
  externalHighlightStyle?: import("../../schema/mapSchema").MapSymbolStateDefinition;
  dimmedOpacity?: number;
}

const DEFAULT_STYLE: LeafletFeatureStyle = {
  shape: "circle",
  color: "#3388ff",
  fillColor: "#3388ff",
  fillOpacity: 0.35,
  opacity: 0.9,
  weight: 2,
  radius: 6,
};

export function featureStyle(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
): LeafletFeatureStyle {
  switch (renderer.type) {
    case "simple":
    case "icon":
    case "line":
    case "polygon":
      return simpleStyle(renderer.symbol, feature);

    case "uniqueValue":
      return uniqueValueStyle(feature, renderer);

    case "classBreaks":
      return classBreaksStyle(feature, renderer);

    case "continuousColor":
      return continuousColorStyle(feature, renderer);

    case "proportionalSize":
      return proportionalSizeStyle(feature, renderer);

    case "cluster":
      return clusterStyle(feature, renderer);

    case "service":
      return serviceStyle(feature, renderer);

    case "heatmap":
    case "densityGrid":
      // Handled separately, not as individual feature styles
      return DEFAULT_STYLE;

    default:
      return DEFAULT_STYLE;
  }
}

function simpleStyle(
  symbol?: ResolvedMapSymbol,
  feature?: ResolvedMapFeature,
): LeafletFeatureStyle {
  if (!symbol) return DEFAULT_STYLE;
  const value = (
    field: string | undefined,
    source: "powerbi" | "service" | "joined" | undefined,
  ) => field && feature ? resolvedFeatureValue(feature, field, source ?? "joined") : undefined;
  const sizeValue = Number(value(symbol.sizeField, symbol.sizeFieldSource));
  const colorValue = value(symbol.colorField, symbol.colorFieldSource);
  const mappedColor =
    colorValue !== undefined && symbol.colorMap
      ? symbol.colorMap[String(colorValue)]
      : undefined;
  const iconValue = value(symbol.iconField, symbol.iconFieldSource);
  const icon =
    iconValue !== undefined && symbol.iconMap
      ? symbol.iconMap[String(iconValue)] ?? symbol.icon
      : symbol.icon;
  const rotationValue = Number(value(symbol.rotationField, symbol.rotationFieldSource));
  const markerTextValue = value(
    symbol.markerTextField,
    symbol.markerTextFieldSource,
  );
  const badgeValue = value(symbol.badgeField, symbol.badgeFieldSource);
  const radius = Number.isFinite(sizeValue)
    ? Math.max(2, Math.min(96, sizeValue))
    : symbol.radius ?? symbol.size ?? DEFAULT_STYLE.radius;
  const fillColor =
    mappedColor ?? symbol.fillColor ?? symbol.color ?? DEFAULT_STYLE.fillColor;
  const dashArray =
    symbol.dashArray ??
    ({
      solid: undefined,
      dash: "8 5",
      dot: "2 4",
      dashDot: "8 4 2 4",
    } as const)[symbol.dashStyle ?? "solid"];
  return {
    shape: symbol.shape ?? DEFAULT_STYLE.shape,
    color: symbol.outlineColor ?? symbol.color ?? DEFAULT_STYLE.color,
    fillColor,
    fillOpacity: symbol.fillOpacity ?? DEFAULT_STYLE.fillOpacity,
    opacity: symbol.opacity ?? DEFAULT_STYLE.opacity,
    weight: symbol.weight ?? symbol.outlineWidth ?? DEFAULT_STYLE.weight,
    radius,
    dashArray,
    lineCap: symbol.lineCap,
    lineJoin: symbol.lineJoin,
    fillPattern: symbol.fillPattern,
    icon,
    rotation: Number.isFinite(rotationValue) ? rotationValue : symbol.rotation,
    markerText:
      markerTextValue === undefined
        ? symbol.markerText
        : String(markerTextValue).slice(0, 40),
    badge:
      badgeValue === undefined ? symbol.badge : String(badgeValue).slice(0, 16),
    showValue: symbol.showValue,
    anchor: symbol.anchor,
    offset: symbol.offset,
    selectedStyle: symbol.selectedStyle,
    hoverStyle: symbol.hoverStyle,
    externalHighlightStyle: symbol.externalHighlightStyle,
    dimmedOpacity: symbol.dimmedOpacity,
  };
}

function uniqueValueStyle(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
): LeafletFeatureStyle {
  if (!renderer.field || !renderer.valueMap) {
    return simpleStyle(renderer.defaultSymbol, feature);
  }

  const value = resolvedFeatureValue(
    feature,
    renderer.field!,
    renderer.fieldSource ?? "joined",
  );
  const key = String(value ?? "__null__");

  const matchedSymbol = renderer.valueMap.get(key);
  if (matchedSymbol) {
    return simpleStyle(matchedSymbol, feature);
  }

  return simpleStyle(renderer.defaultSymbol, feature);
}

function classBreaksStyle(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
): LeafletFeatureStyle {
  if (!renderer.field || !renderer.breaks || renderer.breaks.length === 0) {
    return simpleStyle(renderer.defaultSymbol, feature);
  }

  const rawValue = resolvedFeatureValue(
    feature,
    renderer.field!,
    renderer.fieldSource ?? "joined",
  );
  const num = Number(rawValue);
  if (isNaN(num) || !isFinite(num)) {
    return simpleStyle(renderer.defaultSymbol, feature);
  }

  for (const brk of renderer.breaks) {
    if (
      num >= brk.min &&
      (num < brk.max || (brk.maxInclusive !== false && num <= brk.max))
    ) {
      return simpleStyle(brk.symbol, feature);
    }
  }

  return simpleStyle(renderer.defaultSymbol, feature);
}

function continuousColorStyle(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
): LeafletFeatureStyle {
  const base = simpleStyle(renderer.symbol, feature);
  const field = renderer.field ?? renderer.weightField;
  if (!field) return base;

  const rawValue = resolvedFeatureValue(
    feature,
    field,
    renderer.fieldSource ?? "joined",
  );
  const num = Number(rawValue);
  if (isNaN(num) || !isFinite(num)) return base;

  // We need the domain — this should be precomputed and stored on the renderer
  // For runtime, we use a simple default interpolation
  const minColor = renderer.minColor ?? "#dbeafe";
  const maxColor = renderer.maxColor ?? "#2563eb";

  // Assume domain is normalized; actual domain should be set during rendering
  // Use a reasonable default t
  const t = clamp(num * 0.01, 0, 1); // This will be replaced by actual domain interpolation
  const color = interpolateColor(minColor, maxColor, t);

  return {
    ...base,
    color: color,
    fillColor: color,
  };
}

function proportionalSizeStyle(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
): LeafletFeatureStyle {
  const base = simpleStyle(renderer.symbol, feature);
  base.color = renderer.baseColor ?? base.color;
  base.fillColor = renderer.baseColor ?? base.fillColor;

  const field = renderer.field ?? renderer.weightField;
  if (!field) return base;

  const rawValue = resolvedFeatureValue(
    feature,
    field,
    renderer.fieldSource ?? "joined",
  );
  const num = Number(rawValue);
  if (isNaN(num) || !isFinite(num)) return base;

  // Use a default sizing — actual domain should be computed during rendering
  const minSize = renderer.minSize ?? 4;
  const maxSize = renderer.maxSize ?? 24;
  const size = clamp(num * 0.5, minSize, maxSize); // placeholder scaling

  return {
    ...base,
    radius: size,
    weight: Math.max(1, size / 6),
  };
}

function clusterStyle(
  _feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
): LeafletFeatureStyle {
  return {
    ...DEFAULT_STYLE,
    color: renderer.baseColor ?? "#3388ff",
    fillColor: renderer.baseColor ?? "#3388ff",
  };
}

function serviceStyle(
  _feature: ResolvedMapFeature,
  _renderer: ResolvedMapRenderer,
): LeafletFeatureStyle {
  // Service renderer means the symbology was applied during layer resolution
  // (e.g., from arcGisRendererAdapter). The feature's symbol should have
  // been precomputed. Return defaults.
  return DEFAULT_STYLE;
}

/**
 * Compute the actual numeric domain for continuous color/proportional size
 * from an array of features.
 */
export function computeFeatureDomain(
  features: readonly ResolvedMapFeature[],
  field: string,
  fieldSource: "powerbi" | "service" | "joined",
): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  let hasValues = false;

  for (const feature of features) {
    const raw = resolvedFeatureValue(feature, field, fieldSource);
    if (raw === null || raw === undefined) continue;
    const num = Number(raw);
    if (isNaN(num) || !isFinite(num)) continue;
    if (num < min) min = num;
    if (num > max) max = num;
    hasValues = true;
  }

  return hasValues ? [min, max] : null;
}

/**
 * Compute style with an explicit domain for continuous renderers.
 */
export function featureStyleWithDomain(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
  domain: [number, number],
): LeafletFeatureStyle {
  const base = simpleStyle(renderer.symbol, feature);

  if (renderer.type === "continuousColor") {
    const field = renderer.field ?? renderer.weightField;
    if (!field) return base;

    const rawValue = resolvedFeatureValue(
      feature,
      field,
      renderer.fieldSource ?? "joined",
    );
    const num = Number(rawValue);
    if (isNaN(num) || !isFinite(num)) return base;

    const [dMin, dMax] = domain;
    const t = dMax === dMin ? 0.5 : clamp((num - dMin) / (dMax - dMin), 0, 1);
    const color = interpolateColor(
      renderer.minColor ?? "#dbeafe",
      renderer.maxColor ?? "#2563eb",
      t,
    );

    return { ...base, color, fillColor: color };
  }

  if (renderer.type === "proportionalSize") {
    const field = renderer.field ?? renderer.weightField;
    if (!field) return base;

    const rawValue = resolvedFeatureValue(
      feature,
      field,
      renderer.fieldSource ?? "joined",
    );
    const num = Number(rawValue);
    if (isNaN(num) || !isFinite(num)) return base;

    const [dMin, dMax] = domain;
    const minSize = renderer.minSize ?? 4;
    const maxSize = renderer.maxSize ?? 24;
    const t = dMax === dMin ? 0.5 : clamp((num - dMin) / (dMax - dMin), 0, 1);
    const size = minSize + t * (maxSize - minSize);

    return {
      ...base,
      color: renderer.baseColor ?? base.color,
      fillColor: renderer.baseColor ?? base.fillColor,
      radius: size,
      weight: Math.max(1, size / 6),
    };
  }

  return featureStyle(feature, renderer);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function interpolateColor(
  color1: string,
  color2: string,
  factor: number,
): string {
  const parse = (c: string): [number, number, number] => {
    if (c.startsWith("#")) {
      const h = c.slice(1);
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    return [0, 0, 0];
  };

  const c1 = parse(color1);
  const c2 = parse(color2);
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * factor);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * factor);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * factor);
  return `rgb(${r},${g},${b})`;
}
