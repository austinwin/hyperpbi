import { useMemo, useState } from "preact/hooks";
import type { HyperPbiSchema } from "@hyperpbi/schema/hyperpbiSchema";
import type { DataRow, NormalizedData, NormalizedField } from "@hyperpbi/data/normalizeData";
import { calculateAggregates } from "@hyperpbi/data/aggregations";
import { normalizeMapBindings } from "@hyperpbi/data/normalizeMapBindings";
import { createPowerBiDataWorkspace } from "@hyperpbi/data/dataWorkspace";
import { createPlaygroundProject } from "@hyperpbi/playground/project";
import { PlaygroundRenderer } from "./PlaygroundRenderer";
import { navigate } from "../router";
import manifest from "../../../../examples/map/manifest.json";

interface MapGalleryEntry {
    id: string;
    group: string;
    title: string;
    summary: string;
    spec: string;
    data: string;
    expected: string;
    limitations: string;
    powerBi?: string;
}

const specificationModules = import.meta.glob("../../../../examples/map/**/spec.json", { eager: true }) as Record<string, { default: HyperPbiSchema }>;
const dataModules = import.meta.glob("../../../../examples/map/data/*.json", { eager: true }) as Record<string, { default: DataRow[] }>;
const pathSuffix = (path: string) => path.replaceAll("\\", "/").split("/examples/map/")[1];
const specifications = new Map(Object.entries(specificationModules).map(([path, module]) => [pathSuffix(path), module.default]));
const datasets = new Map(Object.entries(dataModules).map(([path, module]) => [pathSuffix(path), module.default]));

export function MapGalleryPage() {
    const entries = manifest.examples as MapGalleryEntry[];
    const [selectedId, setSelectedId] = useState(entries[0]?.id ?? "");
    const [copied, setCopied] = useState(false);
    const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];
    const specification = selected ? specifications.get(selected.spec) : undefined;
    const rows = selected ? datasets.get(selected.data) ?? [] : [];
    const project = useMemo(() => {
        if (!selected || !specification) return undefined;
        const next = createPlaygroundProject(selected.title);
        next.specification = specification;
        next.dataWorkspace = createPowerBiDataWorkspace(normalizeExampleData(rows));
        return next;
    }, [selected, specification, rows]);
    const groups = [...new Set(entries.map((entry) => entry.group))];
    const json = specification ? JSON.stringify(specification, null, 2) : "";
    const copy = async () => {
        await navigator.clipboard.writeText(json);
        setCopied(true);
        globalThis.setTimeout(() => setCopied(false), 1400);
    };

    return (
        <main class="pg-map-gallery">
            <header class="pg-map-gallery-header">
                <button type="button" onClick={() => navigate("/")}>← Playground</button>
                <div><span class="pg-eyebrow">Component gallery</span><h1>Analytical maps</h1></div>
                <a href="https://github.com/austinwin/hyperpbi/blob/main/docs/maps.md" target="_blank" rel="noreferrer">Complete map guide ↗</a>
            </header>
            <section class="pg-map-overview">
                <div>
                    <h2>One declarative visual, from operational points to joined ArcGIS analysis.</h2>
                    <p>HyperPBI maps combine safe JSON-defined sources, renderers, legends, filters, selection tools, Power BI identity synchronization, popups, and responsive navigation in one retained Leaflet runtime.</p>
                </div>
                <dl>
                    <div><dt>{entries.length}</dt><dd>focused examples</dd></div>
                    <div><dt>{groups.length}</dt><dd>feature groups</dd></div>
                    <div><dt>0</dt><dd>executable marker scripts</dd></div>
                </dl>
            </section>
            <div class="pg-map-gallery-layout">
                <nav class="pg-map-example-nav" aria-label="Map examples">
                    {groups.map((group) => (
                        <section>
                            <strong>{group}</strong>
                            {entries.filter((entry) => entry.group === group).map((entry) => (
                                <button type="button" class={entry.id === selected?.id ? "is-active" : ""} aria-current={entry.id === selected?.id ? "page" : undefined} onClick={() => setSelectedId(entry.id)}>
                                    <span>{entry.title}</span><small>{entry.summary}</small>
                                </button>
                            ))}
                        </section>
                    ))}
                </nav>
                <article class="pg-map-example">
                    <header>
                        <div><span class="pg-eyebrow">{selected?.group}</span><h2>{selected?.title}</h2><p>{selected?.summary}</p></div>
                        <button type="button" onClick={() => void copy()}>{copied ? "Copied" : "Copy spec"}</button>
                    </header>
                    <section class="pg-map-example-preview" aria-label={`${selected?.title} preview`}>
                        {project ? <PlaygroundRenderer project={project} /> : <div class="pg-render-error">Example could not be loaded.</div>}
                    </section>
                    <div class="pg-map-example-notes">
                        <div><strong>Expected behavior</strong><p>{selected?.expected}</p></div>
                        <div><strong>Limitations</strong><p>{selected?.limitations}</p></div>
                        <div><strong>Power BI</strong><p>{selected?.powerBi ?? "Browser previews use deterministic row keys. In Power BI, eligible selections use retained host identities and configured external filter targets."}</p></div>
                    </div>
                    <details class="pg-map-spec" open>
                        <summary>JSON specification</summary>
                        <pre><code>{json}</code></pre>
                    </details>
                </article>
            </div>
            <section class="pg-map-guidance">
                <article><h3>Performance</h3><p>Prefer viewport queries for large services, clusters for dense selectable points, and the canvas heatmap for non-selectable intensity pixels. Feature styles patch retained layers instead of rebuilding geometry.</p></article>
                <article><h3>Security</h3><p>Remote services pass provider and host policy. Image URLs are HTTPS or relative, SVG is sanitized, marker text is escaped, and specifications cannot execute JavaScript or unrestricted HTML markers.</p></article>
                <article><h3>Power BI behavior</h3><p>Selection identities have configurable safety limits. Spatial and legend selections can continue locally when the host identity limit is exceeded, while external filtering requires a direct model-column target.</p></article>
            </section>
        </main>
    );
}

function normalizeExampleData(rows: DataRow[]): NormalizedData {
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const fields = Object.fromEntries(keys.map((key) => {
        const numeric = rows.some((row) => typeof row[key] === "number");
        const field: NormalizedField = {
            key,
            displayName: key.replace(/_/g, " ").replace(/\b\w/g, (value) => value.toUpperCase()),
            type: key === "latitude" ? "latitude" : key === "longitude" ? "longitude" : numeric ? "measure" : "dimension",
            dataType: numeric ? "number" : key.includes("date") ? "date" : "text",
            roles: ["values"],
            kind: "column",
            origin: "powerbi-column",
            sourceTable: "MapExamples",
            sourceColumn: key,
        };
        return [key, field];
    }));
    const rowKeys = rows.map((row, index) => String(row.id ?? `map-example-${index}`));
    return {
        rows,
        rowKeys,
        fields,
        aggregates: calculateAggregates(rows),
        map: normalizeMapBindings(rows, fields, undefined, {}, rowKeys),
    };
}
