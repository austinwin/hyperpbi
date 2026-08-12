import type { EChartsCoreOption } from "echarts/core";
import type { GraphSeriesOption } from "echarts/charts";
import type { DataRow } from "../../../data/normalizeData";
import type { NetworkGraphComponent } from "../../../schema/networkGraphSchema";
import { categoricalColor } from "../../../utils/colors";
import type { ChartAdapter, ChartDatumBinding } from "./types";
import { baseOption, semanticResult, sourceIndices } from "./shared";

interface GraphNode {
    id: string;
    name: string;
    category: string;
    rows: DataRow[];
    x?: number;
    y?: number;
}

interface GraphLink {
    source: string;
    target: string;
    rows: DataRow[];
    label?: string;
    weight: number;
}

const text = (value: unknown): string => value == null ? "" : String(value).trim();
const number = (value: unknown, fallback: number): number => {
    const result = Number(value);
    return Number.isFinite(result) ? result : fallback;
};
const clamp = (value: unknown, fallback: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, number(value, fallback)));

function hierarchicalPositions(nodes: GraphNode[], links: GraphLink[], orientation: "horizontal" | "vertical"): void {
    const adjacency = new Map<string, Set<string>>();
    const indegree = new Map(nodes.map(node => [node.id, 0] as const));
    for (const link of links) {
        const targets = adjacency.get(link.source) ?? new Set<string>();
        if (!targets.has(link.target)) {
            targets.add(link.target);
            adjacency.set(link.source, targets);
            indegree.set(link.target, (indegree.get(link.target) ?? 0) + 1);
        }
    }

    const levels = new Map<string, number>();
    const queue = nodes.filter(node => (indegree.get(node.id) ?? 0) === 0).map(node => node.id);
    if (!queue.length && nodes[0]) queue.push(nodes[0].id);
    for (const id of queue) levels.set(id, 0);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const source = queue[cursor];
        const nextLevel = (levels.get(source) ?? 0) + 1;
        for (const target of adjacency.get(source) ?? []) {
            if (!levels.has(target) || nextLevel < (levels.get(target) ?? Number.MAX_SAFE_INTEGER)) {
                levels.set(target, nextLevel);
                queue.push(target);
            }
        }
    }

    for (const node of nodes) if (!levels.has(node.id)) levels.set(node.id, 0);
    const grouped = new Map<number, GraphNode[]>();
    for (const node of nodes) {
        const level = levels.get(node.id) ?? 0;
        const group = grouped.get(level) ?? [];
        group.push(node);
        grouped.set(level, group);
    }

    const levelGap = 210;
    const rowGap = 78;
    for (const [level, group] of grouped) {
        group.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" }));
        const offset = (group.length - 1) * rowGap / 2;
        group.forEach((node, index) => {
            const primary = level * levelGap + 40;
            const secondary = index * rowGap - offset;
            node.x = orientation === "horizontal" ? primary : secondary;
            node.y = orientation === "horizontal" ? secondary : primary;
        });
    }
}

