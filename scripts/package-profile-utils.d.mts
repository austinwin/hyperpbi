export const DEFAULT_MAP_HOSTS: string[];
export const RESTRICTED_BUILT_IN_HOSTS: string[];
export function acquirePackageProfileLock(
    lockPath: string,
    options?: { timeoutMs?: number; staleMs?: number; pollMs?: number },
): Promise<() => Promise<void>>;
export function normalizeMapHostPattern(value: string, options?: { allowBroad?: boolean }): string;
export function parseMapHostPatterns(value: string | string[], options?: { allowBroad?: boolean }): string[];
export function buildWebAccessParameters(options: { profile: "core" | "maps"; allowAllHosts: boolean; configuredHosts?: string[] }): string[];
export function readZipEntries(archivePath: string): Promise<Map<string, Buffer>>;
export function readPackagedCapabilities(archivePath: string): Promise<Record<string, unknown> & { privileges?: Array<{ name?: string; parameters?: string[] }> }>;
export function webAccessParameters(capabilities: { privileges?: Array<{ name?: string; parameters?: string[] }> }): string[] | null;
