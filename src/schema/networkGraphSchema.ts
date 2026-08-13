import type { BaseChartComponent } from "./hyperpbiSchema";

/**
 * First-class node-link graph over an edge-list dataset.
 *
 * Each input row contributes one relationship from sourceField to targetField.
 * Duplicate edges are aggregated while retaining source-row lineage for
 * HyperPBI and Power BI interactions.
 */
export interface NetworkGraphComponent extends BaseChartComponent {
    type: "networkGraph";
    sourceField: string;
    targetField: string;
    sourceLabelField?: string;
    targetLabelField?: string;
    sourceCategoryField?: string;
    targetCategoryField?: string;
    edgeLabelField?: string;
    edgeWeightField?: string;
    layout?: "force" | "circular" | "hierarchical";
    orientation?: "horizontal" | "vertical";
    roam?: boolean;
    draggable?: boolean;
    directed?: boolean;
    showLabels?: boolean;
    showEdgeLabels?: boolean;
    nodeSize?: number;
    repulsion?: number;
    edgeLength?: number;
    gravity?: number;
    maxNodes?: number;
}
