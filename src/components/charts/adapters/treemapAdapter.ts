import { aggregateValue } from "../../../data/aggregations";
import type { DataRow } from "../../../data/normalizeData";
import type { TreemapChartComponent } from "../../../schema/hyperpbiSchema";
import type { ChartAdapter, ChartDatumBinding } from "./types";
import { baseOption, semanticResult, sourceIndices } from "./shared";

interface TreeNode {
    label: string;
    category: string;
    field: string;
    rows: DataRow[];
    children: Map<string, TreeNode>;
}

export const treemapAdapter: ChartAdapter<TreemapChartComponent> = {
    type: "treemapChart",
    fields: component => [...component.pathFields, component.valueField, component.labelField].filter((field): field is string => Boolean(field)),
    build(component, rows, context) {
        const fields = component.pathFields.slice(0, component.maxDepth ?? component.pathFields.length);
        const roots = new Map<string, TreeNode>();
        for (const row of rows) {
            let children = roots;
            for (let level = 0; level < fields.length; level++) {
                const field = fields[level];
                const category = String(row[field] ?? "(Blank)");
                let node = children.get(category);
                if (!node) {
                    const label = level === fields.length - 1 && component.labelField ? String(row[component.labelField] ?? category) : category;
                    node = { label, category, field, rows: [], children: new Map() };
                    children.set(category, node);
                }
                node.rows.push(row);
                children = node.children;
            }
        }
        const bindings: ChartDatumBinding[] = [];
        // ECharts reserves raw index zero for its generated root.
        let dataIndex = 1;
        const build = (node: TreeNode, parent: readonly string[], parentId?: string): Record<string, unknown> => {
            const path = [...parent, node.category];
            const id = JSON.stringify(path);
            const value = Number(aggregateValue(node.rows, component.valueField, component.aggregation ?? "sum") ?? 0);
            bindings.push({
                seriesIndex: 0, dataIndex: dataIndex++, dataType: "node",
                sourceRowIndices: sourceIndices(node.rows, context), field: node.field, value: node.category,
                hierarchy: { id, parentId, path, category: node.category, label: node.label, level: path.length - 1, value },
            });
            return { id, name: node.label, value, children: node.children.size ? [...node.children.values()].map(child => build(child, path, id)) : undefined };
        };
        const data = [...roots.values()].map(node => build(node, []));
        return semanticResult({
            ...baseOption(context),
            series: [{ type: "treemap", selectedMode: "multiple", roam: false, nodeClick: false, data, label: { show: true } }],
        }, component, bindings);
    },
};
