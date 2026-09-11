import { getComponentDescriptor, type ComponentDescriptor } from "./componentDescriptors";

const svgMarkup = getComponentDescriptor("svgMarkup");
if (!svgMarkup) throw new Error("The mermaidDiagram descriptor requires svgMarkup.");

const mermaidProperties = ["source", "theme", "fit", "panZoom", "nodeBindings", "frameless"];
export const mermaidDiagramDescriptor: ComponentDescriptor = {
    ...svgMarkup,
    type: "mermaidDiagram",
    label: "Mermaid diagram",
    category: "Advanced components",
    maturity: "beta",
    complexity: "standard",
    useWhen: "Authored Mermaid flowcharts, sequence, class, state, ER, architecture, and process diagrams with optional data-bound interactions",
    capabilities: { ...svgMarkup.capabilities, interactions: true, externalSelection: true },
    interaction: { defaultEnabled: false, naturalTrigger: "click", autoExternalMode: "selection" },
    schema: {
        required: ["type", "id", "source"],
        allowed: [...svgMarkup.schema.allowed.filter(property => !["svg", "viewBox", "preserveAspectRatio", "role", "description", "dataContext", "motion", "performance"].includes(property) && !mermaidProperties.includes(property)), ...mermaidProperties],
    },
    fields: [{ property: "nodeBindings", requirement: "any", handler: "item-bindings" }],
    inspector: [
        { property: "source", label: "Mermaid source", control: "multiline", group: "Content", help: "Mermaid diagram source. HyperPBI always renders it in strict security mode." },
        { property: "theme", label: "Theme", control: "enum", options: ["auto", "default", "neutral", "dark", "forest", "base"], group: "Appearance" },
        { property: "fit", label: "Fit", control: "enum", options: ["contain", "width", "none"], group: "Layout" },
        { property: "panZoom", label: "Pan and zoom", control: "checkbox", group: "Interaction" },
        { property: "nodeBindings", label: "Node bindings", control: "json", group: "Data", help: "Bind stable Mermaid logical node IDs to Field Manifest aliases and values." },
        { property: "frameless", label: "Frameless", control: "checkbox", group: "Appearance" },
    ],
    documentation: {
        summary: "Locally bundled, strictly sanitized Mermaid rendering with optional HyperPBI-owned node interactions.",
        accessibility: ["Bound nodes are keyboard focusable and activate with Enter or Space."],
        relatedTypes: ["networkGraph", "svgMarkup"],
    },
    example: {
        type: "mermaidDiagram", id: "process_flow", title: "Service workflow", frameless: true,
        source: "flowchart LR\nSR[Service Request] --> WO[Work Order]",
        theme: "auto", fit: "contain", panZoom: true,
        nodeBindings: [
            { nodeId: "SR", field: "__field_key__", value: "SR-100", label: "Service Request" },
            { nodeId: "WO", field: "__field_key__", value: "WO-200", label: "Work Order" },
        ],
        interaction: { enabled: true, trigger: "click", internalMode: "filter", internalScope: "others", externalMode: "selection", selectionMode: "replace", clearOnSecondClick: true },
    },
};
