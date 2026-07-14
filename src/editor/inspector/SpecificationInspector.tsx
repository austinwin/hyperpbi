import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { componentDescriptors, getComponentDescriptor } from "../../catalog/componentDescriptors";
import type { InspectorPropertyDescriptor } from "../../catalog/componentTypes";
import type { NormalizedData } from "../../data/normalizeData";
import { aggregationFieldRequirement } from "../../fields/aggregationFieldPolicy";
import { createFieldAliasRegistry } from "../../fields/fieldAliasRegistry";
import { prepareSpecification } from "../../schema/prepareSpecification";
import {
    appendToContainer, compatibleContainerPaths, componentTree, createComponent,
    deleteComponent, duplicateComponent, findComponent, incomingComponentReferences,
    insertComponent, locateComponent, moveComponent, moveComponentTo,
    SpecificationHistory, updateComponent,
} from "./specificationEditor";

type Json = Record<string, unknown>;
type Pane = "tree" | "properties";
type PropertyGroup = "Identity" | "Data" | "Layout" | "Appearance" | "Interaction" | "Content" | "Accessibility" | "Advanced";
const propertyGroups: PropertyGroup[] = ["Identity", "Data", "Layout", "Appearance", "Interaction", "Content", "Accessibility", "Advanced"];
const object = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function groupFor(control: InspectorPropertyDescriptor): PropertyGroup {
    const property = control.property.toLowerCase();
    if (property === "dataset") return "Identity";
    if (control.control === "field" || /field|measure|metric|column|row|series|indicator|aggregation|sort|filter/.test(property)) return "Data";
    if (/span|width|height|gap|padding|margin|position|direction|layout|columns|rows|maxrows|page/.test(property)) return "Layout";
    if (/style|css|class|color|theme|variant|intent|icon|density|format|heatmap|striped|opacity/.test(property)) return "Appearance";
    if (/interaction|action|target|select|trigger|disabled/.test(property)) return "Interaction";
    if (/text|html|markdown|title|subtitle|content|template|slot|description|label|items|children|footer|tabs|repeat/.test(property)) return "Content";
    if (/aria|accessib|tooltip|role/.test(property)) return "Accessibility";
    return "Advanced";
}

