import { parseConfig, type HyperPbiConfig } from "../config/hyperpbiConfig";
import { defaultWorkspaceData, workspaceSourceData, type DataWorkspace } from "../data/dataWorkspace";
import { parseCsvText } from "../data/fileImport";
import { prepareSpecification } from "../schema/prepareSpecification";
import type { HyperPbiSchema } from "../schema/hyperpbiSchema";
import {
    analyzePowerBiPortability,
    type PowerBiPortabilityResult,
} from "./powerBiPortability";
import { createPlaygroundProject, type HyperPbiProject } from "./project";

export interface DashboardExampleTemplate {
    id: string;
    title: string;
    specification: unknown;
    runtimeConfiguration: unknown;
    csvText: string;
    dataFileName?: string;
}

export interface DashboardExampleInstantiationOptions {
    projectId?: string;
    createdAt?: string;
    updatedAt?: string;
    requirePowerBiCompatible?: boolean;
}

export interface InstantiatedDashboardExample {
    project: HyperPbiProject;
    portability: PowerBiPortabilityResult;
    warnings: string[];
}

export class DashboardExampleInstantiationError extends Error {
    constructor(readonly errors: string[]) {
        super(errors.join("\n"));
        this.name = "DashboardExampleInstantiationError";
    }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Turns static example assets into the same complete local project used by the
 * Playground. This module intentionally has no DOM, filesystem, Vite, or Next
 * dependencies so any host can provide manifest assets and instantiate them.
 */
export function instantiateDashboardExample(
    template: DashboardExampleTemplate,
    options: DashboardExampleInstantiationOptions = {},
): InstantiatedDashboardExample {
    const errors: string[] = [];
    if (!/^[a-z][a-z0-9-]*$/.test(template.id)) {
        errors.push("Dashboard example ids must be lowercase kebab-case identifiers.");
    }
    if (!template.title.trim()) errors.push("Dashboard examples require a title.");

    const configurationResult = parseConfig(JSON.stringify(template.runtimeConfiguration));
    errors.push(...configurationResult.errors.map(message => `Runtime Configuration: ${message}`));

    let workspace: DataWorkspace | undefined;
    try {
        const source = parseCsvText(template.csvText, template.dataFileName ?? "data.csv");
        workspace = {
            defaultSourceId: source.id,
            sources: { [source.id]: source },
        };
    } catch (error) {
        errors.push(`Dataset: ${error instanceof Error ? error.message : String(error)}`);
    }

    let specification: HyperPbiSchema | undefined;
    let warnings: string[] = [];
    if (workspace && configurationResult.config) {
        const prepared = prepareSpecification(clone(template.specification), defaultWorkspaceData(workspace), {
            repair: false,
            aliasOverrides: configurationResult.config.fields?.aliases,
            sourceData: workspaceSourceData(workspace),
        });
        errors.push(...prepared.errors.map(message => `Specification: ${message}`));
        warnings = prepared.warnings;
        if (prepared.schema) specification = clone(template.specification) as HyperPbiSchema;
    }
    if (errors.length || !workspace || !configurationResult.config || !specification) {
        throw new DashboardExampleInstantiationError(Array.from(new Set(errors)));
    }

    const portability = analyzePowerBiPortability(
        specification,
        configurationResult.config,
        workspace,
    );
    if ((options.requirePowerBiCompatible ?? true) && portability.status !== "compatible") {
        throw new DashboardExampleInstantiationError([
            `Example “${template.id}” is ${portability.status}, not directly Power BI compatible.`,
            ...portability.issues.map(issue => `${issue.code}: ${issue.message}`),
        ]);
    }

    const project = createPlaygroundProject(template.title);
    const createdAt = options.createdAt ?? new Date().toISOString();
    project.metadata = {
        id: options.projectId ?? project.metadata.id,
        name: template.title,
        createdAt,
        updatedAt: options.updatedAt ?? createdAt,
    };
    project.specification = specification;
    project.runtimeConfiguration = configurationResult.config as HyperPbiConfig;
    project.dataWorkspace = workspace;

    return { project, portability, warnings };
}
