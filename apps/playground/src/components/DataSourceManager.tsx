import type { DataSource, DataWorkspace } from "@hyperpbi/data/dataWorkspace";

const display = (value: unknown): string => value === null || value === undefined ? "—" : value instanceof Date ? value.toISOString() : String(value);

export function DataSourceManager({
    workspace,
    uploading,
    onUpload,
    onRename,
    onRemove,
    onDefault
}: {
    workspace: DataWorkspace;
    uploading: boolean;
    onUpload: (files: FileList) => void;
    onRename: (sourceId: string, name: string) => void;
    onRemove: (sourceId: string) => void;
    onDefault: (sourceId: string) => void;
}) {
    const sources = Object.values(workspace.sources);
    return <aside class="pg-source-manager">
        <div class="pg-source-heading">
            <div><span class="pg-eyebrow">Data workspace</span><h2>Sources</h2></div>
            <label class={`pg-upload-button ${uploading ? "is-disabled" : ""}`}>
                {uploading ? "Parsing…" : "+ Upload"}
                <input type="file" accept=".csv,.xlsx" multiple disabled={uploading} onChange={event => event.currentTarget.files && onUpload(event.currentTarget.files)} />
            </label>
        </div>
        <p class="pg-source-help">Each CSV and Excel sheet is a named source. The default source is available to specifications as <code>powerbi</code>.</p>
        {!sources.length && <div class="pg-source-empty"><strong>Add local data</strong><p>Upload one or more .csv or .xlsx files. Files are parsed locally.</p></div>}
        <div class="pg-source-list">{sources.map(source => <SourceCard
            key={source.id}
            source={source}
            isDefault={source.id === workspace.defaultSourceId}
            onRename={name => onRename(source.id, name)}
            onRemove={() => onRemove(source.id)}
            onDefault={() => onDefault(source.id)}
        />)}</div>
    </aside>;
}

function SourceCard({ source, isDefault, onRename, onRemove, onDefault }: {
    source: DataSource;
    isDefault: boolean;
    onRename: (name: string) => void;
    onRemove: () => void;
    onDefault: () => void;
}) {
    const fields = Object.values(source.data.fields);
    const previewFields = fields.slice(0, 6);
    return <details class={`pg-source-card ${isDefault ? "is-default" : ""}`} open={isDefault}>
        <summary>
            <span class="pg-source-kind">{source.kind === "csv" ? "CSV" : "XLS"}</span>
            <span class="pg-source-title"><strong>{source.name}</strong><small>{source.fileName}{source.sheetName ? ` · ${source.sheetName}` : ""}</small></span>
            {isDefault && <span class="pg-default-badge">Default</span>}
            <span class="pg-source-count">{source.data.rows.length.toLocaleString()} rows</span>
        </summary>
        <div class="pg-source-body">
            <label class="pg-field-label">Source name<input value={source.name} onChange={event => onRename(event.currentTarget.value)} /></label>
            <div class="pg-source-stats"><span><b>{source.data.rows.length.toLocaleString()}</b> rows</span><span><b>{fields.length}</b> fields</span></div>
            <div class="pg-type-list">{fields.map(field => <span key={field.key} title={field.key}>{field.displayName || field.key}<b>{field.type}</b></span>)}</div>
            <div class="pg-preview-table" role="region" aria-label={`${source.name} preview`}><table><thead><tr>{previewFields.map(field => <th key={field.key}>{field.displayName || field.key}</th>)}</tr></thead><tbody>{source.data.rows.slice(0, 5).map((row, index) => <tr key={source.data.rowKeys[index]}>{previewFields.map(field => <td key={field.key}>{display(row[field.key])}</td>)}</tr>)}</tbody></table></div>
            <div class="pg-source-actions">
                {!isDefault && <button onClick={onDefault}>Set as default</button>}
                <button class="pg-danger-link" onClick={() => globalThis.confirm(`Remove “${source.name}”?`) && onRemove()}>Remove source</button>
            </div>
        </div>
    </details>;
}
