import { NormalizedData } from "../../data/normalizeData";
export function FieldDictionaryPanel({ data }: { data: NormalizedData }) {
    return <details class="hp-debug"><summary>Field dictionary ({Object.keys(data.fields).length})</summary><table><thead><tr><th>Key</th><th>Display name</th><th>Source table</th><th>Source column</th><th>Query name</th><th>Type</th><th>Format</th><th>Roles</th></tr></thead><tbody>{Object.values(data.fields).map(field => <tr><td><code>{field.key}</code></td><td>{field.displayName}</td><td>{field.sourceTable ?? "—"}</td><td>{field.sourceColumn ?? "—"}</td><td>{field.queryName ?? "—"}</td><td>{field.type}</td><td>{field.format ?? "—"}</td><td>{field.roles.join(", ")}</td></tr>)}</tbody></table></details>;
}
