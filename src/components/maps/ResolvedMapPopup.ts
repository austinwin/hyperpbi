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
} from "../../maps/model/mapFeatureValue";
import type { FeatureFieldSource } from "../../maps/model/mapFeatureValue";
import { sanitizeHtml } from "../../security/sanitizeHtml";

const TOKEN_REGEX = /\{\{\s*([^{}]{1,120}?)\s*\}\}/g;

export interface ResolvedPopupRuntime {
  executeAction: (
    action: ResolvedMapPopupAction,
    feature: ResolvedMapFeature,
    event: Event,
  ) => void;
}

export interface RenderedResolvedPopup {
  element: HTMLElement;
  cleanup: () => void;
}

/**
 * Render a popup HTML element for a resolved map feature.
 * Supports templates, structured fields, safe HTML output, and bound action execution.
 */
export function renderResolvedPopup(
  popup: ResolvedMapPopup,
  feature: ResolvedMapFeature,
  runtime?: ResolvedPopupRuntime,
): RenderedResolvedPopup {
  const container = document.createElement("div");
  container.className = "hp-map-popup hp-map-popup-resolved";
  const cleanups: Array<() => void> = [];

  // ── Title ──────────────────────────────────────────────────────
  if (popup.title) {
    const title = document.createElement("h4");
    title.className = "hp-map-popup-title";
    title.textContent = resolveSafeTemplate(
      popup.title,
      feature,
      popup.defaultFieldSource ?? "joined",
    );
    container.appendChild(title);
  }

  // ── HTML template ──────────────────────────────────────────────
  if (popup.html) {
    const rendered = resolveSafeTemplate(
      popup.html,
      feature,
      popup.defaultFieldSource ?? "joined",
      true,
    );
    const sanitized = sanitizeHtml(rendered, {
      allowInlineSvg: false,
      allowSafeImages: false,
    });
    const parsed = new DOMParser().parseFromString(sanitized.html, "text/html");
    while (parsed.body.firstChild) {
      container.appendChild(parsed.body.firstChild);
    }
  }

  // ── Structured fields ──────────────────────────────────────────
  if (popup.fields && popup.fields.length > 0) {
    const table = document.createElement("table");
    table.className = "hp-map-popup-fields";

    for (const fieldDef of popup.fields) {
      const rawValue = resolvedFeatureValue(
        feature,
        fieldDef.field,
        fieldDef.fieldSource ?? "joined",
      );
      const formatted = formatFeatureValue(
        rawValue,
        fieldDef.format,
        fieldDef.display,
      );

      const row = document.createElement("tr");

      const labelCell = document.createElement("th");
      labelCell.textContent = fieldDef.label ?? fieldDef.field;
      row.appendChild(labelCell);

      const valueCell = document.createElement("td");

      if (fieldDef.display === "badge") {
        const badge = document.createElement("span");
        badge.className = "hp-badge";
        badge.textContent = formatted;
        valueCell.appendChild(badge);
      } else {
        valueCell.textContent = formatted;
      }

      row.appendChild(valueCell);
      table.appendChild(row);
    }

    container.appendChild(table);
  }

  // ── Actions ────────────────────────────────────────────────────
  if (popup.actions && popup.actions.length > 0) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "hp-map-popup-actions";

    for (const action of popup.actions) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hp-btn hp-btn-sm";
      btn.textContent = action.label;
      if (action.icon) {
        btn.setAttribute("data-icon", action.icon);
      }
      if (runtime) {
        const handler = (e: Event) => runtime.executeAction(action, feature, e);
        btn.addEventListener("click", handler);
        cleanups.push(() => btn.removeEventListener("click", handler));
      }
      actionsContainer.appendChild(btn);
    }

    container.appendChild(actionsContainer);
  }

  return {
    element: container,
    cleanup: () => {
      for (const fn of cleanups) fn();
    },
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
    // Fallback: layer name + feature ID
    const id = feature.serviceObjectId ?? feature.id;
    return `${layerName ?? "Feature"}: ${id}`;
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
    const value = fieldSource
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
    const id = feature.serviceObjectId ?? feature.id;
    node.textContent = `${layerName ?? "Feature"}: ${id}`;
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
