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
                    await delay(1000 * (attempt + 1));
                    continue;
                }

                const body = await response.text().catch(() => "");
                throw new ArcGisHttpError(response.status, body, url);
            }

            const json = await response.json() as any;

            // Check for ArcGIS error responses (HTTP 200 but error object)
            if (json.error) {
                const code = json.error.code;
                // 498/499 = auth required
                if (code === 498 || code === 499) {
                    throw new ArcGisAuthError(code, json.error.message ?? "Authentication required", url);
                }
                throw new ArcGisServiceError(code, json.error.message ?? "Unknown service error", url, json.error.details ?? []);
            }

            return json as T;
        } catch (error) {
            // Don't retry on auth/service errors
            if (error instanceof ArcGisAuthError || error instanceof ArcGisServiceError) {
                throw error;
            }

            // Don't retry if aborted by caller
            if (error instanceof DOMException && error.name === "AbortError" && !controller.signal.aborted) {
                if (attempt < maxRetries) {
                    await delay(1000 * (attempt + 1));
                    continue;
                }
            }

            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                await delay(1000 * (attempt + 1));
                continue;
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }

    throw lastError ?? new Error(`Failed to fetch ${url}`);
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
