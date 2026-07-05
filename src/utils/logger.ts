export interface Logger { debug(message: string, detail?: unknown): void; warn(message: string, detail?: unknown): void; error(message: string, detail?: unknown): void; }
export const logger: Logger = {
    debug: (message, detail) => { if (detail !== undefined) console.debug(`[HyperPBI] ${message}`, detail); },
    warn: (message, detail) => console.warn(`[HyperPBI] ${message}`, detail ?? ""),
    error: (message, detail) => console.error(`[HyperPBI] ${message}`, detail ?? "")
};
