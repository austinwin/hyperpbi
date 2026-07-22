/// <reference lib="webworker" />
import { parseUploadedFile } from "@hyperpbi/data/fileImport";

self.onmessage = async (event: MessageEvent<{ requestId: string; file: File }>) => {
    const { requestId, file } = event.data;
    try {
        const sources = await parseUploadedFile(file);
        self.postMessage({ requestId, sources });
    } catch (error) {
        self.postMessage({
            requestId,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
