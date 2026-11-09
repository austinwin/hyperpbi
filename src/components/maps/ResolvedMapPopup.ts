// ── Resolved Map Popup ────────────────────────────────────────────────
// Renders popup content from ResolvedMapLayer popup configuration.
// Supports title/HTML templates, structured fields, Power BI/service/joined
// field sources with formatting, safe HTML, and action execution.

import type {
  ResolvedMapFeature,
  ResolvedMapPopup,
  ResolvedMapPopupAction,
  ResolvedMapTooltip,
} from "../../maps/model/resolvedMapTypes";
import {
  resolvedFeatureValue,
  formatFeatureValue,
  mergedFeatureAttributes,
  mapFeatureDisplayValue,
} from "../../maps/model/mapFeatureValue";
import type { FeatureFieldSource } from "../../maps/model/mapFeatureValue";
import { sanitizeHtml } from "../../security/sanitizeHtml";

const TOKEN_REGEX = /\{\{\s*([^{}]{1,120}?)\s*\}\}/g;

export interface ResolvedMapPopupFieldView {
  label: string;
  value: string;
  display: "text" | "badge" | "number" | "date";
}

export interface ResolvedMapPopupViewModel {
  title?: string;
  html?: string;
  fields: ResolvedMapPopupFieldView[];
  actions: ResolvedMapPopupAction[];
}

/** Pure content resolution for canonical map feature details. */
export function resolveMapPopupViewModel(
  popup: ResolvedMapPopup,
  feature: ResolvedMapFeature,
): ResolvedMapPopupViewModel {
  if (popup.mode === "none") return { fields: [], actions: [] };
  if (popup.mode === "dynamic") return { title: popup.title ? resolveSafeTemplate(popup.title, feature, popup.defaultFieldSource ?? "service") : undefined, fields: [], actions: [] };
  if (popup.mode === "default") return { fields: Object.entries(mergedFeatureAttributes(feature)).slice(0, 50).map(([label, value]) => ({ label, value: formatFeatureValue(value), display: "text" as const })), actions: [] };
  const title = popup.title
    ? resolveSafeTemplate(
        popup.title,
        feature,
        popup.defaultFieldSource ?? "joined",
      )
    : undefined;
  const html = popup.html
    ? sanitizeHtml(
        resolveSafeTemplate(
          popup.html,
          feature,
          popup.defaultFieldSource ?? "joined",
          true,
        ),
        { allowInlineSvg: false, allowSafeImages: false },
      ).html
    : undefined;
  return {
    title,
    html,
    fields: (popup.fields ?? []).map((fieldDef) => ({
      label: fieldDef.label ?? fieldDef.field,
      value: formatFeatureValue(
        resolvedFeatureValue(
          feature,
          fieldDef.field,
          fieldDef.fieldSource ?? "joined",
        ),
        fieldDef.format,
        fieldDef.display,
      ),
      display: fieldDef.display,
    })),
    actions: popup.actions ?? [],
  };
}

/**
 * Create a plain-text tooltip from resolved feature data.
 */
export function renderResolvedTooltip(
  feature: ResolvedMapFeature,
  tooltip?: ResolvedMapTooltip,
  layerName?: string,
): string {
  if (tooltip?.template) {
    return resolveSafeTemplate(
      tooltip.template,
      feature,
      tooltip.defaultFieldSource ?? "joined",
    );
  }
  const fields = tooltip?.fields;
  if (!fields || fields.length === 0) {
    const display = mapFeatureDisplayValue(feature);
    return display
      ? `${layerName ?? "Feature"}: ${display}`
      : (layerName ?? "Map feature");
  }

  const parts: string[] = [];
  for (const f of fields) {
    const value = resolvedFeatureValue(feature, f.field, f.fieldSource);
    const label = f.label ?? f.field;
    const display = formatFeatureValue(value, f.format, f.display);
    parts.push(`${label}: ${display}`);
  }
  return parts.join("\n");
}

/**
 * Substitute {{field}} tokens in a template string with feature attribute values.
 * Uses textContent-safe substitution (no HTML injection).
 */
export function resolveSafeTemplate(
  template: string,
  feature: ResolvedMapFeature,
  fieldSource?: FeatureFieldSource,
  escapeValues = false,
): string {
  const merged = mergedFeatureAttributes(feature);

  return template.replace(TOKEN_REGEX, (_match, token: string) => {
    const key = token.trim();
    const explicit = /^(service|powerbi|joined)\.(.+)$/.exec(key);
    const value = explicit ? resolvedFeatureValue(feature, explicit[2], explicit[1] as FeatureFieldSource) : fieldSource
      ? resolvedFeatureValue(feature, key, fieldSource)
      : Object.prototype.hasOwnProperty.call(merged, key)
        ? merged[key]
        : undefined;
    const formatted = formatFeatureValue(value);
    const text = formatted === "—" ? "—" : formatted;
    return escapeValues ? escapeHtml(text) : text;
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Create a safe tooltip element for Leaflet.
 */
export function createResolvedTooltipElement(
  feature: ResolvedMapFeature,
  tooltip?: ResolvedMapTooltip,
  layerName?: string,
): HTMLElement {
  const node = document.createElement("div");
  node.className = "hp-map-tooltip";

  if (tooltip?.template) {
    node.textContent = resolveSafeTemplate(
      tooltip.template,
      feature,
      tooltip.defaultFieldSource ?? "joined",
    );
    return node;
  }

  const tooltipFields = tooltip?.fields;
  if (!tooltipFields || tooltipFields.length === 0) {
    const display = mapFeatureDisplayValue(feature);
    node.textContent = display
      ? `${layerName ?? "Feature"}: ${display}`
      : (layerName ?? "Map feature");
    return node;
  }

  for (const f of tooltipFields) {
    const line = document.createElement("div");
    const label = document.createElement("strong");
    label.textContent = `${f.label ?? f.field}: `;
    const value = resolvedFeatureValue(feature, f.field, f.fieldSource);
    const displayText = formatFeatureValue(value, f.format, f.display);
    line.append(label, document.createTextNode(displayText));
    node.appendChild(line);
  }

  return node;
}
