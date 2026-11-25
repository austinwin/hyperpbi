import type { DataRow } from "./normalizeData";

const indicesByRows = new WeakMap<DataRow[], Map<DataRow, number>>();

/** One reverse index per live row array, created only when a consumer needs it. */
export function indexRows(rows: DataRow[]): Map<DataRow, number> {
    let indices = indicesByRows.get(rows);
    if (!indices) {
        indices = new Map();
        for (let index = 0; index < rows.length; index++) indices.set(rows[index], index);
        indicesByRows.set(rows, indices);
    }
    return indices;
}
