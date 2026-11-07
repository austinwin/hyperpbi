import { componentDescriptors } from "../catalog/componentDescriptors";
import { normalizeTabularData } from "../data/fileImport";
import { createEmptyNormalizedData, type DataWorkspace } from "../data/dataWorkspace";
import { prepareSpecification } from "../schema/prepareSpecification";
import { configuredWebRestHostPatterns } from "../data/remoteDataSources";
import { matchesHttpsHost } from "../security/networkHostPolicy";
import { FRAGMENT_LIMITS, type RemoteFragment } from "./fragmentTypes";

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const restricted = new Set(["map", "modal", "offcanvas", "dropdown", "popover", "html", "custom", "mermaidDiagram", "leftPanel", "rightPanel"]);
export const fragmentComponentTypes = Object.freeze(componentDescriptors.map(item => item.type).filter(type => !restricted.has(type)).sort());
const supported = new Set(fragmentComponentTypes);
const localActions = new Set(["setTab", "setState", "toggleState", "clearFilters", "setStep", "nextStep", "previousStep"]);

function validateAssetReferences(value: string): void {
    for (const asset of value.matchAll(/(?:https?:\/\/|\/\/)[^\s"'<>)}]+/gi)) if (!matchesHttpsHost(asset[0], configuredWebRestHostPatterns())) throw new Error("Fragment asset URL is outside the build host policy.");
    if (/(?:src|href)\s*=\s*["'](?!https:\/\/|#|data:image\/)/i.test(value)) throw new Error("Fragment markup asset references must be approved HTTPS URLs, local SVG references or safe image data.");
}

/** Validate before canonical preparation; bound all recursion and reject executable/privileged content. */
export function prepareRemoteFragment(input: unknown, namespace: string) {
    if (!object(input) || input.kind !== "hyperpbi.fragment" || input.version !== "1.0") throw new Error('Expected hyperpbi.fragment version "1.0".');
    if (Object.keys(input).some(key => !["kind", "version", "title", "datasets", "components"].includes(key))) throw new Error("Fragment contains unsupported root properties. Network policy and dashboard configuration cannot be supplied by a response.");
    if (input.title !== undefined && (typeof input.title !== "string" || input.title.length > 200)) throw new Error("Fragment title must be at most 200 characters.");
    if (!Array.isArray(input.components) || !input.components.length || !object(input.datasets)) throw new Error("Fragment needs components and a datasets object.");
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(namespace)) throw new Error("Invalid fragment namespace.");
    const fragment = JSON.parse(JSON.stringify(input)) as RemoteFragment;
    const entries = Object.entries(fragment.datasets);
    if (!entries.length || entries.length > FRAGMENT_LIMITS.datasets) throw new Error("Fragment needs 1–16 datasets.");
    let rows = 0;
    const sources: DataWorkspace["sources"] = {};
    for (const [name, records] of entries) {
        if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name) || ["powerbi", "constructor", "prototype"].includes(name)) throw new Error(`Invalid fragment dataset name: ${name}.`);
        if (!Array.isArray(records) || (rows += records.length) > FRAGMENT_LIMITS.rows) throw new Error("Fragment exceeds the 5000-row limit.");
        const columns = new Set<string>();
        for (const row of records) {
            if (!object(row)) throw new Error("Dataset rows must be objects.");
            for (const [key, value] of Object.entries(row)) {
                if (["__proto__", "constructor", "prototype"].includes(key) || !["string", "number", "boolean"].includes(typeof value) && value !== null) throw new Error("Dataset cells must be JSON scalars with safe field names.");
                if (typeof value === "string") validateAssetReferences(value);
                columns.add(key);
            }
        }
        if (columns.size > FRAGMENT_LIMITS.columns) throw new Error("Fragment dataset exceeds the 100-column limit.");
        const headers = [...columns];
        sources[name] = { id: name, name, kind: "rest.get", data: headers.length ? normalizeTabularData(headers, records.map(row => headers.map(key => row[key])), `fragment:${namespace}:${name}`) : createEmptyNormalizedData() };
    }
    let componentCount = 0;
    const ids = new Set<string>();
    const componentNodes = new WeakSet<object>();
    const visit = (value: unknown, depth: number, isComponent = false): void => {
        if (depth > 32) throw new Error("Fragment JSON nesting is too deep.");
        if (Array.isArray(value)) { value.forEach(child => visit(child, depth + 1, isComponent)); return; }
        if (!object(value)) return;
        if (isComponent) {
            componentNodes.add(value);
            if (++componentCount > FRAGMENT_LIMITS.components) throw new Error("Fragment exceeds the 100-component limit.");
            if (!supported.has(String(value.type))) throw new Error(`Component ${String(value.type)} is restricted in remote fragments.`);
            if (typeof value.id !== "string" || !/^[A-Za-z][A-Za-z0-9_-]{0,54}$/.test(value.id) || ids.has(value.id)) throw new Error("Fragment components require unique canonical IDs of at most 55 characters.");
            ids.add(value.id);
            if (value.dataset === undefined) value.dataset = entries[0][0];
        }
        for (const [key, child] of Object.entries(value)) {
            if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Unsafe fragment property.");
            if (key === "slots") throw new Error("Authored HTML slots are restricted in remote fragments. Use text, Markdown or safe SVG components.");
            if (key === "uiAction") {
                for (const action of Array.isArray(child) ? child : [child]) if (!object(action) || !localActions.has(String(action.type))) throw new Error("Fragments permit only local state and navigation actions.");
            }
            if (key === "externalMode" && child !== "none") throw new Error("Remote fragments cannot interact with the Power BI model.");
            if (typeof child === "string") validateAssetReferences(child);
            visit(child, depth + 1, ["children", "footer"].includes(key) || key === "chart");
        }
    };
    // Layout depth is independent of object property nesting.
    const checkLayout = (node: unknown, depth: number): void => {
        if (depth > FRAGMENT_LIMITS.depth) throw new Error("Fragment layout exceeds eight levels.");
        if (Array.isArray(node)) { node.forEach(child => checkLayout(child, depth)); return; }
        if (!object(node)) return;
        for (const [key, child] of Object.entries(node)) if (["children", "footer", "tabs", "items", "chart"].includes(key)) checkLayout(child, depth + 1);
    };
    checkLayout(fragment.components, 1);
    visit(fragment.components, 0, true);
    // Tabs and accordion wrappers contain canonical children, already visited above.
    const prefix = (value: unknown, parentKey = ""): void => {
        if (Array.isArray(value)) { value.forEach(child => prefix(child, parentKey)); return; }
        if (!object(value)) return;
        for (const [key, child] of Object.entries(value)) {
            const componentReference = componentNodes.has(value) || ["interaction", "uiAction"].includes(parentKey) || localActions.has(String(value.type));
            if ((key === "id" && componentNodes.has(value) || key === "target" && componentReference && typeof child === "string" && ids.has(child)) && typeof child === "string") value[key] = `${namespace}-${child}`;
            else if (key === "targets" && parentKey !== "options" && Array.isArray(child)) value[key] = child.map(id => `${namespace}-${String(id)}`);
            else if (typeof child === "string") value[key] = child.replace(/(\{\{\s*state\.)([A-Za-z][A-Za-z0-9_-]*)/g, (match, start: string, id: string) => ids.has(id) ? `${start}${namespace}-${id}` : match);
            else prefix(child, key);
        }
    };
    prefix(fragment.components);
    const workspace: DataWorkspace = { defaultSourceId: entries[0][0], sources };
    const data = sources[workspace.defaultSourceId].data;
    const prepared = prepareSpecification({ version: "2.0", title: fragment.title, components: fragment.components }, data, { repair: false, sourceData: Object.fromEntries(Object.entries(sources).map(([id, source]) => [id, source.data])) });
    if (!prepared.schema) throw new Error(`Invalid fragment: ${prepared.errors.join(" ")}`);
    return { schema: prepared.schema, workspace, data, title: fragment.title };
}
