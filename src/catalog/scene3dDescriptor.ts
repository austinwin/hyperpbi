import type { ComponentDescriptor } from "./componentDescriptors";

export const scene3dDescriptor: ComponentDescriptor = {
    type: "scene3d",
    label: "3D scene",
    category: "Advanced components",
    maturity: "stable",
    complexity: "standard",
    useWhen: "Show interactive equipment, facility layouts, or physical assets tied to data",
    capabilities: { fields: true, calculations: true, css: true, slots: true, interactions: true, externalSelection: true, customHtml: false },
    interaction: { defaultEnabled: true, naturalTrigger: "click", autoExternalMode: "selection" },
    schema: {
        required: ["type", "id", "objects"],
        allowed: ["type", "id", "title", "subtitle", "span", "order", "responsive", "heightMode", "minHeight", "aspectRatio", "className", "hidden", "style", "css", "slots", "ariaLabel", "disabled", "tooltip", "interaction", "dataset", "objects", "objectIdField", "statusField", "statusColors", "colorField", "visibleField", "tooltipFields", "hideUnmatched", "showLabels", "showObjectList", "shadows", "grid", "view", "theme", "height", "frameless"],
    },
    fields: [
        ...["objectIdField", "statusField", "colorField", "visibleField"].map(property => ({ property, requirement: "any", handler: "scalar" } as const)),
        { property: "tooltipFields", requirement: "any", handler: "table-columns" },
    ],
    inspector: [
        { property: "objectIdField", label: "Object key field", control: "field", group: "Data", order: 10 },
        { property: "statusField", label: "Status field", control: "field", group: "Data", order: 20 },
        { property: "colorField", label: "Color field", control: "field", group: "Data", order: 30, help: "A field with six-digit hex colors. A valid color overrides the status palette." },
        { property: "visibleField", label: "Visibility field", control: "field", group: "Data", order: 40, help: "A Boolean false hides a matched object." },
        { property: "hideUnmatched", label: "Hide objects without data", control: "checkbox", group: "Data", order: 50 },
        { property: "height", label: "Viewport height (px)", control: "number", group: "Layout", order: 10 },
        { property: "view", label: "Starting view", control: "enum", options: ["isometric", "top"], group: "Appearance", order: 10 },
        { property: "theme", label: "Scene theme", control: "enum", options: ["auto", "light", "dark"], group: "Appearance", order: 20 },
        { property: "showLabels", label: "Show object labels", control: "checkbox", group: "Appearance", order: 30, defaultChecked: true },
        { property: "showObjectList", label: "Show object list", control: "checkbox", group: "Appearance", order: 40, defaultChecked: true },
        { property: "grid", label: "Show ground grid", control: "checkbox", group: "Appearance", order: 50, defaultChecked: true },
        { property: "shadows", label: "Cast shadows", control: "checkbox", group: "Appearance", order: 60, defaultChecked: true },
        { property: "frameless", label: "Frameless", control: "checkbox", group: "Appearance", order: 70 },
    ],
    documentation: {
        summary: "An interactive Three.js scene with primitives, equipment assemblies, and embedded glTF models. Bind objects to typed dataset keys for status, tooltips, and row-identity selection.",
        accessibility: ["Select objects with the keyboard-accessible object list or projected labels. The list works when WebGL is unavailable."],
        relatedTypes: ["detailPanel", "table", "svg"],
    },
    example: {
        type: "scene3d", id: "equipment_scene", title: "Booster station",
        objects: [
            { id: "pump_1", kind: "pump", label: "P-101", position: [-1.1, 0, 0], color: "#1b9b82", selectable: true },
            { id: "pump_2", kind: "pump", label: "P-102", position: [1.1, 0, 0], color: "#eaa53b", selectable: true },
        ],
        height: 400,
        interaction: { enabled: true, trigger: "click", internalMode: "none", externalMode: "none" },
    },
    rendering: "direct",
    containers: [],
    maturityEvidence: {
        renderer: true, schema: true, fieldTraversal: true, canonicalExample: true, inspector: true,
        emptyState: true, responsive: true, accessibility: true, interactions: true,
        focusedTests: ["tests/scene3d.test.ts", "apps/playground/tests/scene3d.spec.ts"],
    },
};
