import type { BaseChartComponent } from "./hyperpbiSchema";

export interface NetworkGraphEntity {
    /** Stable identifier used by relationship definitions. */
    id: string;
    /** Human-readable entity type shown in the graph legend/category styling. */
    label?: string;
    /** Field Manifest alias containing the entity's stable key. */
    field: string;
    /** Optional Field Manifest alias used as the node display label. */
    labelField?: string;
    /** Safe CSS color. Explicit entity color wins over the categorical palette. */
    color?: string;
    /** Curated ECharts graph symbol. */
    symbol?: "circle" | "rect" | "roundRect" | "triangle" | "diamond" | "pin" | "arrow";
    /** Optional entity-specific node size. */
    nodeSize?: number;
}

export interface NetworkGraphRelationship {
    /** Source entity id. */
    source: string;
    /** Target entity id. */
    target: string;
    /** Optional presentation-only grouping node inserted between source and target. */
    branchLabel?: string;
}

/**
 * First-class node-link graph over entity fields already present in the
 * selected Power BI/HyperPBI dataset.
 *
 * Power BI model relationships determine which entity values arrive together
 * in each row. HyperPBI deduplicates repeated nodes and relationships, so
 * authors do not need to build a separate edge table for the graph.
 */
export interface NetworkGraphComponent extends BaseChartComponent {
    type: "networkGraph";
    entities: NetworkGraphEntity[];
    relationships: NetworkGraphRelationship[];
    layout?: "force" | "circular" | "hierarchical" | "hybrid";
    orientation?: "horizontal" | "vertical";
    roam?: boolean;
    draggable?: boolean;
    directed?: boolean;
    showLabels?: boolean;
    focusMode?: "none" | "adjacency";
    showNodeTooltip?: boolean;
    showEdgeTooltip?: boolean;
    nodeSize?: number;
    labelWidth?: number;
    labelOverflow?: "truncate" | "break" | "breakAll";
    labelFontSize?: number;
    labelLineHeight?: number;
    labelDistance?: number;
    labelPosition?: "top" | "left" | "right" | "bottom" | "inside";
    autoCompact?: boolean;
    denseThreshold?: number;
    initialZoom?: number;
    repulsion?: number;
    edgeLength?: number;
    gravity?: number;
    levelGap?: number;
    nodeGap?: number;
    edgeWidth?: number;
    edgeOpacity?: number;
    edgeCurvature?: number;
    arrowSize?: number;
    maxNodes?: number;
}
