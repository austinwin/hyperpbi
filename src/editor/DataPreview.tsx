import { useMemo, useState } from "preact/hooks";
import { NormalizedData } from "../data/normalizeData";
import { formatValue } from "../utils/formatValue";

export function DataPreview({ data }: { data: NormalizedData }) {
    const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(25); const fields = Object.values(data.fields); const pages = Math.max(1, Math.ceil(data.rows.length / pageSize)); const safePage = Math.min(page, pages);
    const rows = useMemo(() => data.rows.slice((safePage - 1) * pageSize, safePage * pageSize), [data.rows, safePage, pageSize]);
    return <div class="hp-studio-data"><div class="hp-studio-table-wrap"><table><thead><tr><th>__row__</th>{fields.map(field => <th>{field.displayName}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr><td>{(safePage - 1) * pageSize + index}</td>{fields.map(field => <td>{formatValue(row[field.key], field.format)}</td>)}</tr>)}</tbody></table></div><footer><span>Data set</span><strong>dataset</strong><label>Rows per page <select value={pageSize} onChange={event => { setPageSize(Number(event.currentTarget.value)); setPage(1); }}><option>25</option><option>50</option><option>100</option></select></label><span>{data.rows.length ? `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, data.rows.length)} of ${data.rows.length}` : "0 rows"}</span><button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹</button><button type="button" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>›</button></footer></div>;
}