export const networkGraphAdapter: ChartAdapter<NetworkGraphComponent> = {
    type: "networkGraph",
    fields: component => [
        component.sourceField,
        component.targetField,
        component.sourceLabelField,
        component.targetLabelField,
        component.sourceCategoryField,
        component.targetCategoryField,
        component.edgeLabelField,
        component.edgeWeightField,
    ].filter((field): field is string => Boolean(field)),

    build(component, rows, context) {
        const maxNodes = Math.round(clamp(component.maxNodes, 1500, 2, 5000));
        const nodeRows = new Map<string, DataRow[]>();
        const nodeLabels = new Map<string, string>();
        const nodeCategories = new Map<string, string>();
        const linkRows = new Map<string, GraphLink>();
        let skippedBlank = 0;
        let skippedOverflow = 0;

        const canAddNode = (id: string) => nodeRows.has(id) || nodeRows.size < maxNodes;
        const addNode = (id: string, row: DataRow, labelField?: string, categoryField?: string): boolean => {
            if (!canAddNode(id)) return false;
            const entries = nodeRows.get(id) ?? [];
            entries.push(row);
            nodeRows.set(id, entries);
            const label = labelField ? text(row[labelField]) : "";
            const category = categoryField ? text(row[categoryField]) : "";
            if (label && !nodeLabels.has(id)) nodeLabels.set(id, label);
            if (category && !nodeCategories.has(id)) nodeCategories.set(id, category);
            return true;
        };

        for (const row of rows) {
            const source = text(row[component.sourceField]);
            const target = text(row[component.targetField]);
            if (!source || !target) {
                skippedBlank += 1;
                continue;
            }
            if (!canAddNode(source) || !canAddNode(target)) {
                skippedOverflow += 1;
                continue;
            }

            addNode(source, row, component.sourceLabelField, component.sourceCategoryField);
            addNode(target, row, component.targetLabelField, component.targetCategoryField);

            const key = `${source}\u0000${target}`;
            const current = linkRows.get(key);
            const weight = component.edgeWeightField ? number(row[component.edgeWeightField], 0) : 1;
            if (current) {
                current.rows.push(row);
                current.weight += weight;
                if (!current.label && component.edgeLabelField) current.label = text(row[component.edgeLabelField]) || undefined;
            } else {
                linkRows.set(key, {
                    source,
                    target,
                    rows: [row],
                    label: component.edgeLabelField ? text(row[component.edgeLabelField]) || undefined : undefined,
                    weight,
                });
            }
        }

        const nodes: GraphNode[] = Array.from(nodeRows.entries()).map(([id, nodeData]) => ({
            id,
            name: nodeLabels.get(id) || id,
            category: nodeCategories.get(id) || "Default",
            rows: nodeData,
        }));
        const links = Array.from(linkRows.values());

        if ((component.layout ?? "force") === "hierarchical") {
            hierarchicalPositions(nodes, links, component.orientation ?? "horizontal");
        }

        const categories = Array.from(new Set(nodes.map(node => node.category)));
        const categoryIndex = new Map(categories.map((category, index) => [category, index] as const));
        const nodeSize = clamp(component.nodeSize, 22, 8, 80);
        const edgeWeights = links.map(link => Math.max(0, link.weight));
        const maxWeight = Math.max(1, ...edgeWeights);
        const graphData = nodes.map(node => ({
            id: node.id,
            name: node.name,
            value: node.name,
            category: categoryIndex.get(node.category) ?? 0,
            symbolSize: nodeSize,
            x: node.x,
            y: node.y,
        }));
        const graphLinks = links.map(link => ({
            source: link.source,
            target: link.target,
            value: component.showEdgeLabels === true ? link.label ?? link.weight : link.weight,
            lineStyle: {
                width: 1 + Math.sqrt(Math.max(0, link.weight) / maxWeight) * 3,
            },
        }));

        const layout = component.layout ?? "force";
        const series: GraphSeriesOption = {
            type: "graph",
            layout: layout === "hierarchical" ? "none" : layout,
            roam: component.roam !== false,
            draggable: component.draggable !== false,
            selectedMode: "multiple",
            data: graphData,
            links: graphLinks,
            categories: categories.map(category => ({
                name: category,
                itemStyle: { color: categoricalColor(category) },
            })),
            label: {
                show: component.showLabels !== false,
                position: "bottom",
                distance: 7,
                overflow: "truncate",
                width: 150,
            },
            edgeLabel: {
                show: component.showEdgeLabels === true,
                formatter: "{c}",
                color: context.theme.text,
                fontSize: 10,
            },
            lineStyle: { color: "source", opacity: 0.5, curveness: 0.04 },
            emphasis: { focus: "adjacency", lineStyle: { opacity: 0.9 } },
            edgeSymbol: component.directed === false ? ["none", "none"] : ["none", "arrow"],
            edgeSymbolSize: [4, 8],
        };
        if (layout === "force") {
            series.force = {
                repulsion: clamp(component.repulsion, 650, 20, 5000),
                edgeLength: clamp(component.edgeLength, 140, 20, 600),
                gravity: clamp(component.gravity, 0.08, 0, 1),
                friction: 0.55,
            };
        } else if (layout === "circular") {
            series.circular = { rotateLabel: false };
        }

        const bindings: ChartDatumBinding[] = [];
        nodes.forEach((node, dataIndex) => bindings.push({
            seriesIndex: 0,
            dataIndex,
            dataType: "node",
            sourceRowIndices: sourceIndices(node.rows, context),
            value: node.id,
        }));
        links.forEach((link, dataIndex) => bindings.push({
            seriesIndex: 0,
            dataIndex,
            dataType: "edge",
            sourceRowIndices: sourceIndices(link.rows, context),
            value: [link.source, link.target],
        }));

        const warnings: string[] = [];
        if (skippedBlank) warnings.push(`${skippedBlank.toLocaleString()} relationship row(s) were skipped because source or target was blank.`);
        if (skippedOverflow) warnings.push(`${skippedOverflow.toLocaleString()} relationship row(s) were skipped after the ${maxNodes.toLocaleString()}-node limit was reached.`);

        const option: EChartsCoreOption = {
            ...baseOption(context),
            animation: layout !== "force",
            series: [series],
        };
        return semanticResult(option, component, bindings, warnings);
    },
};
