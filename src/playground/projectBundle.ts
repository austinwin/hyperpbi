import { parseConfig } from "../config/hyperpbiConfig";
import { defaultWorkspaceData, validateDataWorkspace, workspaceSourceData } from "../data/dataWorkspace";
import { prepareSpecification } from "../schema/prepareSpecification";
import { parseJson } from "../utils/safeJson";
import { canonicalJson } from "./canonicalJson";
import {
    createProjectId,
    HYPERPBI_PROJECT_FORMAT,
    HYPERPBI_PROJECT_FORMAT_VERSION,
    type HyperPbiProject
} from "./project";

export interface ProjectImportResult {
    project?: HyperPbiProject;
    errors: string[];
}

const record = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function exportProjectBundle(project: HyperPbiProject): string {
    return canonicalJson(project);
}

export function importProjectBundle(text: string): ProjectImportResult {
    const parsed = parseJson(text);
    if (parsed.error) return { errors: [`Project JSON: ${parsed.error}`] };
    if (!record(parsed.value)) return { errors: ["The project bundle must be a JSON object."] };
    const value = parsed.value as unknown as Partial<HyperPbiProject>;
    const errors: string[] = [];
    if (value.format !== HYPERPBI_PROJECT_FORMAT) errors.push("This is not a HyperPBI Playground project bundle.");
    if (value.formatVersion !== HYPERPBI_PROJECT_FORMAT_VERSION) errors.push(`Unsupported project format version: ${String(value.formatVersion)}.`);
    if (!record(value.metadata) || typeof value.metadata.name !== "string") errors.push("Project metadata is missing or invalid.");
    if (!record(value.specification)) errors.push("The project specification is missing.");
    if (!record(value.runtimeConfiguration)) errors.push("The runtime configuration is missing.");
    if (!record(value.editorState)) errors.push("The editor state is missing.");
    if (!record(value.dataWorkspace) || !record(value.dataWorkspace.sources)) errors.push("The data workspace is missing.");
    if (errors.length) return { errors };

    const project = value as HyperPbiProject;
    errors.push(...validateDataWorkspace(project.dataWorkspace));
    const config = parseConfig(JSON.stringify(project.runtimeConfiguration));
    errors.push(...config.errors);
    const prepared = prepareSpecification(project.specification, defaultWorkspaceData(project.dataWorkspace), {
        repair: false,
        aliasOverrides: config.config?.fields?.aliases,
        sourceData: workspaceSourceData(project.dataWorkspace)
    });
    errors.push(...prepared.errors);
    if (errors.length || !prepared.schema || !config.config) return { errors: Array.from(new Set(errors)) };

    const now = new Date().toISOString();
    return {
        project: {
            ...project,
            metadata: {
                ...project.metadata,
                id: createProjectId(),
                name: `${project.metadata.name} (Imported)`,
                createdAt: now,
                updatedAt: now
            },
            specification: prepared.schema,
            runtimeConfiguration: config.config
        },
        errors: []
    };
}
