import { NormalizedMapFeature } from "../../data/normalizeData";
import { sanitizeHtml } from "../../security/sanitizeHtml";

const popupToken = /\{\{\s*([^{}]{1,120}?)\s*\}\}/g;

export function renderMapPopupTemplate(template: string, feature: NormalizedMapFeature): string {
    return template.replace(popupToken, (_match, token: string) => { const key = token.trim(); return Object.prototype.hasOwnProperty.call(feature.properties, key) ? String(feature.properties[key] ?? "") : ""; });
}

export function createMapPopup(template: string, feature: NormalizedMapFeature): HTMLElement {
    const sanitized = sanitizeHtml(renderMapPopupTemplate(template, feature), { allowInlineSvg: false, allowSafeImages: false });
    const parsed = new DOMParser().parseFromString(sanitized.html, "text/html"); const popup = document.createElement("div"); popup.className = "hp-map-popup";
    while (parsed.body.firstChild) popup.appendChild(parsed.body.firstChild);
    return popup;
}
