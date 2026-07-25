export const DEFAULT_MAP_HOSTS: string[];
export function acquirePackageProfileLock(
    lockPath: string,
    options?: { timeoutMs?: number; staleMs?: number; pollMs?: number },
): Promise<() => Promise<void>>;
export function normalizeMapHostPattern(value: string): string;
export function parseMapHostPatterns(value: string | string[]): string[];
export function buildWebAccessParameters(options: { profile: "core" | "maps"; configuredHosts?: string[] }): string[];
export function readZipEntries(archivePath: string): Promise<Map<string, Buffer>>;
export function readPackagedCapabilities(archivePath: string): Promise<Record<string, unknown> & { privileges?: Array<{ name?: string; parameters?: string[] }> }>;
export function webAccessParameters(capabilities: { privileges?: Array<{ name?: string; parameters?: string[] }> }): string[] | null;
