import type { DataSource } from "@hyperpbi/data/dataWorkspace";
import { parseUploadedFile } from "@hyperpbi/data/fileImport";

export async function parseFileInWorker(file: File): Promise<DataSource[]> {
    if (typeof Worker === "undefined") return parseUploadedFile(file);
    return new Promise<DataSource[]>((resolve, reject) => {
        const worker = new Worker(new URL("./workers/fileParser.worker.ts", import.meta.url), { type: "module" });
        const requestId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
        const cleanup = () => worker.terminate();
        worker.onmessage = (event: MessageEvent<{ requestId: string; sources?: DataSource[]; error?: string }>) => {
            if (event.data.requestId !== requestId) return;
            cleanup();
            if (event.data.error) reject(new Error(event.data.error));
            else resolve(event.data.sources ?? []);
        };
        worker.onerror = event => {
            cleanup();
            reject(new Error(event.message || "The file parser worker failed."));
        };
        worker.postMessage({ requestId, file });
    });
}
