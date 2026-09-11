import type { Primitive } from "../data/normalizeData";
import type { ComponentInteractionDefinition } from "../interactions/interactionTypes";
import type { ComponentBase } from "./hyperpbiSchema";

export interface MermaidNodeBinding {
    nodeId: string;
    field: string;
    value?: Primitive;
    label?: string;
    interaction?: ComponentInteractionDefinition;
}

export interface MermaidDiagramComponent extends ComponentBase {
    type: "mermaidDiagram";
    source: string;
    theme?: "auto" | "default" | "neutral" | "dark" | "forest" | "base";
    fit?: "contain" | "width" | "none";
    panZoom?: boolean;
    nodeBindings?: MermaidNodeBinding[];
    frameless?: boolean;
}

export const MERMAID_SOURCE_MAX_LENGTH = 100_000;
