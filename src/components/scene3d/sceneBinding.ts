import type { NormalizedData } from "../../data/normalizeData";
import { FieldResolver } from "../../fields/fieldResolver";
import { specificationFieldReferences } from "../../fields/specificationFieldReferences";
import { isScene3dKey, type Scene3dBinding, type Scene3dDefinition } from "../../schema/scene3dSchema";
import { scene3dDefinitionKeys, validateScene3dDefinition } from "../../schema/scene3dValidation";

// Includes room for four base64-encoded models at the existing model limit.
// This bounds parsing and cache memory independently of the host's text transport.
export const maxSceneJsonLength = 5 * 1024 * 1024;

type ParsedScene = { definition: Scene3dDefinition } | { message: string };
const invalid = (message: string) => ({ message });

function parseSceneJson(source: string): ParsedScene {
    let value: unknown;
    try {
        value = JSON.parse(source);
    } catch {
        return invalid("SceneJSON is invalid or truncated. Check that Power BI imported the complete text.");
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("SceneJSON must be an object with an objects array.");
    const definition = value as Record<string, unknown>;
    for (const key of Object.keys(definition)) {
        if (!scene3dDefinitionKeys.has(key)) return invalid(`SceneJSON property “${key.slice(0, 80)}” is unsupported. Use scene properties only.`);
    }
    let message: string | undefined;
    validateScene3dDefinition(definition, (property, error) => { message ??= `SceneJSON ${property.slice(0, 120)}: ${error}`; });
    return message ? invalid(message) : { definition: definition as unknown as Scene3dDefinition };
}

export function createSceneJsonCache() {
    const entries = new Map<string, ParsedScene>();
    let length = 0;
    return (source: string): ParsedScene => {
        if (source.length > maxSceneJsonLength) return invalid("SceneJSON is too large for the viewer. Compact the scene or use Direct JSON.");
        const cached = entries.get(source);
        const parsed = cached ?? parseSceneJson(source);
        if (cached) entries.delete(source);
        else length += source.length;
        entries.set(source, parsed);
        while (entries.size > 64 || length > maxSceneJsonLength) {
            const oldest = entries.keys().next().value!;
            entries.delete(oldest);
            length -= oldest.length;
        }
        return parsed;
    };
}

export function createSceneTelemetryResolver() {
    type ResolvedScene = { definition: Scene3dDefinition; warning?: string };
    const cache = new WeakMap<Scene3dDefinition, { signature: string; result: ResolvedScene }>();
    return (definition: Scene3dDefinition, data: NormalizedData, aliases?: Record<string, string>): ResolvedScene => {
        const signature = JSON.stringify([Object.values(data.fields).map(field =>
            [field.key, field.sourceTable, field.sourceColumn, field.displayName, field.dataType, field.queryName]), aliases]);
        const cached = cache.get(definition);
        if (cached?.signature === signature) return cached.result;

        // The field traversal can edit animation and tooltip references in place.
        // Copy those owners so the source definition stays portable in the JSON cache.
        const component = {
            ...definition,
            type: "scene3d",
            objects: definition.objects.map(item => item.animations ? {
                ...item, animations: item.animations.map(animation => ({ ...animation })),
            } : item),
            tooltipFields: definition.tooltipFields?.map(item => typeof item === "string" ? item : { ...item }),
        };
        let resolver: FieldResolver | undefined;
        let changed = false;
        let warning: string | undefined;
        for (const occurrence of specificationFieldReferences({ components: [component] })) {
            const { reference, requirement } = occurrence;
            const key = Object.hasOwn(data.fields, reference) ? reference : (resolver ??= new FieldResolver(data, aliases)).resolve(reference).key;
            const field = key && data.fields[key];
            if (!field) {
                warning ??= `SceneJSON equipment field “${reference}” is unavailable in the viewer dataset.`;
                continue;
            }
            if (requirement === "numeric" && field.dataType && field.dataType !== "unknown" && field.dataType !== "number") {
                warning ??= `SceneJSON equipment field “${reference}” must be numeric.`;
            }
            if (field.key !== reference) {
                occurrence.set(field.key);
                changed = true;
            }
        }
        const { type: _type, ...resolvedDefinition } = component;
        const result = { definition: changed ? resolvedDefinition : definition, warning };
        cache.set(definition, { signature, result });
        return result;
    };
}

export function sceneBindingDiagnostic(binding: Scene3dBinding, fields?: NormalizedData["fields"]): string | undefined {
    if (!fields) return `Scene dataset “${binding.dataset ?? "powerbi"}” is unavailable.`;
    if (!Object.hasOwn(fields, binding.keyField)) return `Station key field “${binding.keyField}” is missing from the scene dataset.`;
    if (!Object.hasOwn(fields, binding.sceneField)) return `Scene JSON field “${binding.sceneField}” is missing from the scene dataset.`;
    const type = fields[binding.sceneField].dataType;
    if (type && type !== "text" && type !== "unknown") return `Scene JSON field “${binding.sceneField}” must be a text column.`;
}

export function resolveBoundScene(
    binding: Scene3dBinding,
    data: NormalizedData | undefined,
    selectedKey: unknown,
    parse: ReturnType<typeof createSceneJsonCache>,
): ParsedScene {
    const diagnostic = sceneBindingDiagnostic(binding, data?.fields);
    if (diagnostic) return invalid(diagnostic);
    if (selectedKey === undefined || selectedKey === null || selectedKey === "") return invalid("Select a station to view its 3D scene.");
    if (!isScene3dKey(selectedKey)) return invalid("Select a single station with a valid text, number, or Boolean key.");
    let match: NormalizedData["rows"][number] | undefined;
    for (const row of data!.rows) {
        if (row[binding.keyField] !== selectedKey) continue;
        if (match) return invalid(`More than one scene row matches station “${selectedKey}”. Use one scene row per station.`);
        match = row;
    }
    if (!match) return invalid(`No scene row matches station “${selectedKey}”.`);
    const source = match[binding.sceneField];
    if (source == null || typeof source === "string" && source.length <= maxSceneJsonLength && !source.trim()) return invalid(`SceneJSON is missing for station “${selectedKey}”.`);
    if (typeof source !== "string") return invalid(`SceneJSON for station “${selectedKey}” must be text.`);
    return parse(source);
}
