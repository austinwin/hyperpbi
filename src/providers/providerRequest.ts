import type { ProviderRequestErrorCode } from "./providerTypes";

export class ProviderRequestError extends Error {
    constructor(readonly code: ProviderRequestErrorCode, message: string) {
        super(message);
        this.name = "ProviderRequestError";
    }
}

export function providerErrorMessage(error: unknown): string {
    if (error instanceof ProviderRequestError) return error.message;
    return "The provider request failed because of a network or browser CORS restriction.";
}

export async function providerFetch(
    url: string,
    init: RequestInit = {},
    timeoutMs = 12_000,
): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;
    const forwardAbort = () => controller.abort(
        init.signal?.reason ?? new DOMException("The provider request was aborted.", "AbortError"),
    );
    if (init.signal?.aborted) forwardAbort();
    else init.signal?.addEventListener("abort", forwardAbort, { once: true });
    const requestedTimeout = Number(timeoutMs);
    const safeTimeout = Number.isFinite(requestedTimeout)
        ? Math.max(1_000, Math.min(15_000, requestedTimeout))
        : 12_000;
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort(new DOMException("The provider request timed out.", "TimeoutError"));
    }, safeTimeout);
    try {
        let response: Response;
        try {
            response = await fetch(url, {
                ...init,
                credentials: "omit",
                referrerPolicy: "no-referrer",
                cache: "no-store",
                signal: controller.signal,
            });
        } catch (error) {
            if (timedOut)
                throw new ProviderRequestError("TIMEOUT", "The geocoder request timed out.");
            if (init.signal?.aborted)
                throw init.signal.reason ?? error;
            throw new ProviderRequestError(
                "NETWORK_OR_CORS",
                "The geocoder request failed because of a network or browser CORS restriction.",
            );
        }
        if (response.status === 401 || response.status === 403)
            throw new ProviderRequestError("AUTHENTICATION_FAILED", `The geocoder rejected access (HTTP ${response.status}).`);
        if (response.status === 429)
            throw new ProviderRequestError("RATE_LIMITED", "The geocoder rate limit was reached (HTTP 429).");
        if (!response.ok)
            throw new ProviderRequestError("INVALID_RESPONSE", `The geocoder returned HTTP ${response.status}.`);
        return response;
    } finally {
        clearTimeout(timer);
        init.signal?.removeEventListener("abort", forwardAbort);
    }
}
