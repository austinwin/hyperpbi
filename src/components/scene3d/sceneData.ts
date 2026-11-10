import type { DataRow } from "../../data/normalizeData";
import { isScene3dColor, isScene3dKey, type Scene3dComponent, type Scene3dKey, type Scene3dObject } from "../../schema/scene3dSchema";

export interface SceneObjectState {
    object: Scene3dObject;
    label: string;
    color?: string;
    status?: unknown;
    level?: number;
    flow?: number;
    visible: boolean;
    selectable: boolean;
    row?: DataRow;
    indices: number[];
}

export function resolveSceneObjects(component: Scene3dComponent, sourceRows: DataRow[], visibleRows: DataRow[]): SceneObjectState[] {
    const { objectIdField, statusField, colorField, visibleField, levelField, flowField } = component;
    const bindings = new Map<Scene3dKey, { row: DataRow; indices: number[] }>();
    if (objectIdField) {
        const visible = sourceRows === visibleRows ? undefined : new Set(visibleRows);
        sourceRows.forEach((row, index) => {
            if (visible && !visible.has(row)) return;
            const key = row[objectIdField];
            if (!isScene3dKey(key)) return;
            const existing = bindings.get(key);
            if (existing) existing.indices.push(index);
            else bindings.set(key, { row, indices: [index] });
        });
    }
    const palette = new Map(component.statusColors?.map(rule => [rule.value, rule.color]));
    return component.objects.map(object => {
        const bound = object.dataKey !== undefined;
        const binding = bound ? bindings.get(object.dataKey!) : undefined;
        const row = binding?.row;
        const status = row && statusField ? row[statusField] : undefined;
        const directColor = row && colorField ? row[colorField] : undefined;
        const mappedColor = isScene3dKey(status) ? palette.get(status) : undefined;
        const level = object.kind === "tank" && row && levelField ? row[levelField] : undefined;
        const flowRow = object.flowKey === undefined ? row : bindings.get(object.flowKey)?.row;
        const flow = object.kind === "pipe" && flowRow && flowField ? flowRow[flowField] : undefined;
        return {
            object,
            label: object.label ?? String(object.dataKey ?? object.id),
            color: isScene3dColor(directColor) ? directColor : mappedColor ?? (bound && !row ? "#8493a6" : object.color),
            status,
            level: typeof level === "number" && Number.isFinite(level) ? Math.max(0, Math.min(100, level)) : undefined,
            flow: typeof flow === "number" && Number.isFinite(flow) ? flow : undefined,
            visible: object.visible !== false && !(bound && !row && component.hideUnmatched) && !(row && visibleField && row[visibleField] === false),
            selectable: object.selectable ?? bound,
            row,
            indices: binding?.indices ?? [],
        };
    });
}
