import type { HyperPbiConfig } from "../config/hyperpbiConfig";
import { defaultWorkspaceData, workspaceSourceData, type DataWorkspace } from "../data/dataWorkspace";
import type { DatasetDefinition } from "../data/datasets";
import { prepareSpecification } from "../schema/prepareSpecification";
import type { HyperPbiSchema } from "../schema/hyperpbiSchema";

export type PowerBiPortability =
    | "compatible"
    | "compatible-after-default-source-rewrite"
    | "not-fully-portable";

export interface PortabilityIssue {
    code: string;
    severity: "warning" | "error";
    message: string;
    action: string;
}

export interface PowerBiPortabilityResult {
    status: PowerBiPortability;
    issues: PortabilityIssue[];
    powerBiSpecification?: HyperPbiSchema;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function scanBrowserOnly(value: unknown, issues: PortabilityIssue[], path = ""): void {
    if (Array.isArray(value)) {
        value.forEach((item, index) => scanBrowserOnly(item, issues, `${path}/${index}`));
        return;
    }
    if (!object(value)) return;
    const type = typeof value.type === "string" ? value.type : "";
    if (["fileUpload", "browserDownload", "clipboardWrite"].includes(type) || value.browserOnly === true) {
        issues.push({
            code: "BROWSER_ONLY_FEATURE",
            severity: "error",
            message: `${path || "/"} uses browser-only feature “${type || "browserOnly"}”.`,
            action: "Remove the browser-only feature or keep this project in the web host."
        });
    }
    Object.entries(value).forEach(([key, child]) => scanBrowserOnly(child, issues, `${path}/${key}`));
}

function rootSource(
    datasetName: string,
    definitions: Record<string, DatasetDefinition>,
    seen = new Set<string>()
): string | undefined {
    if (seen.has(datasetName)) return undefined;
    seen.add(datasetName);
    const definition = definitions[datasetName];
    if (!definition) return undefined;
    if (definition.source === "powerbi" || !definitions[definition.source]) return definition.source;
    return rootSource(definition.source, definitions, seen);
}

export function rewriteDefaultSourceForPowerBi(
    specification: HyperPbiSchema,
    defaultSourceId: string
): HyperPbiSchema {
    const rewritten = clone(specification);
    for (const definition of Object.values(rewritten.data?.datasets ?? {})) {
        if (definition.source === defaultSourceId) definition.source = "powerbi";
    }
    return rewritten;
}

export function analyzePowerBiPortability(
    specification: HyperPbiSchema,
    configuration: HyperPbiConfig,
    workspace: DataWorkspace
): PowerBiPortabilityResult {
    const issues: PortabilityIssue[] = [];
    const definitions = specification.data?.datasets ?? {};
    const roots = new Set<string>();
    let requiresRewrite = false;

    for (const [name, definition] of Object.entries(definitions)) {
        const root = rootSource(name, definitions);
        if (!root) continue;
        roots.add(root);
        if (root === workspace.defaultSourceId) requiresRewrite = true;
        if (root !== "powerbi" && root !== workspace.defaultSourceId) {
            issues.push({
                code: "INDEPENDENT_UPLOADED_SOURCE",
                severity: "error",
                message: `Dataset “${name}” depends on uploaded source “${root}”, not the selected default source.`,
                action: "Rebuild this dataset from the selected default source, or keep it as a Playground-only project."
            });
        } else if (definition.source === workspace.defaultSourceId) {
            issues.push({
                code: "DEFAULT_SOURCE_REWRITE_AVAILABLE",
                severity: "warning",
                message: `Dataset “${name}” directly references the selected browser source.`,
                action: "Use the Power BI-compatible export to rewrite that source to “powerbi”."
            });
        }
    }
    const independentRoots = [...roots].filter(root => root !== "powerbi" && root !== workspace.defaultSourceId);
    if (independentRoots.length || roots.size > 1 && independentRoots.length) {
        issues.push({
            code: "MULTIPLE_SOURCE_DEPENDENCY",
            severity: "error",
            message: "The specification depends on multiple independent uploaded sources; one Power BI custom visual receives only one flattened data view.",
            action: "Consolidate the data before it reaches HyperPBI. Do not rewrite separate sources into one."
        });
    }

    for (const source of Object.values(workspace.sources)) {
        for (const field of Object.values(source.data.fields)) {
            if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field.key)) {
                issues.push({
                    code: "MISSING_FIELD_ALIAS",
                    severity: "error",
                    message: `Field “${field.displayName || field.key}” does not have a portable deterministic alias.`,
                    action: "Assign a simple unique field alias before exporting."
                });
            }
        }
    }

    scanBrowserOnly(specification, issues);
    const rewritten = requiresRewrite
        ? rewriteDefaultSourceForPowerBi(specification, workspace.defaultSourceId)
        : clone(specification);
    const prepared = prepareSpecification(rewritten, defaultWorkspaceData(workspace), {
        repair: false,
        aliasOverrides: configuration.fields?.aliases,
        sourceData: workspaceSourceData(workspace)
    });
    prepared.errors.forEach(message => issues.push({
        code: "INVALID_FIELD_BINDING",
        severity: "error",
        message,
        action: "Repair the referenced field or dataset in Studio before exporting."
    }));

    const externalFilters: string[] = [];
    const visit = (value: unknown): void => {
        if (Array.isArray(value)) return value.forEach(visit);
        if (!object(value)) return;
        if (object(value.interaction) && value.interaction.externalMode === "filter") {
            externalFilters.push(String(value.id ?? value.type ?? "component"));
        }
        Object.values(value).forEach(visit);
    };
    visit(specification);
    if (externalFilters.length) issues.push({
        code: "HOST_FILTER_BINDING_REVIEW",
        severity: "warning",
        message: `External filter actions in ${externalFilters.join(", ")} require real Power BI model-column targets.`,
        action: "Verify Runtime Configuration aliases map these fields to bound Power BI columns."
    });

    const hasErrors = issues.some(issue => issue.severity === "error");
    return {
        status: hasErrors ? "not-fully-portable" : requiresRewrite ? "compatible-after-default-source-rewrite" : "compatible",
        issues,
        powerBiSpecification: hasErrors ? undefined : rewritten
    };
}
