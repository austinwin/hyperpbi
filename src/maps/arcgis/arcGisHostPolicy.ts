// ── ArcGIS Host Policy ───────────────────────────────────────────────
// Determines whether a given ArcGIS service host is permitted by the
// HyperPBI package's Power BI WebAccess configuration.
//
// Supports:
//   https://*        → any HTTPS host
//   *                → any HTTPS host (sentinel)
//   https://*.x      → x and all subdomains of x
//   https://x        → exact host x
//
// Even with broad wildcard, always requires protocol === "https:".

export interface HostPolicyResult {
    allowed: boolean;
    host: string;
    matchedPattern?: string;
    reason?: string;
}

// Default public ArcGIS hosts
const DEFAULT_PUBLIC_HOSTS = [
    "https://*.arcgis.com",
    "https://*.arcgisonline.com",
];

// These are populated by the build system via providerBuild.ts
let _allowedPatterns: string[] = [...DEFAULT_PUBLIC_HOSTS];

export function setAllowedHostPatterns(patterns: string[]) {
    _allowedPatterns = [...new Set([...DEFAULT_PUBLIC_HOSTS, ...patterns])];
}

export function getAllowedHostPatterns(): readonly string[] {
    return _allowedPatterns;
}

export function checkHostPolicy(url: string): HostPolicyResult {
    try {
        const parsed = new URL(url);
        const host = parsed.host;

        // Check HTTPS requirement — always enforced
        if (parsed.protocol !== "https:") {
            return {
                allowed: false,
                host,
                reason: `Only HTTPS services are supported. Got: ${parsed.protocol}`,
            };
        }

        // Check for embedded credentials
        if (parsed.username || parsed.password) {
            return {
                allowed: false,
                host,
                reason: "URLs with embedded credentials are not allowed.",
            };
        }

        // Check against allowed patterns
        for (const pattern of _allowedPatterns) {
            if (matchesPattern(host, pattern)) {
                return { allowed: true, host, matchedPattern: pattern };
            }
        }

        return {
            allowed: false,
            host,
            reason: `The host "${host}" is not in the allowed list for this HyperPBI package. Add it to HYPERPBI_MAP_HOSTS and rebuild the maps package.`,
        };
    } catch {
        return { allowed: false, host: url, reason: "Invalid URL format." };
    }
}

function matchesPattern(host: string, pattern: string): boolean {
    // Remove protocol from pattern before matching
    const cleanPattern = pattern.replace(/^https?:\/\//, "");

    // Universal wildcard: "https://*" or "*" matches any HTTPS host
    if (cleanPattern === "*") return true;

    // Subdomain wildcard: "*.example.com"
    if (cleanPattern.startsWith("*.")) {
        const domain = cleanPattern.slice(2);
        return host === domain || host.endsWith("." + domain);
    }

    // Exact host match
    return host === cleanPattern;
}

export function isExternalProviderAvailable(): boolean {
    // Will be replaced by build system
    try {
        return (globalThis as any).__HYPERPBI_MAPS_ENABLED__ === true;
    } catch {
        return false;
    }
}
