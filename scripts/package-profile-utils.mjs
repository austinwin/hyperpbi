import { mkdir, open, readFile, stat, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { inflateRawSync } from "node:zlib";

export const DEFAULT_MAP_HOSTS = [
    "https://*.arcgis.com",
    "https://*.arcgisonline.com",
];

export const RESTRICTED_BUILT_IN_HOSTS = [
    "https://tile.openstreetmap.org",
    "https://nominatim.openstreetmap.org",
    "https://geocode-api.arcgis.com",
];

/**
 * Serialize packaging profiles because pbiviz reads fixed workspace files.
 * Without this lock, parallel Core/Maps jobs can package each other's
 * capabilities and provider flags under the wrong archive name.
 */
export async function acquirePackageProfileLock(
    lockPath,
    { timeoutMs = 10 * 60_000, staleMs = 15 * 60_000, pollMs = 100 } = {},
) {
    await mkdir(dirname(lockPath), { recursive: true });
    const started = Date.now();
    while (true) {
        try {
            const handle = await open(lockPath, "wx");
            try {
                await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
            } catch (error) {
                await handle.close();
                await unlink(lockPath).catch(() => undefined);
                throw error;
            }
            const heartbeatIntervalMs = Math.max(10, Math.min(60_000, staleMs / 3));
            const heartbeat = setInterval(() => {
                const timestamp = new Date();
                void handle.utimes(timestamp, timestamp).catch(() => undefined);
            }, heartbeatIntervalMs);
            heartbeat.unref?.();
            let released = false;
            return async () => {
                if (released) return;
                released = true;
                clearInterval(heartbeat);
                await handle.close();
                await unlink(lockPath).catch(error => {
                    if (error?.code !== "ENOENT") throw error;
                });
            };
        } catch (error) {
            if (error?.code !== "EEXIST") throw error;
            try {
                const details = await stat(lockPath);
                if (Date.now() - details.mtimeMs > staleMs) {
                    await unlink(lockPath);
                    continue;
                }
            } catch (inspectionError) {
                if (inspectionError?.code === "ENOENT") continue;
                throw inspectionError;
            }
            if (Date.now() - started >= timeoutMs)
                throw new Error(`Timed out waiting for package profile lock: ${lockPath}`);
            await new Promise(resolve => setTimeout(resolve, pollMs));
        }
    }
}

export function normalizeMapHostPattern(value, { allowBroad = false } = {}) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("Map host patterns must be nonblank strings.");
    }
    const pattern = value.trim();
    if (pattern === "https://*") {
        if (!allowBroad) throw new Error("https://* is allowed only in broad Maps mode.");
        return pattern;
    }
    if (!pattern.toLowerCase().startsWith("https://")) {
        throw new Error(`Map host patterns must use HTTPS: ${pattern}`);
    }

    let parsed;
    try {
        parsed = new URL(pattern);
    } catch {
        throw new Error(`Invalid map host pattern: ${pattern}`);
    }
    if (parsed.protocol !== "https:") throw new Error(`Map host patterns must use HTTPS: ${pattern}`);
    if (parsed.username || parsed.password) throw new Error(`Map host patterns cannot contain credentials: ${pattern}`);
    if (parsed.search) throw new Error(`Map host patterns cannot contain a query: ${pattern}`);
    if (parsed.hash) throw new Error(`Map host patterns cannot contain a hash: ${pattern}`);
    if (parsed.pathname !== "/") throw new Error(`Map host patterns must not contain a path: ${pattern}`);

    const hostname = parsed.hostname.toLowerCase();
    if (hostname.includes("*")) {
        if (!hostname.startsWith("*.") || hostname.slice(2).includes("*")) {
            throw new Error(`Only a leading subdomain wildcard is allowed: ${pattern}`);
        }
        if (hostname.slice(2).split(".").some(part => part.length === 0)) {
            throw new Error(`Invalid subdomain wildcard pattern: ${pattern}`);
        }
    }
    return `https://${hostname}${parsed.port ? `:${parsed.port}` : ""}`;
}

export function parseMapHostPatterns(value, options = {}) {
    const entries = Array.isArray(value) ? value : String(value ?? "").split(",");
    const normalized = entries
        .map(entry => typeof entry === "string" ? entry.trim() : entry)
        .filter(entry => entry !== "")
        .map(entry => normalizeMapHostPattern(entry, options));
    return [...new Set(normalized)];
}

export function buildWebAccessParameters({ profile, allowAllHosts, configuredHosts = [] }) {
    if (profile === "core") return [];
    if (allowAllHosts) return [normalizeMapHostPattern("https://*", { allowBroad: true })];
    return [...new Set([
        ...RESTRICTED_BUILT_IN_HOSTS,
        ...DEFAULT_MAP_HOSTS,
        ...parseMapHostPatterns(configuredHosts),
    ])];
}

export async function readZipEntries(archivePath) {
    const archive = await readFile(archivePath);
    let eocdOffset = -1;
    for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 65_557); offset--) {
        if (archive.readUInt32LE(offset) === 0x06054b50) {
            eocdOffset = offset;
            break;
        }
    }
    if (eocdOffset < 0) throw new Error(`ZIP end-of-central-directory not found: ${archivePath}`);

    const entryCount = archive.readUInt16LE(eocdOffset + 10);
    let centralOffset = archive.readUInt32LE(eocdOffset + 16);
    const entries = new Map();

    for (let index = 0; index < entryCount; index++) {
        if (archive.readUInt32LE(centralOffset) !== 0x02014b50) {
            throw new Error(`Invalid ZIP central directory in ${archivePath}`);
        }
        const compressionMethod = archive.readUInt16LE(centralOffset + 10);
        const compressedSize = archive.readUInt32LE(centralOffset + 20);
        const fileNameLength = archive.readUInt16LE(centralOffset + 28);
        const extraLength = archive.readUInt16LE(centralOffset + 30);
        const commentLength = archive.readUInt16LE(centralOffset + 32);
        const localOffset = archive.readUInt32LE(centralOffset + 42);
        const fileName = archive.subarray(centralOffset + 46, centralOffset + 46 + fileNameLength).toString("utf8");

        if (archive.readUInt32LE(localOffset) !== 0x04034b50) {
            throw new Error(`Invalid ZIP local header for ${fileName}`);
        }
        const localNameLength = archive.readUInt16LE(localOffset + 26);
        const localExtraLength = archive.readUInt16LE(localOffset + 28);
        const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
        const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
        const content = compressionMethod === 0
            ? Buffer.from(compressed)
            : compressionMethod === 8
                ? inflateRawSync(compressed)
                : undefined;
        if (!content) throw new Error(`Unsupported ZIP compression method ${compressionMethod} for ${fileName}`);
        entries.set(fileName, content);
        centralOffset += 46 + fileNameLength + extraLength + commentLength;
    }
    return entries;
}

export async function readPackagedCapabilities(archivePath) {
    const entries = await readZipEntries(archivePath);
    const manifestEntry = [...entries.entries()].find(([name]) =>
        /^resources\/[^/]+\.pbiviz\.json$/.test(name)
    );
    if (!manifestEntry) throw new Error(`Packaged PBIVIZ manifest not found in ${archivePath}`);
    const manifest = JSON.parse(manifestEntry[1].toString("utf8"));
    if (!manifest.capabilities || typeof manifest.capabilities !== "object") {
        throw new Error(`Packaged capabilities.json payload not found in ${archivePath}`);
    }
    return manifest.capabilities;
}

export function webAccessParameters(capabilities) {
    const privilege = (capabilities.privileges ?? []).find(item => item?.name === "WebAccess");
    return privilege?.parameters ?? null;
}
