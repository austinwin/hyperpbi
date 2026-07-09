// ── ArcGIS Error Resolver ────────────────────────────────────────────
// Maps common ArcGIS service errors to clear, actionable messages.

import { ArcGisAuthError, ArcGisServiceError, ArcGisHttpError } from "./arcGisRestClient";

export function resolveArcGisError(error: unknown): string {
    if (error instanceof ArcGisAuthError) {
        if (error.code === 498 || error.code === 499) {
            return "This service requires ArcGIS authentication. HyperPBI currently supports public ArcGIS REST layers only.";
        }
        return error.message;
    }

    if (error instanceof ArcGisHttpError) {
        if (error.status === 401 || error.status === 403) {
            return "This service is not publicly accessible. Check that the layer is shared with everyone.";
        }
        if (error.status === 404) {
            return "The service URL was not found. Verify the FeatureServer or MapServer URL.";
        }
        return `The browser could not access the service (HTTP ${error.status}). The service may require CORS configuration or Power BI WebAccess approval.`;
    }

    if (error instanceof ArcGisServiceError) {
        if (error.code === -2147217394) {
            return "The query was rejected by the service. The specified fields or WHERE clause may be invalid.";
        }
        return `Service error (${error.code}): ${error.message}`;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
        return "The request was cancelled.";
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
        return "The browser could not access the service. This may be due to CORS, network, or Power BI WebAccess restrictions.";
    }

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        return "The browser could not access the service. Verify the URL, CORS configuration, and Power BI WebAccess settings.";
    }

    return `Unexpected error: ${message}`;
}

export function isArcGisAuthError(error: unknown): boolean {
    return error instanceof ArcGisAuthError;
}

export function isArcGisNetworkError(error: unknown): boolean {
    return error instanceof TypeError && (
        error.message.includes("fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Failed to fetch")
    );
}