export function SpecificationInspector({
    json, data, onChange, selectedComponentId = "", onSelect = () => undefined,
    aliasOverrides = {}, generatedRuntimeId, history: sharedHistory, onOpenMapStudio,
}: {
    json: string;
    data: NormalizedData;
    onChange: (json: string) => void;
    selectedComponentId?: string;
    onSelect?: (id: string) => void;
    aliasOverrides?: Record<string, string>;
    generatedRuntimeId?: string;
    history?: SpecificationHistory;
    onOpenMapStudio?: () => void;
}) {
    const parsed = useMemo(() => { try { return JSON.parse(json) as Json; } catch { return undefined; } }, [json]);
    const [search, setSearch] = useState("");
    const [pane, setPane] = useState<Pane>("tree");
    const [treeWidth, setTreeWidth] = useState(280);
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
    const [fragment, setFragment] = useState("");
    const [fragmentProperty, setFragmentProperty] = useState("");
    const [fragmentError, setFragmentError] = useState("");
    const [candidateErrors, setCandidateErrors] = useState<string[]>([]);
    const [destination, setDestination] = useState("/components");
    const [newType, setNewType] = useState("text");
    const [revision, setRevision] = useState(0);
    const localHistory = useRef(new SpecificationHistory(json));
    const history = sharedHistory ?? localHistory.current;
    const internal = useRef(json);
    const selectedNode = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (json !== internal.current) {
            if (history.value !== json) history.reset(json);
            internal.current = json;
            setCandidateErrors([]);
            setRevision(value => value + 1);
        }
    }, [json]);
    useEffect(() => { setFragmentProperty(""); setFragment(""); setFragmentError(""); }, [selectedComponentId]);
    useEffect(() => { selectedNode.current?.scrollIntoView?.({ block: "nearest" }); }, [selectedComponentId, search, collapsed]);

    const tree = useMemo(() => componentTree(parsed), [json]);
    const item = findComponent(parsed, selectedComponentId);
    const location = locateComponent(parsed, selectedComponentId);
    const selectedTree = tree.find(entry => entry.id === selectedComponentId);
    const descriptor = item ? getComponentDescriptor(String(item.type)) : undefined;
    const prepared = useMemo(() => parsed ? prepareSpecification(parsed, data, { repair: false, aliasOverrides }) : undefined, [json, data, aliasOverrides]);
    const aliases = createFieldAliasRegistry(data, aliasOverrides).entries;
    const aliasByKey = new Map(aliases.map(field => [field.key, field]));
    const scope = prepared?.datasets?.datasets.get(selectedTree?.datasetName ?? "powerbi");
    const datasets = ["powerbi", ...Object.keys(parsed?.data && object(parsed.data) && object(parsed.data.datasets) ? parsed.data.datasets : {})];
    const containers = compatibleContainerPaths(parsed);
    useEffect(() => { if (!containers.includes(destination)) setDestination(containers[0] ?? ""); }, [json, selectedComponentId]);

    if (!parsed) return <div class="hp-spec-inspector hp-inspector-paused" role="status">Inspector is paused until the JSON is valid.</div>;

    const commit = (value: unknown) => {
        const validation = prepareSpecification(value, data, { repair: false, aliasOverrides });
        if (!validation.schema) { setCandidateErrors(validation.errors); return false; }
        const next = JSON.stringify(value, null, 2);
        setCandidateErrors([]);
        internal.current = next;
        history.commit(next);
        setRevision(value => value + 1);
        onChange(next);
        return true;
    };
    const change = (property: string, value: unknown) => commit(updateComponent(parsed, selectedComponentId, { [property]: value }));
    const restore = (next: string) => {
        internal.current = next;
        if (selectedComponentId && !componentTree(JSON.parse(next)).some(entry => entry.id === selectedComponentId)) onSelect("");
        setCandidateErrors([]);
        setRevision(value => value + 1);
        onChange(next);
    };
    void revision;

    const lowerSearch = search.trim().toLowerCase();
    const visibleTree = tree.filter(entry => {
        if (lowerSearch) return `${entry.id} ${entry.type} ${entry.title ?? ""} ${entry.path}`.toLowerCase().includes(lowerSearch);
        return !tree.some(ancestor => ancestor.depth < entry.depth && collapsed.has(ancestor.id) && entry.path.startsWith(`${ancestor.path}/`));
    });
    const complex = descriptor?.inspector.filter(control => control.control === "json") ?? [];
    const simple = descriptor?.inspector.filter(control => control.control !== "json") ?? [];
    const controlsByGroup = new Map(propertyGroups.map(group => [group, simple.filter(control => groupFor(control) === group)]));
    const canInsert = Boolean(location && Array.isArray(location.parent));
    const position = canInsert ? location!.index as number : -1;
    const siblingCount = canInsert ? (location!.parent as unknown[]).length : 0;
    const generated = Boolean(generatedRuntimeId && generatedRuntimeId !== selectedComponentId);

    const fieldOptionsFor = (control: InspectorPropertyDescriptor) => {
        const descriptorField = descriptor?.fields.find(field => field.property === control.property);
        let requirement = descriptorField?.requirement ?? "any";
        if (["field", "measure", "valueField"].includes(control.property) && typeof item?.aggregation === "string") requirement = aggregationFieldRequirement(item.aggregation, "first").requirement;
        return Object.values(scope?.fields ?? {}).filter(field => requirement !== "numeric" || field.dataType === "number" || field.dataType === "unknown").map(field => ({
            value: selectedTree?.datasetName === "powerbi" ? aliasByKey.get(field.key)?.alias ?? field.key : field.key,
            label: `${field.displayName} · ${field.dataType ?? "unknown"}`,
        }));
    };

    const renderControl = (control: InspectorPropertyDescriptor) => {
        const value = item?.[control.property];
        if (control.control === "checkbox") return <label><span>{control.label}</span><input type="checkbox" checked={value === true} onChange={event => change(control.property, event.currentTarget.checked)} /></label>;
        if (control.control === "number") return <label><span>{control.label}</span><input type="number" min={control.property === "span" ? 1 : undefined} max={control.property === "span" ? 12 : undefined} value={typeof value === "number" ? value : ""} onChange={event => change(control.property, event.currentTarget.value === "" ? undefined : Number(event.currentTarget.value))} /></label>;
        if (control.control === "field") return <label><span>{control.label}</span><select value={typeof value === "string" ? value : ""} onChange={event => change(control.property, event.currentTarget.value || undefined)}><option value="">Not set</option>{fieldOptionsFor(control).map(field => <option value={field.value}>{field.value} — {field.label}</option>)}</select></label>;
        if (control.control === "dataset") return <label><span>{control.label}</span><select value={typeof value === "string" ? value : "powerbi"} onChange={event => change(control.property, event.currentTarget.value === "powerbi" ? undefined : event.currentTarget.value)}>{datasets.map(name => <option value={name}>{name}</option>)}</select></label>;
        if (control.control === "component") return <label><span>{control.label}</span><select value={typeof value === "string" ? value : ""} onChange={event => change(control.property, event.currentTarget.value || undefined)}><option value="">Not set</option>{tree.filter(entry => entry.id !== selectedComponentId).map(entry => <option value={entry.id}>{entry.id} ({entry.type})</option>)}</select></label>;
        if (control.control === "enum") return <label><span>{control.label}</span><select value={typeof value === "string" ? value : ""} onChange={event => change(control.property, event.currentTarget.value || undefined)}><option value="">Not set</option>{control.options?.map(option => <option value={option}>{option}</option>)}</select></label>;
        if (control.control === "color") return <label><span>{control.label}</span><input value={typeof value === "string" ? value : ""} placeholder="#2563eb or var(--hp-primary)" onChange={event => change(control.property, event.currentTarget.value || undefined)} /></label>;
        if (control.control === "multiline") return <label><span>{control.label}</span><textarea value={typeof value === "string" ? value : ""} onChange={event => change(control.property, event.currentTarget.value || undefined)} /></label>;
        return <label><span>{control.label}</span><input value={typeof value === "string" ? value : ""} onChange={event => change(control.property, event.currentTarget.value || undefined)} /></label>;
    };

    const add = (mode: "before" | "after" | "container") => {
        const child = createComponent(newType, parsed);
        const candidate = mode === "container" ? appendToContainer(parsed, destination, child) : insertComponent(parsed, selectedComponentId, mode, child);
        if (commit(candidate)) onSelect(String(child.id));
    };
    const keyboardSelect = (event: KeyboardEvent, index: number) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = visibleTree[Math.max(0, Math.min(visibleTree.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))];
            if (next) onSelect(next.id);
        } else if (event.key === "ArrowRight") setCollapsed(current => { const next = new Set(current); next.delete(visibleTree[index].id); return next; });
        else if (event.key === "ArrowLeft") setCollapsed(current => new Set(current).add(visibleTree[index].id));
    };

    return <div class="hp-spec-inspector" data-active-pane={pane} style={{ "--hp-inspector-tree-width": `${treeWidth}px` }}>
        <header class="hp-inspector-toolbar">
            <div class="hp-inspector-history"><button disabled={!history.canUndo} onClick={() => restore(history.undo())}>Undo</button><button disabled={!history.canRedo} onClick={() => restore(history.redo())}>Redo</button></div>
            <div class="hp-inspector-selection-summary">
                <strong title={`${String(item?.type ?? "No selection")} ${selectedComponentId}`}>{item ? `${String(item.type)} · ${selectedComponentId}` : "Select a component"}</strong>
                <span class={prepared?.schema ? "is-valid" : "is-invalid"}>{prepared?.schema ? "Valid" : "Invalid"}</span>
            </div>
            <label class="hp-inspector-width-control">Hierarchy width <input aria-label="Hierarchy pane width" type="range" min="220" max="520" value={treeWidth} onInput={event => setTreeWidth(Number(event.currentTarget.value))} /></label>
        </header>
        <div class="hp-inspector-pane-switch" role="tablist" aria-label="Inspector pane"><button role="tab" aria-selected={pane === "tree"} onClick={() => setPane("tree")}>Tree</button><button role="tab" aria-selected={pane === "properties"} onClick={() => setPane("properties")} disabled={!item}>Properties</button></div>
        {candidateErrors.length > 0 && <div class="hp-inspector-errors" role="alert"><strong>Edit not applied; the last valid preview is unchanged.</strong><ul>{candidateErrors.map(error => <li>{error}</li>)}</ul></div>}
        <div class="hp-inspector-body">
            <nav class={`hp-inspector-tree ${pane === "properties" ? "is-mobile-hidden" : ""}`} aria-label="Dashboard component hierarchy">
                <label class="hp-inspector-search"><span class="hp-visually-hidden">Search hierarchy</span><input placeholder="Search ID, title, type, or path" value={search} onInput={event => setSearch(event.currentTarget.value)} /></label>
                <div role="tree">{visibleTree.map((entry, index) => {
                    const next = tree[tree.indexOf(entry) + 1];
                    const hasChildren = Boolean(next && next.depth > entry.depth);
                    const maturity = getComponentDescriptor(entry.type)?.maturity;
                    return <div class="hp-inspector-tree-row" style={{ paddingLeft: `${8 + entry.depth * 14}px` }}>
                        {hasChildren ? <button class="hp-tree-toggle" aria-label={`${collapsed.has(entry.id) ? "Expand" : "Collapse"} ${entry.id}`} aria-expanded={!collapsed.has(entry.id)} onClick={() => setCollapsed(current => { const nextSet = new Set(current); if (nextSet.has(entry.id)) nextSet.delete(entry.id); else nextSet.add(entry.id); return nextSet; })}>{collapsed.has(entry.id) ? "▸" : "▾"}</button> : <span class="hp-tree-spacer" />}
                        <button ref={selectedComponentId === entry.id ? selectedNode : undefined} data-tree-id={entry.id} role="treeitem" aria-selected={selectedComponentId === entry.id} class={selectedComponentId === entry.id ? "is-selected" : ""} onClick={() => { onSelect(entry.id); setPane("properties"); }} onKeyDown={event => keyboardSelect(event, index)} title={entry.path}>
                            <span><code>{entry.id}</code>{maturity && <em class={`hp-maturity hp-maturity-${maturity}`}>{maturity}</em>}</span><small>{entry.type}{entry.title ? ` · ${entry.title}` : ""}</small>
                        </button>
                    </div>;
                })}</div>
            </nav>
            <section class={`hp-inspector-properties ${pane === "tree" ? "is-mobile-hidden" : ""}`} aria-label="Selected component properties">
                {item ? <>
                    <header class="hp-inspector-component-summary">
                        <div><strong>{String(item.type)}</strong><code title={selectedTree?.path}>{selectedTree?.path}</code></div>
                        <dl><div><dt>ID</dt><dd title={selectedComponentId}>{selectedComponentId}</dd></div><div><dt>Maturity</dt><dd>{descriptor?.maturity ?? "unknown"}</dd></div><div><dt>Dataset</dt><dd>{selectedTree?.datasetName ?? "powerbi"}</dd></div><div><dt>Owner</dt><dd>{generated ? `Generated ${generatedRuntimeId} → ${selectedComponentId}` : "Authoring node"}</dd></div></dl>
                    </header>
                    {item.type === "map" && onOpenMapStudio && <button class="hp-open-map-studio" onClick={onOpenMapStudio}>Open in Map Studio</button>}
                    <div class="hp-inspector-property-groups">{propertyGroups.map(group => {
                        const controls = controlsByGroup.get(group) ?? [];
                        if (!controls.length) return null;
                        return <fieldset><legend>{group}</legend><div class="hp-inspector-control-grid">{controls.map(renderControl)}</div></fieldset>;
                    })}</div>
                    {complex.length > 0 && <fieldset class="hp-inspector-fragment"><legend>Structured JSON</legend><label><span>Complex property</span><select value={fragmentProperty} onChange={event => { const property = event.currentTarget.value; setFragmentProperty(property); setFragment(property ? JSON.stringify(item[property], null, 2) : ""); setFragmentError(""); }}><option value="">Choose property</option>{complex.map(control => <option value={control.property}>{control.label}</option>)}</select></label>{fragmentProperty && <><textarea aria-label={`${fragmentProperty} JSON draft`} value={fragment} onInput={event => setFragment(event.currentTarget.value)} />{fragmentError && <p role="alert">{fragmentError}</p>}<button onClick={() => { try { const value = JSON.parse(fragment); if (change(fragmentProperty, value)) setFragmentError(""); } catch (error) { setFragmentError(error instanceof Error ? error.message : String(error)); } }}>Apply validated fragment</button></>}</fieldset>}
                    <fieldset class="hp-inspector-mutations"><legend>Add, insert, or move</legend><div class="hp-inspector-control-grid"><label><span>Component type</span><select value={newType} onChange={event => setNewType(event.currentTarget.value)}>{componentDescriptors.filter(entry => entry.maturity !== "deprecated" && entry.maturity !== "legacy").map(entry => <option value={entry.type}>{entry.label} · {entry.maturity}</option>)}</select></label><label><span>Compatible destination</span><select value={destination} onChange={event => setDestination(event.currentTarget.value)}>{containers.map(path => <option value={path}>{path}</option>)}</select></label></div><div class="hp-button-row"><button disabled={!destination} title={!destination ? "No descriptor-declared component container is available." : undefined} onClick={() => add("container")}>Add child</button><button disabled={!canInsert} title={!canInsert ? "The selected node is not in an ordered component array." : undefined} onClick={() => add("before")}>Insert before</button><button disabled={!canInsert} title={!canInsert ? "The selected node is not in an ordered component array." : undefined} onClick={() => add("after")}>Insert after</button><button disabled={!canInsert || !destination} onClick={() => commit(moveComponentTo(parsed, selectedComponentId, destination))}>Move to compatible container</button></div></fieldset>
                    <div class="hp-inspector-node-actions"><button disabled={!canInsert || position <= 0} onClick={() => commit(moveComponent(parsed, selectedComponentId, -1))}>Move up</button><button disabled={!canInsert || position >= siblingCount - 1} onClick={() => commit(moveComponent(parsed, selectedComponentId, 1))}>Move down</button><button disabled={!canInsert} onClick={() => commit(duplicateComponent(parsed, selectedComponentId))}>Duplicate</button><button class="hp-danger-action" onClick={() => { const references = incomingComponentReferences(parsed, selectedComponentId); if (references.length && !globalThis.confirm(`Delete ${selectedComponentId}? Referenced by ${references.join(", ")}`)) return; if (commit(deleteComponent(parsed, selectedComponentId))) onSelect(""); }}>Delete</button></div>
                </> : <div class="hp-inspector-empty"><strong>Select a component</strong><p>Choose an authoring node in the hierarchy or use Inspect preview. Tree paths are canonical JSON pointers.</p></div>}
            </section>
        </div>
    </div>;
}
