// ArcGIS REST requests use native fetch so the visual remains SDK-free.
// Credentials and referrers are intentionally omitted for every request.

export interface ArcGisRequestOptions {
    signal?: AbortSignal;
    timeoutMs?: number;
    retries?: number;
}

export interface ArcGisBlobResponse {
    blob: Blob;
    contentType: string;
}

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 2;
const MAX_RETRIES = 5;
const MAX_RETRY_DELAY = 10_000;
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const SECURE_FETCH_DEFAULTS: RequestInit = {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
};

function abortReason(signal: AbortSignal): unknown {
    return signal.reason ?? new DOMException("Request was aborted.", "AbortError");
}

function throwIfCallerAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw abortReason(signal);
}

export async function getArcGisJson<T>(
    url: string,
    options: ArcGisRequestOptions = {},
): Promise<T> {
    return arcGisRequest(url, { ...SECURE_FETCH_DEFAULTS, method: "GET" }, options, async response => {
        const json = await response.json() as Record<string, unknown>;
        throwForArcGisError(json, url);
        return json as T;
    });
}

export async function postArcGisForm<T>(
    url: string,
    parameters: Record<string, string>,
    options: ArcGisRequestOptions = {},
): Promise<T> {
    const body = new URLSearchParams(parameters);
    return arcGisRequest(url, {
        ...SECURE_FETCH_DEFAULTS,
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    }, options, async response => {
        const json = await response.json() as Record<string, unknown>;
        throwForArcGisError(json, url);
        return json as T;
    });
}

/** Fetch an ArcGIS image response through the same retry/cancellation policy. */
export async function getArcGisBlob(
    url: string,
    options: ArcGisRequestOptions = {},
): Promise<ArcGisBlobResponse> {
    return arcGisRequest(url, { ...SECURE_FETCH_DEFAULTS, method: "GET" }, options, async response => {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json") || contentType.includes("text/")) {
            const body = await response.text();
            let json: Record<string, unknown> | undefined;
            try {
                json = JSON.parse(body) as Record<string, unknown>;
            } catch {
                // The safe error deliberately excludes response bodies and URLs.
            }
            if (json) throwForArcGisError(json, url);
            throw new ArcGisInvalidResponseError("The ArcGIS image endpoint returned a non-image response.");
        }
        return { blob: await response.blob(), contentType };
    });
}

async function arcGisRequest<T>(
    url: string,
    init: RequestInit,
    options: ArcGisRequestOptions,
    parse: (response: Response) => Promise<T>,
): Promise<T> {
    const requestedTimeout = Number(options.timeoutMs ?? DEFAULT_TIMEOUT);
    const timeoutMs = Number.isFinite(requestedTimeout)
        ? Math.max(1_000, Math.min(120_000, requestedTimeout))
        : DEFAULT_TIMEOUT;
    const requestedRetries = Number(options.retries ?? DEFAULT_RETRIES);
    const maxRetries = Number.isFinite(requestedRetries)
        ? Math.max(0, Math.min(MAX_RETRIES, Math.floor(requestedRetries)))
        : DEFAULT_RETRIES;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        throwIfCallerAborted(options.signal);

        const controller = new AbortController();
        let timedOut = false;
        const forwardAbort = () => controller.abort(abortReason(options.signal!));
        options.signal?.addEventListener("abort", forwardAbort, { once: true });
        const timeoutId = setTimeout(() => {
            timedOut = true;
            controller.abort(new DOMException("The ArcGIS request timed out.", "TimeoutError"));
        }, timeoutMs);

        let retryAfterMs: number | undefined;
        try {
            const response = await fetch(url, { ...init, signal: controller.signal });
            if (!response.ok) {
                const body = await response.text().catch(() => "");
                retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
                throw new ArcGisHttpError(response.status, body, url, retryAfterMs);
            }
            return await parse(response);
        } catch (error) {
            if (options.signal?.aborted) throw abortReason(options.signal);
            const normalized = timedOut
                ? new ArcGisTimeoutError(timeoutMs)
                : error instanceof Error
                    ? error
                    : new Error(String(error));
            if (attempt >= maxRetries || !isRetryableError(normalized)) throw normalized;
            await abortAwareDelay(
                retryAfterMs ?? Math.min(MAX_RETRY_DELAY, 1_000 * (attempt + 1)),
                options.signal,
            );
        } finally {
            clearTimeout(timeoutId);
            options.signal?.removeEventListener("abort", forwardAbort);
        }
    }

    throw new Error("ArcGIS request retry loop exited unexpectedly.");
}

function throwForArcGisError(json: Record<string, unknown>, url: string): void {
    if (!json.error || typeof json.error !== "object") return;
    const error = json.error as Record<string, unknown>;
    const code = Number(error.code);
    const message = typeof error.message === "string" ? error.message : "Unknown service error";
    const details = Array.isArray(error.details) ? error.details.map(String) : [];
    if (code === 498 || code === 499)
        throw new ArcGisAuthError(code, message, url);
    throw new ArcGisServiceError(code, message, url, details);
}

function isRetryableError(error: Error): boolean {
    if (error instanceof ArcGisTimeoutError || error instanceof ArcGisInvalidResponseError)
        return true;
    if (error instanceof ArcGisHttpError) return RETRYABLE_STATUSES.has(error.status);
    if (error instanceof ArcGisServiceError) return RETRYABLE_STATUSES.has(error.code);
    if (error instanceof ArcGisAuthError) return false;
    if (error instanceof DOMException && error.name === "AbortError") return false;
    // Native fetch rejects network/CORS failures with TypeError. SyntaxError can
    // represent a transient proxy response that was not valid JSON.
    return error instanceof TypeError || error instanceof SyntaxError;
}

function parseRetryAfter(value: string | null): number | undefined {
    if (!value) return undefined;
    const seconds = Number(value);
    if (Number.isFinite(seconds))
        return Math.max(0, Math.min(MAX_RETRY_DELAY, seconds * 1_000));
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return undefined;
    return Math.max(0, Math.min(MAX_RETRY_DELAY, timestamp - Date.now()));
}

/** A retry delay that always removes its abort listener when it settles. */
function abortAwareDelay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(abortReason(signal));
            return;
        }
        let settled = false;
        const finish = (callback: () => void) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            signal?.removeEventListener("abort", onAbort);
            callback();
        };
        const onAbort = () => finish(() => reject(abortReason(signal!)));
        const timer = setTimeout(() => finish(resolve), Math.max(0, ms));
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}

export class ArcGisHttpError extends Error {
    constructor(
        public status: number,
        public body: string,
        public url: string,
        public retryAfterMs?: number,
    ) {
        super(`HTTP ${status} from ${url}`);
        this.name = "ArcGisHttpError";
    }
}

export class ArcGisAuthError extends Error {
    constructor(
        public code: number,
        message: string,
        public url: string,
    ) {
        super(message);
        this.name = "ArcGisAuthError";
    }
}

export class ArcGisServiceError extends Error {
    constructor(
        public code: number,
        message: string,
        public url: string,
        public details: string[],
    ) {
        super(message);
        this.name = "ArcGisServiceError";
    }
}

export class ArcGisTimeoutError extends Error {
    constructor(public timeoutMs: number) {
        super(`The ArcGIS request timed out after ${timeoutMs}ms.`);
        this.name = "ArcGisTimeoutError";
    }
}

export class ArcGisInvalidResponseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ArcGisInvalidResponseError";
    }
}
