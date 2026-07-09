// ── ArcGIS REST Client ───────────────────────────────────────────────
// Handles HTTP requests to ArcGIS REST services using native fetch.
// Never uses ArcGIS SDK. Public services only.
// All external requests use credentials:"omit" and referrerPolicy:"no-referrer"
// to prevent forwarding of cookies, auth headers, or other credentials.

export interface ArcGisRequestOptions {
    signal?: AbortSignal;
    timeoutMs?: number;
    retries?: number;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

/** Security-hardened fetch defaults for all ArcGIS REST requests. */
const SECURE_FETCH_DEFAULTS: RequestInit = {
    credentials: "omit" as RequestCredentials,
    referrerPolicy: "no-referrer" as ReferrerPolicy,
    cache: "no-store" as RequestCache,
};

/**
 * Throw immediately if the caller has already aborted the request.
 * Must be called before each attempt and in error handlers.
 */
function throwIfCallerAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw signal.reason ?? new DOMException("Request was aborted.", "AbortError");
    }
}

export async function getArcGisJson<T>(
    url: string,
    options: ArcGisRequestOptions = {}
): Promise<T> {
    return arcGisRequest<T>(url, { ...SECURE_FETCH_DEFAULTS, method: "GET" }, options);
}

export async function postArcGisForm<T>(
    url: string,
    parameters: Record<string, string>,
    options: ArcGisRequestOptions = {}
): Promise<T> {
    const body = new URLSearchParams(parameters);
    return arcGisRequest<T>(url, {
        ...SECURE_FETCH_DEFAULTS,
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    }, options);
}

async function arcGisRequest<T>(
    url: string,
    init: RequestInit,
    options: ArcGisRequestOptions
): Promise<T> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
    const maxRetries = options.retries ?? DEFAULT_RETRIES;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // ── Before each attempt: stop if caller aborted ────────────
        throwIfCallerAborted(options.signal);

        const controller = new AbortController();
        const combinedSignal = options.signal
            ? anySignal([options.signal, controller.signal])
            : controller.signal;

        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { ...init, signal: combinedSignal });

            if (!response.ok) {
                // Don't retry auth failures
                if (response.status === 401 || response.status === 403 || response.status === 498 || response.status === 499) {
                    const body = await response.text().catch(() => "");
                    throw new ArcGisHttpError(response.status, body, url);
                }

                if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
                    await abortAwareDelay(1000 * (attempt + 1), options.signal);
                    continue;
                }

                const body = await response.text().catch(() => "");
                throw new ArcGisHttpError(response.status, body, url);
            }

            const json = await response.json() as Record<string, unknown>;

            // Check for ArcGIS error responses (HTTP 200 but error object)
            if (json.error) {
                const err = json.error as Record<string, unknown>;
                const code = err.code as number;
                // 498/499 = auth required
                if (code === 498 || code === 499) {
                    throw new ArcGisAuthError(code, (err.message as string) ?? "Authentication required", url);
                }
                throw new ArcGisServiceError(code, (err.message as string) ?? "Unknown service error", url, Array.isArray(err.details) ? err.details.map(String) : []);
            }

            return json as T;
        } catch (error) {
            // ── Caller aborted: do NOT retry ───────────────────────
            if (options.signal?.aborted) {
                throw options.signal.reason ?? new DOMException("Request was aborted.", "AbortError");
            }

            // Don't retry on auth/service errors
            if (error instanceof ArcGisAuthError || error instanceof ArcGisServiceError) {
                throw error;
            }

            // Don't retry if this attempt timed out and it was the last retry
            if (error instanceof DOMException && error.name === "AbortError" && !options.signal?.aborted) {
                if (attempt < maxRetries) {
                    await abortAwareDelay(1000 * (attempt + 1), options.signal);
                    continue;
                }
            }

            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                await abortAwareDelay(1000 * (attempt + 1), options.signal);
                continue;
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }

    throw lastError ?? new Error(`Failed to fetch ${url}`);
}

/** Delay that aborts early if the caller signal is aborted. */
function abortAwareDelay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
            return;
        }
        const timer = setTimeout(resolve, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(signal!.reason ?? new DOMException("Aborted", "AbortError"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}

function anySignal(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort(signal.reason);
            return controller.signal;
        }
        signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
    }
    return controller.signal;
}

// ── Error Types ───────────────────────────────────────────────────────

export class ArcGisHttpError extends Error {
    constructor(
        public status: number,
        public body: string,
        public url: string
    ) {
        super(`HTTP ${status} from ${url}`);
        this.name = "ArcGisHttpError";
    }
}

export class ArcGisAuthError extends Error {
    constructor(
        public code: number,
        message: string,
        public url: string
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
        public details: string[]
    ) {
        super(message);
        this.name = "ArcGisServiceError";
    }
}
