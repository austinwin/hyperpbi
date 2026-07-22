import { defaultConfig, type HyperPbiConfig } from "../config/hyperpbiConfig";
import { createEmptyDataWorkspace, type DataWorkspace } from "../data/dataWorkspace";
import { defaultSchema } from "../schema/defaultSchema";
import type { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { defaultStudioLayout } from "../editor/studioLayout";

export const HYPERPBI_PROJECT_FORMAT = "hyperpbi-playground-project";
export const HYPERPBI_PROJECT_FORMAT_VERSION = 1 as const;

export interface PlaygroundProjectMetadata {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface PlaygroundEditorState {
    studioLayout: string;
    draftSpecification?: string;
    draftRuntimeConfiguration?: string;
}

export interface HyperPbiProject {
    format: typeof HYPERPBI_PROJECT_FORMAT;
    formatVersion: typeof HYPERPBI_PROJECT_FORMAT_VERSION;
    metadata: PlaygroundProjectMetadata;
    specification: HyperPbiSchema;
    runtimeConfiguration: HyperPbiConfig;
    editorState: PlaygroundEditorState;
    dataWorkspace: DataWorkspace;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createProjectId(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(bytes);
    return `project_${Date.now()}_${Array.from(bytes).map(value => value.toString(36)).join("")}`;
}

export function createPlaygroundProject(name = "Untitled project"): HyperPbiProject {
    const now = new Date().toISOString();
    return {
        format: HYPERPBI_PROJECT_FORMAT,
        formatVersion: HYPERPBI_PROJECT_FORMAT_VERSION,
        metadata: { id: createProjectId(), name: name.trim() || "Untitled project", createdAt: now, updatedAt: now },
        specification: clone(defaultSchema),
        runtimeConfiguration: clone(defaultConfig),
        editorState: { studioLayout: JSON.stringify(defaultStudioLayout) },
        dataWorkspace: createEmptyDataWorkspace()
    };
}

export function touchProject(project: HyperPbiProject): HyperPbiProject {
    return { ...project, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } };
}
