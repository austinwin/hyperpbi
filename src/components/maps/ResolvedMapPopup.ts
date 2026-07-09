// ── Resolved Map Popup ────────────────────────────────────────────────
// Renders popup content from ResolvedMapLayer popup configuration.
// Supports title/HTML templates, structured fields, Power BI/service/joined
// field sources with formatting, and safe HTML output.

import type { ResolvedMapFeature, ResolvedMapPopup, ResolvedMapPopupField } from "../../maps/model/resolvedMapTypes";
import { resolvedFeatureValue, formatFeatureValue, mergedFeatureAttributes } from "../../maps/model/mapFeatureValue";
import { sanitizeHtml } from "../../security/sanitizeHtml";

const TOKEN_REGEX = /\{\{\s*([^{}]{1,120}?)\s*\}\}/g;

/**
 * Render a popup HTML element for a resolved map feature.
 * Supports templates, structured fields, and safe HTML output.
 */
export function renderResolvedPopup(
    popup: ResolvedMapPopup,
    feature: ResolvedMapFeature
): HTMLElement {
    const container = document.createElement("div");
    container.className = "hp-map-popup hp-map-popup-resolved";

    // ── Title ──────────────────────────────────────────────────────
    if (popup.title) {
        const title = document.createElement("h4");
        title.className = "hp-map-popup-title";
        title.textContent = resolveTemplate(popup.title, feature);
        container.appendChild(title);
    }

    // ── HTML template ──────────────────────────────────────────────
    if (popup.html) {
        const rendered = resolveTemplate(popup.html, feature);
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
                fieldDef.fieldSource ?? "joined"
            );
            const formatted = formatFeatureValue(rawValue, fieldDef.format, fieldDef.display);

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
            // Actions are bound by the caller via DOM listeners
            btn.setAttribute("data-action-id", action.id);
            actionsContainer.appendChild(btn);
        }

        container.appendChild(actionsContainer);
    }

    return container;
}

/**
 * Create a plain-text tooltip from resolved feature data.
 */
export function renderResolvedTooltip(
    feature: ResolvedMapFeature,
    fields?: Array<{ field: string; fieldSource: "powerbi" | "service" | "joined"; label?: string }>,
    layerName?: string
): string {
    if (!fields || fields.length === 0) {
        // Fallback: layer name + feature ID
        const id = feature.serviceObjectId ?? feature.id;
        return `${layerName ?? "Feature"}: ${id}`;
    }

    const parts: string[] = [];
    for (const f of fields) {
        const value = resolvedFeatureValue(feature, f.field, f.fieldSource);
        const label = f.label ?? f.field;
        const display = value !== null && value !== undefined ? String(value) : "—";
        parts.push(`${label}: ${display}`);
    }
    return parts.join("\n");
}

/**
 * Substitute {{field}} tokens in a template string with feature attribute values.
 * Uses textContent-safe substitution (no HTML injection).
 */
function resolveTemplate(template: string, feature: ResolvedMapFeature): string {
    const merged = mergedFeatureAttributes(feature);

    return template.replace(TOKEN_REGEX, (_match, token: string) => {
        const key = token.trim();
        if (Object.prototype.hasOwnProperty.call(merged, key)) {
            // Safe: return as text content, not HTML
            const value = merged[key];
            return value !== null && value !== undefined ? String(value) : "";
        }
        return "";
    });
}

/**
 * Create a safe tooltip element for Leaflet.
 */
export function createResolvedTooltipElement(
    feature: ResolvedMapFeature,
    tooltipFields?: Array<{ field: string; fieldSource: "powerbi" | "service" | "joined"; label?: string }>,
    layerName?: string
): HTMLElement {
    const node = document.createElement("div");
    node.className = "hp-map-tooltip";

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
        const displayText = value !== null && value !== undefined ? String(value) : "—";
        line.append(label, document.createTextNode(displayText));
        node.appendChild(line);
    }

    return node;
}
