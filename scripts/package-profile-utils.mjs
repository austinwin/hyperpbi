import { mkdir, open, readFile, stat, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { inflateRawSync } from "node:zlib";

export const DEFAULT_MAP_HOSTS = [
    "https://tile.openstreetmap.org",
    "https://nominatim.openstreetmap.org",
    "https://geocode-api.arcgis.com",
    "https://*.arcgis.com",
    "https://*.arcgisonline.com",
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
            let heartbeatUpdate = Promise.resolve();
            const heartbeat = setInterval(() => {
                const timestamp = new Date();
                heartbeatUpdate = heartbeatUpdate
                    .then(() => handle.utimes(timestamp, timestamp))
                    .catch(() => undefined);
            }, heartbeatIntervalMs);
            heartbeat.unref?.();
            let released = false;
            return async () => {
                if (released) return;
                released = true;
                clearInterval(heartbeat);
                await heartbeatUpdate;
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
                    if (await packageLockOwnerIsRunning(lockPath)) {
                        if (Date.now() - started >= timeoutMs)
                            throw new Error(`Timed out waiting for package profile lock: ${lockPath}`);
                        await new Promise(resolve => setTimeout(resolve, pollMs));
                        continue;
                    }
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

async function packageLockOwnerIsRunning(lockPath) {
    try {
        const payload = JSON.parse(await readFile(lockPath, "utf8"));
        if (!Number.isInteger(payload?.pid) || payload.pid <= 0) return false;
        if (process.platform === "win32") return false;
        try {
            process.kill(payload.pid, 0);
            return true;
        } catch (error) {
            return error?.code === "EPERM";
        }
    } catch {
        return false;
    }
}

export function buildWebAccessParameters(profile, configuredHosts = []) {
    if (profile === "core") return [];
    const requested = Array.from(new Set([...DEFAULT_MAP_HOSTS, ...configuredHosts]));
    if (profile === "maps-restricted") {
        return requested.filter(host => host === "https://tile.openstreetmap.org");
    }
    return requested;
}

export function webAccessParameters(capabilities) {
    const privilege = capabilities?.privileges?.find(item => item?.name === "WebAccess");
    return privilege ? privilege.parameters ?? [] : null;
}

export async function readPackagedCapabilities(archivePath) {
    const archive = await readFile(archivePath);
    const entries = readZipEntries(archive);
    const resource = entries.find(entry => entry.name.endsWith(".pbiviz.json"));
    if (!resource) throw new Error(`No .pbiviz.json resource found in ${archivePath}.`);
    const payload = JSON.parse(resource.data.toString("utf8"));
    const capabilities = payload?.capabilities;
    if (!capabilities || typeof capabilities !== "object") {
        throw new Error(`PBIVIZ resource in ${archivePath} does not contain capabilities.`);
    }
    return capabilities;
}

function readZipEntries(buffer) {
    const entries = [];
    let offset = 0;
    while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
        const flags = buffer.readUInt16LE(offset + 6);
        const method = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const nameLength = buffer.readUInt16LE(offset + 26);
        const extraLength = buffer.readUInt16LE(offset + 28);
        if (flags & 0x08) throw new Error("Unsupported ZIP data descriptor in PBIVIZ archive.");
        const nameStart = offset + 30;
        const nameEnd = nameStart + nameLength;
        const dataStart = nameEnd + extraLength;
        const dataEnd = dataStart + compressedSize;
        if (dataEnd > buffer.length) throw new Error("Truncated PBIVIZ archive.");
        const name = buffer.subarray(nameStart, nameEnd).toString("utf8");
        const compressed = buffer.subarray(dataStart, dataEnd);
        let data;
        if (method === 0) data = Buffer.from(compressed);
        else if (method === 8) data = inflateRawSync(compressed);
        else throw new Error(`Unsupported ZIP compression method ${method} in PBIVIZ archive.`);
        if (uncompressedSize && data.length !== uncompressedSize) {
            throw new Error(`PBIVIZ ZIP size mismatch for ${name}.`);
        }
        entries.push({ name, data });
        offset = dataEnd;
    }
    return entries;
}
